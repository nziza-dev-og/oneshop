"use client";

import type { CartItem, Product } from '@/types';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartState {
  items: CartItem[];
  wishlist: Product[]; // Added wishlist state
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  // Wishlist actions
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [], // Initialize wishlist
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          if (existingItem) {
            // Update quantity if item already exists
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          } else {
            // Add new item
            return {
              items: [...state.items, { ...product, quantity }],
            };
          }
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === productId ? { ...item, quantity } : item
            )
            .filter((item) => item.quantity > 0), // Remove item if quantity is 0 or less
        }));
      },
      clearCart: () => {
        set({ items: [] });
      },
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      // Wishlist implementations
      addToWishlist: (product) => {
        set((state) => {
          // Avoid adding duplicates
          if (!state.wishlist.some(item => item.id === product.id)) {
            return { wishlist: [...state.wishlist, product] };
          }
          return state; // Return current state if already exists
        });
      },
      removeFromWishlist: (productId) => {
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== productId),
        }));
      },
      isInWishlist: (productId) => {
        return get().wishlist.some((item) => item.id === productId);
      },
    }),
    {
      name: 'shopeasy-cart-storage', // Existing name, now includes wishlist
      storage: createJSONStorage(() => localStorage),
    }
  )
);