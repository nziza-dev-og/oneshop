
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
  getDoc,
  updateDoc,
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
    // 1. Retrieve session details from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
        throw new Error('Stripe session not found.');
    }
    
    // 2. Get the pending order ID from metadata
    const { orderId, userId } = session.metadata || {};
    if (!orderId) {
        throw new Error('Order ID not found in session metadata. Could not fulfill order.');
    }
    if (!userId) {
        throw new Error('User ID not found in session metadata.');
    }

    // 3. Get the pending order document reference
    const orderDocRef = doc(db, 'orders', orderId);
    const orderDocSnap = await getDoc(orderDocRef);

    if (!orderDocSnap.exists()) {
        throw new Error(`Pending order with ID ${orderId} not found.`);
    }

    // 4. Check if the order is already processed
    const existingOrderData = orderDocSnap.data();
    if (existingOrderData.status !== 'pending') {
        console.log(`Order ${orderId} has already been processed. Status: ${existingOrderData.status}`);
        return { success: true, message: 'Order already processed.' };
    }

    // 5. Update the order document with payment details
    await updateDoc(orderDocRef, {
        status: 'Processing', // Change status from 'pending'
        paymentStatus: session.payment_status,
        stripeCheckoutSessionId: session.id,
        customerEmail: session.customer_details?.email,
    });
    
    console.log(`✅ Order ${orderId} updated successfully for session ${session.id}.`);

    // 6. Send notifications (non-blocking)
    sendNotifications(orderId, userId, session.customer_details?.email);

    return { success: true, message: 'Order fulfilled successfully.' };

  } catch (error: any) {
    console.error(`Failed to fulfill order for session ${sessionId}:`, error);
    return { success: false, error: error.message };
  }
}
