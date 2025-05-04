"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input"; // Keep if needed elsewhere, unused currently
import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import { Trash2, ShoppingCart, Minus, Plus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/auth-provider"; // Import useAuth
import { db } from "@/lib/firebase/firebase"; // Import db instance (needed for potential future use)
// Removed direct Firestore imports as order creation is moved
import { useRouter } from "next/navigation";
import getStripe from '@/lib/stripe/client'; // Import Stripe client utility

export function CartSheet() {
  const { items, removeItem, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCart();
  const { user, loading: authLoading } = useAuth(); // Get user state
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false); // Loading state for checkout

  // Ensure cart state is only accessed on the client side after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const totalItems = isClient ? getTotalItems() : 0;
  const totalPrice = isClient ? getTotalPrice() : 0;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
      toast({ title: "Item Removed", description: "Item removed from cart." });
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async () => {
     if (!user) {
       toast({ title: "Login Required", description: "Please log in to proceed with checkout.", variant: "destructive" });
       router.push('/login?redirect=/checkout'); // Redirect to login, saving checkout attempt
       return;
     }
     if (!items || items.length === 0) {
        toast({ title: "Cart Empty", description: "Cannot checkout with an empty cart.", variant: "destructive" });
        return;
     }

    setIsCheckingOut(true);
    try {
      // 1. Call the API route to create a Stripe Checkout Session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, userId: user.uid }), // Send cart items and user ID
      });

      if (!response.ok) {
          const errorData = await response.json();
          console.error("API Checkout Error:", errorData);
          throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      console.log("[Checkout] Received Session ID:", sessionId); // Log session ID

      if (!sessionId) {
          throw new Error('Invalid session ID received');
      }

      // 2. Redirect to Stripe Checkout
      console.log("[Checkout] Attempting to load Stripe.js..."); // Log before loading Stripe
      const stripe = await getStripe();
      console.log("[Checkout] Stripe object loaded:", stripe ? 'OK' : 'Failed'); // Log Stripe object status

      if (!stripe) {
          throw new Error('Stripe.js failed to load.');
      }

      console.log("[Checkout] Attempting redirectToCheckout with sessionId:", sessionId); // Log before redirect
      // THIS IS THE LINE CAUSING THE ERROR
      const { error } = await stripe.redirectToCheckout({ sessionId });
      // If redirectToCheckout is successful, the code below this line might not execute as the page navigates away.

      if (error) {
        console.error('[Checkout] Stripe redirect error:', error); // Log redirect error
        toast({
          title: "Checkout Error",
          description: error.message || "Failed to redirect to Stripe.",
          variant: "destructive",
        });
      } else {
        console.log("[Checkout] Redirecting to Stripe..."); // Log success if no immediate error
      }
      // Order creation will now typically happen via Stripe webhooks listening for 'checkout.session.completed'.

    } catch (error: any) {
      console.error("[Checkout] Overall Checkout Error:", error); // Log any caught error
      toast({
        title: "Checkout Failed",
        description: error.message || "Could not initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {isClient && totalItems > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-accent-foreground bg-accent rounded-full">
              {totalItems}
            </span>
          )}
          <span className="sr-only">Open Cart</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-2xl font-bold">Your Shopping Cart</SheetTitle>
        </SheetHeader>
        <Separator />
        {isClient && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-grow text-center p-6">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Your cart is empty</p>
            <SheetClose asChild>
               <Button variant="link" className="mt-2 text-primary">Continue Shopping</Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-grow px-6 py-4">
              <div className="space-y-4">
                {isClient && items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill // Use fill instead of layout="fill"
                        style={{ objectFit: 'cover' }} // Use style object for objectFit
                        sizes="(max-width: 768px) 20vw, 10vw" // Provide sizes attribute
                        data-ai-hint={item.imageHint}
                      />
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={isCheckingOut}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-4 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                           disabled={isCheckingOut}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                       <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8 text-muted-foreground hover:text-destructive"
                         onClick={() => handleQuantityChange(item.id, 0)} // Use 0 quantity to trigger removal
                          disabled={isCheckingOut}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator />
            <SheetFooter className="px-6 py-4 space-y-4">
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Subtotal:</span>
                <span>${isClient ? totalPrice.toFixed(2) : '0.00'}</span>
              </div>
              {/* Removed AlertDialog as logic is now simpler */}
              <Button
                onClick={handleCheckout} // Direct call to the simplified checkout handler
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6"
                disabled={isCheckingOut || authLoading || !isClient || items.length === 0} // Disable if empty or loading
              >
                {isCheckingOut ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
              </Button>
               <SheetClose asChild>
                <Button variant="outline" className="w-full" disabled={isCheckingOut}>Continue Shopping</Button>
               </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
