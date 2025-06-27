'use server';

import Stripe from 'stripe';
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
} from 'firebase/firestore';
import type { CartItem, Notification, Order } from '@/types';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
}

async function sendNotifications(orderId: string, userId: string, customerEmail: string | null | undefined) {
    if (!db) return;

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
            const notifDocRef = doc(notificationsRef);
            batch.set(notifDocRef, {
              userId: adminDoc.id,
              message: `New order #${orderId.slice(0, 6)} placed by ${customerEmail ?? userId}.`,
              type: 'admin_action',
              link: `/admin/orders/${orderId}`,
              read: false,
              createdAt: serverTimestamp(),
            } as Omit<Notification, 'id'>);
          });
          await batch.commit();
        }
    } catch (e) {
        console.error('Failed to send new order notifications to admins:', e);
    }
}

export async function createPendingOrder(items: CartItem[], userId: string) {
  if (!db) {
    return { success: false, error: 'Database service is not configured.' };
  }
  if (!userId) {
     return { success: false, error: 'User is not authenticated.' };
  }
  if (!items || items.length === 0) {
    return { success: false, error: 'Cart is empty.' };
  }

  try {
    const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

    const newOrder: Omit<Order, 'id'> = {
      userId,
      items: items,
      totalPrice: totalPrice,
      orderDate: serverTimestamp(),
      status: 'pending', // Special status
      paymentStatus: 'unpaid',
      customerEmail: null, 
      stripeCheckoutSessionId: '',
    };

    const ordersRef = collection(db, 'orders');
    const orderDocRef = await addDoc(ordersRef, newOrder);

    console.log(`✅ Pending Order ${orderDocRef.id} created successfully for user ${userId}.`);

    return { success: true, orderId: orderDocRef.id, message: 'Pending order created.' };

  } catch (error: any) {
    console.error(`Failed to create pending order for user ${userId}:`, error);
    return { success: false, error: error.message };
  }
}


export async function fulfillOrder(sessionId: string) {
  if (!stripe || !db) {
    throw new Error('Server services (Stripe or DB) are not configured.');
  }

  try {
    // 1. Check if order already exists to prevent duplicates
    const ordersRef = collection(db, 'orders');
    const existingOrderQuery = query(ordersRef, where('stripeCheckoutSessionId', '==', sessionId));
    const existingOrderSnapshot = await getDocs(existingOrderQuery);

    if (!existingOrderSnapshot.empty) {
      console.log(`Order for session ${sessionId} already exists. Skipping creation.`);
      return { success: true, message: 'Order already processed.' };
    }

    // 2. Retrieve session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    if (!session || session.payment_status !== 'paid') {
      throw new Error('Payment not successful or session not found.');
    }

    const { userId } = session.metadata || {};
    if (!userId) {
      throw new Error('User ID not found in session metadata.');
    }

    // 3. Reconstruct cart items from Stripe line items
    const lineItems = session.line_items?.data || [];
    const purchasedItems: CartItem[] = lineItems.map((item) => {
      const product = item.price?.product as Stripe.Product;
      return {
        id: product.metadata.productId || product.id,
        name: product.name,
        price: (item.price?.unit_amount ?? 0) / 100,
        quantity: item.quantity ?? 0,
        imageUrl: product.images?.[0] || '',
        imageHint: product.metadata.imageHint || '',
      };
    });

    if (purchasedItems.length === 0) {
        throw new Error('No items found in Stripe session.');
    }

    // 4. Create the new order document
    const newOrder: Omit<Order, 'id'> = {
      userId,
      items: purchasedItems,
      totalPrice: session.amount_total ? session.amount_total / 100 : 0,
      orderDate: serverTimestamp(),
      status: 'Processing',
      paymentStatus: session.payment_status,
      stripeCheckoutSessionId: session.id,
      customerEmail: session.customer_details?.email,
    };

    const orderDocRef = await addDoc(ordersRef, newOrder);
    console.log(`✅ Order ${orderDocRef.id} created successfully for session ${session.id}.`);
    
    // 5. Send notifications (non-blocking)
    sendNotifications(orderDocRef.id, userId, session.customer_details?.email);

    return { success: true, message: 'Order created successfully.' };

  } catch (error: any) {
    console.error(`Failed to fulfill order for session ${sessionId}:`, error);
    return { success: false, error: error.message };
  }
}
