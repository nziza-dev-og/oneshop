import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase/firebase'; // Import db instance
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Error message: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout Session Completed:', session.id);

       // Retrieve metadata (userId)
       const userId = session.metadata?.userId;
       if (!userId) {
           console.error("Webhook Error: Missing userId in session metadata", session.id);
           return NextResponse.json({ error: 'Missing userId in metadata' }, { status: 400 });
       }

        // Retrieve line items to reconstruct the order details
       // Important: Stripe checkout sessions only provide line items for recent sessions.
       // For reliability, consider storing necessary order details (like product IDs and quantities)
       // in the session metadata, or query Stripe API again if needed.
        try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 }); // Adjust limit as needed

             if (!lineItems || lineItems.data.length === 0) {
                 console.error("Webhook Error: Could not retrieve line items for session", session.id);
                 return NextResponse.json({ error: 'Could not retrieve line items' }, { status: 400 });
             }

             // Reconstruct order data from line items and metadata
            const orderItems = lineItems.data.map(item => ({
                // Assuming price.product gives you enough info, or use metadata if stored there
                id: typeof item.price?.product === 'string' ? item.price.product : 'unknown_product', // Use Stripe Product ID or fallback
                name: item.description, // Item description from Stripe
                price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0, // Convert from cents
                quantity: item.quantity || 0,
                // You might need to fetch imageUrl/imageHint based on the product ID if not in metadata
                imageUrl: '', // Placeholder - fetch or add to metadata
                imageHint: '', // Placeholder
            }));

            const orderData = {
                userId: userId,
                items: orderItems,
                totalPrice: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
                orderDate: serverTimestamp(), // Use server timestamp
                status: 'Processing', // Initial status after successful payment
                stripeCheckoutSessionId: session.id, // Store Stripe session ID for reference
                paymentStatus: session.payment_status, // Store payment status
            };

            // Save the order to Firestore 'orders' collection
            await addDoc(collection(db, "orders"), orderData);
            console.log(`Order created in Firestore for session: ${session.id}, User: ${userId}`);

        } catch (lineItemError: any) {
             console.error(`Webhook Error: Failed to process line items or save order for session ${session.id}:`, lineItemError);
             // Decide if you should still return 200 to Stripe or an error
             return NextResponse.json({ error: `Failed to process order: ${lineItemError.message}` }, { status: 500 });
        }

      break;
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
      // Handle successful payment intent (e.g., update order status if needed, though checkout.session.completed is often sufficient)
      break;
    case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent failed: ${failedPaymentIntent.id}`, failedPaymentIntent.last_payment_error?.message);
        // Handle failed payment (e.g., notify user, update order status)
        break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
