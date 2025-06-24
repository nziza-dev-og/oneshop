
import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import type { CartItem, Notification, Order } from '@/types';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
} else {
  console.error('Stripe secret key is missing. Set STRIPE_SECRET_KEY in .env');
}

if (!webhookSecret) {
  console.error('Stripe webhook secret is missing. Set STRIPE_WEBHOOK_SECRET in .env');
}

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe service not configured' }, { status: 500 });
  }
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }

  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the 'checkout.session.completed' event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('Processing checkout.session.completed for session:', session.id);

    try {
      const { orderId, userId } = session.metadata || {};

      if (!orderId || !userId) {
        throw new Error(`Missing metadata (orderId or userId) for session: ${session.id}`);
      }
      
      // 1. Fetch the pending order from Firestore
      const orderDocRef = doc(db, 'orders', orderId);
      const orderDocSnap = await getDoc(orderDocRef);

      if (!orderDocSnap.exists()) {
          throw new Error(`Order with ID ${orderId} not found.`);
      }

      const orderData = orderDocSnap.data() as Order;

      // 2. Idempotency Check: Ensure we only process pending orders.
      if (orderData.status !== 'pending') {
          console.log(`Order ${orderId} has already been processed (status: ${orderData.status}). Skipping.`);
          return NextResponse.json({ received: true, message: 'Order already processed' });
      }

      // 3. Update the order document with payment details (Critical Step)
      await updateDoc(orderDocRef, {
        status: 'Processing',
        paymentStatus: session.payment_status,
        stripeCheckoutSessionId: session.id,
        customerEmail: session.customer_details?.email,
      });
      console.log(`✅ Order ${orderId} updated successfully for session ${session.id}.`);
      
      // 4. Send notifications (Non-critical, wrapped in try/catch)
      
      // Notify customer
      try {
        await addDoc(collection(db, 'notifications'), {
          userId,
          message: `Your order #${orderId.slice(0, 6)}... has been placed!`,
          type: 'order_update',
          link: '/dashboard/orders',
          read: false,
          createdAt: serverTimestamp(),
        } as Omit<Notification, 'id'>);
        console.log(`Sent order confirmation notification to user ${userId}.`);
      } catch (e) {
        console.error(`Failed to send order notification to user ${userId}:`, e);
      }

      // Notify admins
      try {
        const adminUsersQuery = query(collection(db, 'users'), where('isAdmin', '==', true));
        const adminUsersSnapshot = await getDocs(adminUsersQuery);
        if (!adminUsersSnapshot.empty) {
          const batch = writeBatch(db);
          const notificationsRef = collection(db, 'notifications');
          adminUsersSnapshot.forEach((adminDoc) => {
            const notifDocRef = doc(notificationsRef); // Create a new doc ref for each notification
            batch.set(notifDocRef, {
              userId: adminDoc.id,
              message: `New order #${orderId.slice(0, 6)} placed by ${session.customer_details?.email ?? userId}.`,
              type: 'admin_action',
              link: `/admin/orders/${orderId}`,
              read: false,
              createdAt: serverTimestamp(),
            } as Omit<Notification, 'id'>);
          });
          await batch.commit();
          console.log(`Sent new order notifications to ${adminUsersSnapshot.size} admin(s).`);
        }
      } catch (e) {
        console.error('Failed to send new order notifications to admins:', e);
      }

    } catch (error: any) {
      console.error(`Webhook processing error for session ${session.id}:`, error.message);
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
  } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      const userId = intent.metadata?.userId;

      if (orderId && db) {
        // Optionally update the order status to 'failed' or 'cancelled'
        const orderDocRef = doc(db, 'orders', orderId);
        try {
            await updateDoc(orderDocRef, {
                status: 'Cancelled',
                paymentStatus: 'failed',
            });
        } catch(e) {
             console.error(`Failed to update order ${orderId} to failed status:`, e);
        }
      }

      if (userId && db) {
        try {
          await addDoc(collection(db, 'notifications'), {
            userId,
            message: `Payment failed: ${intent.last_payment_error?.message ?? 'Unknown error'}. Please check your payment details.`,
            type: 'system_alert',
            link: '/cart',
            read: false,
            createdAt: serverTimestamp(),
          });
        } catch (e) {
            console.error('Failed to send payment failure notification:', e);
        }
      }
  } else {
    console.log(`Received unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
