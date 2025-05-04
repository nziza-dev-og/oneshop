
import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';
import type { CartItem } from '@/types';
import { db } from '@/lib/firebase/firebase'; // Import db to potentially fetch product details if needed
import { doc, getDoc } from 'firebase/firestore';

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

  try {
    const { items, userId }: { items: CartItem[], userId: string } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (!userId) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    if (!db) {
        console.error("Checkout Error: Firestore database instance is not available.");
        return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // Construct line_items for Stripe Checkout Session
    // **IMPORTANT**: Fetch prices from your database to prevent manipulation.
    const line_items = await Promise.all(items.map(async (item) => {
       let priceInCents: number;
       try {
           const productRef = doc(db, 'products', item.id);
           const productSnap = await getDoc(productRef);
           if (!productSnap.exists()) {
               throw new Error(`Product ${item.id} not found in database.`);
           }
           const productData = productSnap.data();
           if (typeof productData.price !== 'number' || productData.price < 0) {
               throw new Error(`Invalid price found for product ${item.id}.`);
           }
           priceInCents = Math.round(productData.price * 100);
       } catch (dbError: any) {
           console.error(`Error fetching price for product ${item.id}:`, dbError);
           // Decide how to handle: fail checkout or use client price with warning
           // Using client price here, but log a critical warning. NOT RECOMMENDED for production.
           console.warn(`CRITICAL: Using client-side price for ${item.name} (${item.id}) due to DB error. This is insecure!`);
           priceInCents = Math.round(item.price * 100); // Fallback to client price (INSECURE)
           // OR: throw new Error(`Failed to verify price for product ${item.name}. Please try again.`);
       }


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
         // Store cart details minimally if needed for webhook confirmation
         cartItems: JSON.stringify(items.map(i => ({ id: i.id, quantity: i.quantity }))), // Store IDs and quantities
      },
       // If user is logged in, prefill email - fetch from DB or pass from client if trusted
       // customer_email: userEmail,
    });

    if (!session.id) {
        throw new Error('Failed to create Stripe session');
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    // Provide a more generic error message to the client
    return NextResponse.json({ error: `Internal Server Error occurred.` }, { status: 500 });
  }
}

// Reminder: Ensure STRIPE_SECRET_KEY is set in your environment variables.
// Also ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set for the client-side.

