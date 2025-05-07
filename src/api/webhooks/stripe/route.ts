
import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { db } from '@/lib/firebase/firebase'; // db might be null
import { collection, addDoc, serverTimestamp, query, where, getDocs, writeBatch, doc, getDoc } from "firebase/firestore"; // Import necessary Firestore functions, including doc and getDoc
import type { CartItem, Notification, Order } from '@/types'; // Import types, including Order

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
    console.error("Webhook Error: Stripe service or webhook secret is not configured. Ensure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set in environment variables.");
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
            // We must fetch these from our DB based on product ID stored in metadata.

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
                     console.error(`Webhook Error: Product ${metaItem.id} not found in DB for order creation.`);
                     // Option 1: Throw error to fail webhook (Stripe will retry)
                     throw new Error(`Product ${metaItem.id} not found.`);
                     // Option 2: Skip item or use placeholder data (less ideal)
                     // return null; // Skip this item
                 }
                 const productData = productSnap.data();
                 // Ensure all necessary fields are present in the CartItem type
                 return {
                     id: metaItem.id,
                     name: productData.name || 'Unknown Product', // Add fallback
                     price: productData.price || 0, // Add fallback
                     quantity: metaItem.quantity,
                     imageUrl: productData.imageUrl || '', // Get image URL from DB
                     imageHint: productData.imageHint || '', // Get hint from DB
                     description: productData.description || '', // Include description
                     // Add other Product fields if they exist in CartItem definition
                 } as CartItem;
             });

             const resolvedOrderItems = await Promise.all(orderItemsPromises);
             // Filter out any null values if Option 2 (skipping) was chosen above
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


            const orderData: Omit<Order, 'id'> = { // Use Omit to exclude 'id' which Firestore generates
                userId: userId,
                items: validOrderItems, // Use the fully detailed items fetched from DB
                totalPrice: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
                orderDate: serverTimestamp(), // Use server timestamp
                status: 'Processing', // Initial status after successful payment
                stripeCheckoutSessionId: session.id, // Store Stripe session ID for reference
                paymentStatus: session.payment_status, // Store payment status (e.g., 'paid')
                customerEmail: session.customer_details?.email, // Store customer email if available
            };

            // Save the order to Firestore 'orders' collection
            const newOrderRef = await addDoc(collection(db, "orders"), orderData);
            console.log(`Order ${newOrderRef.id} created in Firestore for session: ${session.id}, User: ${userId}`);

            // Send order confirmation notification to user
             try {
                 const notificationData: Omit<Notification, 'id' | 'createdAt'> = {
                     userId: userId,
                     message: `Your order #${newOrderRef.id.substring(0, 6)}... has been placed successfully!`,
                     type: 'order_update',
                     link: `/dashboard/orders`, // Link to user's order page
                     read: false,
                     createdAt: serverTimestamp(),
                 };
                 await addDoc(collection(db, "notifications"), notificationData);
                 console.log(`Order confirmation notification sent to user ${userId} for order ${newOrderRef.id}`);
             } catch (notificationError) {
                 console.error("Webhook Error: Failed to send order confirmation notification:", notificationError);
                 // Don't fail the webhook for notification error, just log it
             }

             // Send notification to admins about the new order
             try {
                 // Fetch admin users (you might cache this or use a specific 'admins' group ID)
                 const usersRef = collection(db, 'users');
                 const adminQuery = query(usersRef, where('isAdmin', '==', true));
                 const adminSnapshot = await getDocs(adminQuery);
                 const adminBatch = writeBatch(db);
                 const adminNotificationsRef = collection(db, "notifications");

                 adminSnapshot.forEach(adminDoc => {
                     const adminNotification: Omit<Notification, 'id' | 'createdAt'> = {
                         userId: adminDoc.id, // Target the specific admin
                         message: `New order #${newOrderRef.id.substring(0, 6)}... placed by ${orderData.customerEmail || userId}.`,
                         type: 'admin_action', // Use a specific type for admin alerts
                         link: `/admin/orders/${newOrderRef.id}`, // Link to the order detail in admin panel
                         read: false,
                         createdAt: serverTimestamp(),
                     };
                     const newAdminNotifRef = doc(adminNotificationsRef); // Auto-generate ID
                     adminBatch.set(newAdminNotifRef, adminNotification);
                 });
                 await adminBatch.commit();
                 console.log(`New order notification sent to ${adminSnapshot.size} admins for order ${newOrderRef.id}`);
             } catch (adminNotificationError) {
                console.error("Webhook Error: Failed to send new order notification to admins:", adminNotificationError);
                // Log error, but don't fail the webhook
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
      // Handle successful payment intent (e.g., update order status if not already done via checkout session)
      break;
    case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent failed: ${failedPaymentIntent.id}`, failedPaymentIntent.last_payment_error?.message);
        // Handle failed payment (e.g., notify user, potentially update order status to 'Failed')
        // Find the corresponding order by checkout session ID (if stored on payment intent metadata or via lookup)
        // Send notification to user about payment failure
        const failedUserId = failedPaymentIntent.metadata?.userId; // Assuming userId is passed in metadata
        if (failedUserId && db) {
            try {
                const failureNotification: Omit<Notification, 'id' | 'createdAt'> = {
                     userId: failedUserId,
                     message: `Your recent payment attempt failed: ${failedPaymentIntent.last_payment_error?.message || 'Unknown reason'}. Please check your payment method or contact support.`,
                     type: 'system_alert',
                     link: '/dashboard/orders', // Or link to payment methods page
                     read: false,
                     createdAt: serverTimestamp(),
                };
                 await addDoc(collection(db, "notifications"), failureNotification);
            } catch (failNotificationError) {
                 console.error("Webhook Error: Failed to send payment failure notification:", failNotificationError);
            }
        }
        break;
    // ... handle other relevant event types (e.g., refunds)
    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

