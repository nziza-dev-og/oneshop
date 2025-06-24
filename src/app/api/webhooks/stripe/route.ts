
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
      const { userId, cartItems: cartItemsString } = session.metadata || {};

      if (!userId || !cartItemsString) {
        throw new Error(`Missing metadata (userId or cartItems) for session: ${session.id}`);
      }

      // 1. Idempotency Check: Ensure we don't process the same order twice.
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('stripeCheckoutSessionId', '==', session.id));
      const existingOrders = await getDocs(q);
      if (!existingOrders.empty) {
        console.log(`Order for session ${session.id} already exists. Skipping.`);
        return NextResponse.json({ received: true, message: 'Order already processed' });
      }

      // 2. Parse cart items and fetch product data securely from DB
      const cartItems: { id: string; quantity: number }[] = JSON.parse(cartItemsString);
      const orderItemsPromises = cartItems.map(async ({ id, quantity }) => {
        const productRef = doc(db, 'products', id);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
          console.warn(`Product with ID ${id} not found. Skipping item in order ${session.id}.`);
          return null;
        }
        const productData = productSnap.data();
        return {
          id,
          quantity,
          name: productData.name ?? 'Unknown Product',
          price: productData.price ?? 0,
          imageUrl: productData.imageUrl ?? '',
          imageHint: productData.imageHint ?? '',
          description: productData.description ?? '',
        } as CartItem;
      });

      const resolvedOrderItems = await Promise.all(orderItemsPromises);
      const validOrderItems = resolvedOrderItems.filter((item): item is CartItem => item !== null);

      if (validOrderItems.length === 0) {
        throw new Error(`No valid products found for order in session ${session.id}.`);
      }

      // 3. Create and save the order document (Critical Step)
      const orderData: Omit<Order, 'id'> = {
        userId,
        items: validOrderItems,
        totalPrice: (session.amount_total ?? 0) / 100,
        orderDate: serverTimestamp(),
        status: 'Processing',
        stripeCheckoutSessionId: session.id,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
      };

      const orderRef = await addDoc(ordersRef, orderData);
      console.log(`✅ Order ${orderRef.id} created successfully for session ${session.id}.`);

      // 4. Send notifications (Non-critical, wrapped in try/catch)
      
      // Notify customer
      try {
        await addDoc(collection(db, 'notifications'), {
          userId,
          message: `Your order #${orderRef.id.slice(0, 6)}... has been placed!`,
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
              message: `New order #${orderRef.id.slice(0, 6)} placed by ${orderData.customerEmail ?? userId}.`,
              type: 'admin_action',
              link: `/admin/orders/${orderRef.id}`,
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
      const userId = intent.metadata?.userId;
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
