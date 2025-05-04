
import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase/firebase'; // db might be null
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch } from "firebase/firestore"; // Import necessary Firestore functions
import type { CartItem, Notification } from '@/types'; // Import types

// Check for Stripe keys during initialization
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

let stripe: Stripe | null = null;

if (!stripeSecretKey) {
  console.error("Stripe secret key is missing. Ensure STRIPE_SECRET_KEY is set in environment variables.");
} else {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  });
}

if (!webhookSecret) {
    console.error("Stripe webhook secret is missing. Ensure STRIPE_WEBHOOK_SECRET is set in environment variables.");
}

export async function POST(req: NextRequest) {
  // Check if Stripe and webhook secret are configured
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe service or webhook secret is not configured.' }, { status: 500 });
  }

  // Check if db is available early
  if (!db) {
      console.error("Webhook Error: Firestore database instance is not available.");
      // Return 503 Service Unavailable, as this is a server-side configuration issue
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
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

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout Session Completed:', session.id);

       // Retrieve metadata
       const userId = session.metadata?.userId;
       const cartItemsString = session.metadata?.cartItems; // Get cart details from metadata

       if (!userId) {
           console.error("Webhook Error: Missing userId in session metadata for session:", session.id);
           // Return 400 Bad Request as the necessary info is missing from Stripe's side (or wasn't sent)
           return NextResponse.json({ error: 'Missing userId in metadata' }, { status: 400 });
       }
       if (!cartItemsString) {
            console.error("Webhook Error: Missing cartItems in session metadata for session:", session.id);
            return NextResponse.json({ error: 'Missing cartItems in metadata' }, { status: 400 });
       }

        // Avoid processing the same session multiple times (idempotency)
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, where('stripeCheckoutSessionId', '==', session.id));
            const existingOrders = await getDocs(q);
            if (!existingOrders.empty) {
                console.log(`Webhook Info: Order for session ${session.id} already processed.`);
                return NextResponse.json({ received: true, message: 'Order already processed.' });
            }
        } catch (dbError: any) {
            console.error(`Webhook Error: Failed to check for existing order for session ${session.id}:`, dbError);
            // Continue processing but log the error, maybe retry logic is needed later
        }

        // Retrieve line items to confirm details - this is more reliable than metadata alone
        try {
            // Note: listLineItems might not contain full product details like image URL.
            // You might need to fetch these from your DB based on product ID if required for the order document.
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 }); // Adjust limit as needed

             if (!lineItems || lineItems.data.length === 0) {
                 console.error("Webhook Error: Could not retrieve line items for session", session.id);
                 return NextResponse.json({ error: 'Could not retrieve line items' }, { status: 400 });
             }

             // Parse cart items from metadata for reconciliation/product details
             let cartItemsFromMeta: { id: string; quantity: number }[] = [];
             try {
                 cartItemsFromMeta = JSON.parse(cartItemsString);
             } catch (parseError) {
                 console.error(`Webhook Error: Failed to parse cartItems metadata for session ${session.id}:`, parseError);
                 return NextResponse.json({ error: 'Invalid cartItems metadata' }, { status: 400 });
             }

             // Create order items - fetch full product details from DB based on IDs in cartItemsFromMeta
             const orderItemsPromises = cartItemsFromMeta.map(async (metaItem) => {
                 const productRef = doc(db, 'products', metaItem.id);
                 const productSnap = await getDoc(productRef);
                 if (!productSnap.exists()) {
                     // Handle case where product doesn't exist (maybe was deleted)
                     console.error(`Webhook Error: Product ${metaItem.id} not found in DB for order creation.`);
                     // Option 1: Throw error to fail webhook (Stripe will retry)
                     // throw new Error(`Product ${metaItem.id} not found.`);
                     // Option 2: Skip item or use placeholder data (less ideal)
                     return null; // Skip this item
                 }
                 const productData = productSnap.data();
                 return {
                     id: metaItem.id,
                     name: productData.name,
                     price: productData.price,
                     quantity: metaItem.quantity,
                     imageUrl: productData.imageUrl || '', // Get image URL from DB
                     imageHint: productData.imageHint || '', // Get hint from DB
                 } as CartItem;
             });

             const resolvedOrderItems = await Promise.all(orderItemsPromises);
             const validOrderItems = resolvedOrderItems.filter(item => item !== null) as CartItem[];

             if (validOrderItems.length !== cartItemsFromMeta.length) {
                 // Log discrepancy if some products were skipped
                 console.warn(`Webhook Warning: Some items for session ${session.id} could not be added to the order due to missing product data.`);
                 // Decide if checkout should fail or proceed with partial order
             }

             if (validOrderItems.length === 0) {
                  console.error(`Webhook Error: No valid items could be processed for order in session ${session.id}.`);
                 return NextResponse.json({ error: 'No valid items found for order' }, { status: 400 });
             }


            const orderData = {
                userId: userId,
                items: validOrderItems,
                totalPrice: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
                orderDate: serverTimestamp(), // Use server timestamp
                status: 'Processing', // Initial status after successful payment
                stripeCheckoutSessionId: session.id, // Store Stripe session ID for reference
                paymentStatus: session.payment_status, // Store payment status (e.g., 'paid')
                customerEmail: session.customer_details?.email, // Store customer email if available
            };

            // Save the order to Firestore 'orders' collection
            await addDoc(collection(db, "orders"), orderData);
            console.log(`Order created in Firestore for session: ${session.id}, User: ${userId}`);

            // Optionally: Send order confirmation notification to user
             try {
                 const notificationData: Omit<Notification, 'id' | 'createdAt'> = {
                     userId: userId,
                     message: `Your order #${orderData.stripeCheckoutSessionId.substring(0, 6)}... has been placed successfully!`,
                     type: 'order_update',
                     link: '/dashboard/orders', // Link to user's order page
                     read: false,
                     createdAt: serverTimestamp(),
                 };
                 await addDoc(collection(db, "notifications"), notificationData);
                 console.log(`Order confirmation notification sent to user ${userId} for session ${session.id}`);
             } catch (notificationError) {
                 console.error("Webhook Error: Failed to send order confirmation notification:", notificationError);
                 // Don't fail the webhook for notification error, just log it
             }


        } catch (processError: any) {
             console.error(`Webhook Error: Failed to process checkout.session.completed ${session.id}:`, processError);
             // Return 500 Internal Server Error to Stripe, so it retries
             return NextResponse.json({ error: `Failed to process order: ${processError.message}` }, { status: 500 });
        }

      break;
    case 'payment_intent.succeeded':
      // Often covered by checkout.session.completed, but useful for other payment flows
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
      // Handle successful payment intent (e.g., update order status if not already done)
      break;
    case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent failed: ${failedPaymentIntent.id}`, failedPaymentIntent.last_payment_error?.message);
        // Handle failed payment (e.g., notify user, update order status to 'Failed')
        // Find the corresponding order by session ID (if available in intent metadata or via lookup)
        // Send notification to user about payment failure
        break;
    // ... handle other relevant event types (e.g., refunds)
    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
