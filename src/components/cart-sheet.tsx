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
import { Input } from '@/components/ui/input'; // Keep if needed elsewhere, unused currently
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
      // Use AlertDialog for removal confirmation
      // Triggering this programmatically is complex, maybe keep direct removal for simplicity?
      // For now, direct removal:
      removeItem(productId);
      toast({ title: "Item Removed", description: "Item removed from cart." });
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

   const handleRemoveConfirm = (productId: string) => {
     removeItem(productId);
     toast({ title: "Item Removed", description: "Item removed from cart." });
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

      // Attempt redirection
      const { error } = await stripe.redirectToCheckout({ sessionId });

      // If redirectToCheckout fails (likely in iframe environments), log the error.
      if (error) {
        console.error('[Checkout] Stripe redirect error:', error);
        toast({
          title: "Checkout Error",
          // Provide specific guidance for iframe scenarios
          description: error.message || "Failed to redirect to Stripe automatically. This can happen in preview environments. Please check your browser console or try in a new tab.",
          variant: "destructive",
          duration: 10000, // Longer duration for the error message
        });
         // Fallback: Open Stripe checkout URL in a new tab as a workaround
         // Check if window is defined (to avoid server-side errors)
         if (typeof window !== 'undefined') {
            const sessionUrl = `https://checkout.stripe.com/pay/${sessionId}`;
            console.warn(`[Checkout] Attempting to open checkout URL in new tab: ${sessionUrl}`);
            window.open(sessionUrl, '_blank');
         }
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
        <Button variant="outline" size="icon" className="relative border-border hover:bg-secondary"> {/* Adjusted style */}
          <ShoppingCart className="h-5 w-5" />
          {isClient && totalItems > 0 && (
            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full"> {/* Changed badge color */}
              {totalItems}
            </span>
          )}
          <span className="sr-only">Open Cart</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0"> {/* Use full width on small, max-lg, remove padding */}
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-2xl font-bold">Your Shopping Cart</SheetTitle>
        </SheetHeader>
        <Separator />
        {isClient && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-grow text-center p-6">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-semibold text-muted-foreground">Your cart is empty</p>
            <SheetClose asChild>
               <Button variant="link" className="mt-2 text-primary">Continue Shopping</Button>
            </SheetClose>
          </div>
        ) : (
          <>
            {/* Content Area */}
            <ScrollArea className="flex-grow overflow-y-auto px-6 py-4">
              <div className="space-y-5"> {/* Increased spacing */}
                {isClient && items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    {/* Image */}
                    <div className="relative h-20 w-20 rounded-md overflow-hidden border flex-shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="20vw"
                        data-ai-hint={item.imageHint}
                      />
                    </div>
                    {/* Details & Actions */}
                    <div className="flex-grow flex flex-col justify-between min-h-[80px]"> {/* Ensure min height */}
                      <div>
                        <p className="font-semibold text-base line-clamp-2">{item.name}</p>
                        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 border-r rounded-r-none"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={isCheckingOut}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 border-l rounded-l-none"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={isCheckingOut}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Item Total Price */}
                        <p className="text-base font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                     {/* Remove Button */}
                     <AlertDialog>
                         <AlertDialogTrigger asChild>
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0 ml-2" // Added margin-left
                                disabled={isCheckingOut}
                                aria-label="Remove item"
                             >
                                <Trash2 className="h-4 w-4" />
                             </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                             <AlertDialogHeader>
                                 <AlertDialogTitle>Remove Item?</AlertDialogTitle>
                                 <AlertDialogDescription>
                                     Are you sure you want to remove "{item.name}" from your cart?
                                 </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                                 <AlertDialogAction
                                    onClick={() => handleRemoveConfirm(item.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                    Remove
                                 </AlertDialogAction>
                             </AlertDialogFooter>
                         </AlertDialogContent>
                     </AlertDialog>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <SheetFooter className="px-6 py-5 border-t bg-background mt-auto space-y-4"> {/* Ensure footer sticks */}
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Subtotal ({totalItems} items):</span>
                <span>${isClient ? totalPrice.toFixed(2) : '0.00'}</span>
              </div>
               {/* Updated Checkout button style */}
              <Button
                onClick={handleCheckout}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6 shadow-sm hover:shadow-md transition-shadow"
                disabled={isCheckingOut || authLoading || !isClient || items.length === 0}
              >
                {isCheckingOut ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5"/>}
                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
              </Button>
               <SheetClose asChild>
                <Button variant="outline" className="w-full border-border hover:bg-secondary" disabled={isCheckingOut}>Continue Shopping</Button> {/* Adjusted outline style */}
               </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
