
import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import type { Notification } from '@/types';

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    // Order creation is now handled on the success page redirect.
    // This webhook can be used for other post-payment actions like sending receipts,
    // logging, or as a backup fulfillment method.
    console.log(`Webhook received for completed session: ${session.id}. Primary order fulfillment is handled on the client success page.`);

  } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      // Metadata may not be available on payment_intent, but we check just in case.
      // A more robust implementation might involve looking up the session via the intent ID.
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
