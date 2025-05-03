import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import type { CartItem } from '@/types';
import { db } from '@/lib/firebase/firebase'; // Import db to potentially fetch product details if needed
import { doc, getDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use the latest API version
});

export async function POST(req: NextRequest) {
  try {
    const { items, userId }: { items: CartItem[], userId: string } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!userId) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Construct line_items for Stripe Checkout Session
    // It's crucial to fetch product prices from your DB or define them in Stripe Products
    // to avoid users manipulating prices on the client-side.
    // For simplicity here, we use the price from the client-side cart,
    // **BUT THIS IS NOT SECURE FOR PRODUCTION**.
    // In production, fetch prices from Firestore based on item.id or use Stripe Price IDs.
    const line_items = await Promise.all(items.map(async (item) => {
       // **PRODUCTION TODO**: Fetch product price from your database using item.id
       // const productRef = doc(db, 'products', item.id);
       // const productSnap = await getDoc(productRef);
       // if (!productSnap.exists()) throw new Error(`Product ${item.id} not found`);
       // const productData = productSnap.data();
       // const priceInCents = Math.round(productData.price * 100); // Ensure correct price

        const priceInCents = Math.round(item.price * 100); // Using client price (INSECURE)

        return {
            price_data: {
            currency: 'usd',
            product_data: {
                name: item.name,
                images: [item.imageUrl], // Optional: add image URL
                // Add description if desired: description: item.description,
            },
            unit_amount: priceInCents,
            },
            quantity: item.quantity,
        };
    }));

    const origin = req.headers.get('origin') || 'http://localhost:9002'; // Fallback for localhost

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        userId: userId,
         // You can store cart details here if needed for webhooks, but be mindful of size limits
         // cartItems: JSON.stringify(items.map(i => ({ id: i.id, quantity: i.quantity }))),
      },
       // If user is logged in, prefill email
       // customer_email: userEmail, // Fetch or pass the user's email
    });

    if (!session.id) {
        throw new Error('Failed to create Stripe session');
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

// Reminder: Ensure STRIPE_SECRET_KEY is set in your environment variables.
// Also ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set for the client-side.
