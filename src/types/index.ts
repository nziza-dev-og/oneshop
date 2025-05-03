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
    createdAt: Timestamp | Date; // Can be Timestamp from Firestore or Date object
    isAdmin: boolean;
    // Add other profile fields like address, phone number etc. if needed
}

// Order information stored in Firestore
export interface Order {
  id: string; // Firestore document ID
  userId: string;
  items: CartItem[]; // Store denormalized item details
  totalPrice: number;
  orderDate: Timestamp | Date; // Firestore Timestamp or Date object
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'; // Example statuses
  // Add shippingAddress, paymentMethod etc. if needed
}
