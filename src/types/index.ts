import type { Timestamp } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageHint: string; // For AI image generation hint
  createdAt?: number | null; // Changed to number (milliseconds) or null for serialization
}

export interface CartItem extends Product {
  quantity: number;
}

// User profile information stored in Firestore
export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    // Use `Timestamp | Date | null` as Firestore timestamp might not be set immediately
    // on client-side creation before server timestamp resolves.
    // It will be `Timestamp` when read from Firestore, `Date` after `.toDate()`,
    // and potentially `null` if read before the server timestamp is applied or if field is optional.
    createdAt: Timestamp | Date | null;
    isAdmin: boolean;
    // Notification preferences
    notificationPreferences?: {
        marketing?: boolean;
        orderUpdates?: boolean;
        newProducts?: boolean;
    };
    // Add other profile fields like address, phone number etc. if needed
}

// Order information stored in Firestore
export interface Order {
  id: string; // Firestore document ID
  userId: string;
  items: CartItem[]; // Store denormalized item details
  totalPrice: number;
  orderDate: Timestamp | Date; // Changed to Timestamp | Date, fallback handled in components
  status: 'pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'; // Example statuses
  stripeCheckoutSessionId?: string; // Added Stripe session ID
  paymentStatus?: string; // Added payment status from Stripe (e.g., 'paid', 'unpaid', or our custom 'pending')
  customerEmail?: string | null; // Added customer email
  // Add shippingAddress, paymentMethod etc. if needed
}

// Notification structure
export interface Notification {
    id: string; // Firestore document ID
    userId: string; // Target user ID ('all' or specific UID, 'admin' for admin-only)
    message: string;
    // Add 'order_update', 'new_product', 'admin_action' types
    type: 'order_update' | 'promotion' | 'system_alert' | 'admin_action' | 'general' | 'contact_reply' | 'new_product'; // Added types
    link?: string; // Optional link (e.g., to an order page like '/dashboard/orders' or '/products/{productId}' or '/admin/orders/{orderId}')
    read: boolean;
    createdAt: Timestamp | Date | null; // Use Timestamp | Date | null
}

// Contact Message structure
export interface ContactMessage {
  id: string; // Firestore document ID
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Timestamp | Date | null;
  status: 'new' | 'read' | 'archived'; // Status for admin management
}

// Address structure
export interface Address {
  id: string; // Firestore document ID
  userId: string; // Link back to the user
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean; // Optional: Mark as default shipping/billing
  type?: 'shipping' | 'billing' | 'both'; // Optional: Address type
}


