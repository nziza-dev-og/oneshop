import type { Timestamp } from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageHint: string; // For AI image generation hint
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
    // and potentially `null` if read before the server timestamp is applied.
    createdAt: Timestamp | Date | null;
    isAdmin: boolean;
    // Add other profile fields like address, phone number etc. if needed
}

// Order information stored in Firestore
export interface Order {
  id: string; // Firestore document ID
  userId: string;
  items: CartItem[]; // Store denormalized item details
  totalPrice: number;
  orderDate: Timestamp | Date | null; // Use Timestamp | Date | null
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'; // Example statuses
  // Add shippingAddress, paymentMethod etc. if needed
}
