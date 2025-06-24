
import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import type { CartItem, Order } from '@/types';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Check for Stripe secret key during initialization
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (!stripeSecretKey) {
  console.error("Stripe secret key is missing. Ensure STRIPE_SECRET_KEY is set in environment variables.");
} else {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20', // Use the latest API version
  });
}

export async function POST(req: NextRequest) {
  // Ensure Stripe was initialized
  if (!stripe) {
      return NextResponse.json({ error: 'Stripe service is not configured.' }, { status: 500 });
  }
  if (!db) {
    console.error("Checkout Error: Firestore database instance is not available.");
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    const { items, userId }: { items: CartItem[], userId: string } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!userId) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // 1. Verify product prices from DB and prepare order items
    let totalOrderPrice = 0;
    const verifiedOrderItems: CartItem[] = await Promise.all(items.map(async (item) => {
       const productRef = doc(db, 'products', item.id);
       const productSnap = await getDoc(productRef);
       if (!productSnap.exists()) {
           throw new Error(`Product ${item.id} not found in database.`);
       }
       const productData = productSnap.data();
       if (typeof productData.price !== 'number' || productData.price < 0) {
           throw new Error(`Invalid price found for product ${item.id}.`);
       }
       
       totalOrderPrice += productData.price * item.quantity;

       return {
         ...item, // Use original cart item data
         price: productData.price, // but with the verified price
       };
    }));


    // 2. Create the order document in Firestore with a 'pending' status
    const ordersRef = collection(db, 'orders');
    const orderData: Omit<Order, 'id'> = {
      userId,
      items: verifiedOrderItems,
      totalPrice: totalOrderPrice,
      orderDate: serverTimestamp(),
      status: 'pending', // New status for pre-checkout orders
      paymentStatus: 'pending',
    };
    const orderRef = await addDoc(ordersRef, orderData);
    console.log(`Created pending order with ID: ${orderRef.id}`);

    // 3. Create Stripe line items from verified data
    const line_items = verifiedOrderItems.map(item => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: item.name,
                images: [item.imageUrl],
            },
            unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
    }));

    const origin = req.headers.get('origin') || 'http://localhost:9002';

    // 4. Create Stripe Checkout Session, passing our internal order ID in metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`, // Go back to cart on cancel
      metadata: {
        orderId: orderRef.id, // IMPORTANT: Pass our internal order ID
        userId: userId,
      },
    });

    if (!session.id) {
        throw new Error('Failed to create Stripe session');
    }

    // Return the session ID to the client for redirection
    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: `Internal Server Error occurred.` }, { status: 500 });
  }
}
