// app/api/webhook/route.ts
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

// Environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

let stripe: Stripe | null = null;

if (!stripeSecretKey) {
  console.error('Stripe secret key is missing. Set STRIPE_SECRET_KEY in .env');
} else {
  stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
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
    return NextResponse.json({ error: `Webhook signature error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const cartItemsString = session.metadata?.cartItems;

        if (!userId || !cartItemsString) {
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        const ordersRef = collection(db, 'orders');
        const existing = await getDocs(query(ordersRef, where('stripeCheckoutSessionId', '==', session.id)));
        if (!existing.empty) {
          return NextResponse.json({ received: true, message: 'Order already processed' });
        }

        let cartItems: { id: string; quantity: number }[] = [];
        try {
          cartItems = JSON.parse(cartItemsString).filter(
            (item: any) => typeof item.id === 'string' && typeof item.quantity === 'number'
          );
        } catch {
          return NextResponse.json({ error: 'Invalid cartItems format' }, { status: 400 });
        }

        const orderItems = await Promise.all(
          cartItems.map(async ({ id, quantity }) => {
            const productRef = doc(db, 'products', id);
            const snap = await getDoc(productRef);
            if (!snap.exists()) throw new Error(`Product ${id} not found`);
            const data = snap.data();
            return {
              id,
              name: data.name ?? 'Unknown',
              price: data.price ?? 0,
              quantity,
              imageUrl: data.imageUrl ?? '',
              imageHint: data.imageHint ?? '',
              description: data.description ?? '',
            } as CartItem;
          })
        );

        const order: Omit<Order, 'id'> = {
          userId,
          items: orderItems,
          totalPrice: (session.amount_total ?? 0) / 100,
          orderDate: serverTimestamp(),
          status: 'Processing',
          stripeCheckoutSessionId: session.id,
          paymentStatus: session.payment_status,
          customerEmail: session.customer_details?.email,
        };

        const orderRef = await addDoc(ordersRef, order);

        await addDoc(collection(db, 'notifications'), {
          userId,
          message: `Your order #${orderRef.id.slice(0, 6)}... was placed!`,
          type: 'order_update',
          link: '/dashboard/orders',
          read: false,
          createdAt: serverTimestamp(),
        });

        const adminUsers = await getDocs(query(collection(db, 'users'), where('isAdmin', '==', true)));
        const adminBatch = writeBatch(db);
        const notifRef = collection(db, 'notifications');

        adminUsers.forEach((admin) => {
          const notif = {
            userId: admin.id,
            message: `New order #${orderRef.id.slice(0, 6)}... placed by ${order.customerEmail ?? userId}.`,
            type: 'admin_action',
            link: `/admin/orders/${orderRef.id}`,
            read: false,
            createdAt: serverTimestamp(),
          };
          adminBatch.set(doc(notifRef), notif);
        });

        await adminBatch.commit();
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const userId = intent.metadata?.userId;
        if (userId && db) {
          await addDoc(collection(db, 'notifications'), {
            userId,
            message: `Payment failed: ${intent.last_payment_error?.message ?? 'Unknown error'}.`,
            type: 'system_alert',
            link: '/dashboard/orders',
            read: false,
            createdAt: serverTimestamp(),
          });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent succeeded: ${intent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }
  } catch (error: any) {
    console.error(`Webhook processing error: ${error.message}`);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
