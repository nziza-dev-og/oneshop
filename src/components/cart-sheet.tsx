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
     if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || !process.env.STRIPE_SECRET_KEY) {
        toast({ title: "Configuration Error", description: "Stripe keys are not configured. Checkout unavailable.", variant: "destructive" });
        console.error("Stripe keys missing in environment variables.");
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
          // Improve error message display to user
          let userMessage = errorData.error || 'Failed to create checkout session. Please try again.';
          if (response.status === 500 && userMessage.startsWith("Internal Server Error")) {
             userMessage = "Checkout service is temporarily unavailable. Please try again later.";
          }
          throw new Error(userMessage);
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

      const { error } = await stripe.redirectToCheckout({ sessionId });

       if (error) {
            // This point might not be reached if redirection is blocked by browser/environment
            console.error('[Checkout] Stripe redirectToCheckout error:', error);

            // Attempting window.open as a fallback (might be blocked by pop-up blockers)
            try {
                const stripeCheckoutUrl = `https://checkout.stripe.com/pay/${sessionId}`; // Construct likely URL (may change)
                console.warn(`[Checkout] Redirect failed, attempting to open in new tab: ${stripeCheckoutUrl}`);
                const newWindow = window.open(stripeCheckoutUrl, '_blank');
                 if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    // Inform user if popup was blocked
                    toast({
                        title: "Popup Blocked?",
                        description: "Could not open checkout in a new tab. Please disable your popup blocker and try again.",
                        variant: "destructive",
                        duration: 10000,
                    });
                } else {
                    toast({
                        title: "Redirect Issue",
                        description: "Could not automatically redirect. Checkout opening in a new tab.",
                        variant: "default",
                        duration: 10000,
                    });
                }
            } catch(openError) {
                console.error("Error opening new window:", openError);
                 toast({
                     title: "Checkout Failed",
                     description: "Could not redirect or open checkout. Please try again or contact support.",
                     variant: "destructive",
                 });
            }
       } else {
            console.log("[Checkout] Redirecting via redirectToCheckout...");
            // If successful, browser navigates away, this part might not be logged.
       }

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
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 bg-slate-50 dark:bg-slate-900"> {/* Light/Dark background */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <SheetTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your Shopping Cart</SheetTitle>
        </SheetHeader>
        {isClient && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-grow text-center p-6">
            <ShoppingCart className="h-16 w-16 text-slate-400 dark:text-slate-600 mb-4 opacity-50" />
            <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Your cart is empty</p>
            <SheetClose asChild>
               <Button variant="link" className="mt-2 text-primary">Continue Shopping</Button>
            </SheetClose>
          </div>
        ) : (
          <>
            {/* Content Area */}
            <ScrollArea className="flex-grow overflow-y-auto px-6 py-4">
              <div className="space-y-5">
                {isClient && items.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 border-b border-slate-200 dark:border-slate-700 pb-4 last:border-b-0">
                    {/* Image */}
                    <div className="relative h-20 w-20 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
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
                    <div className="flex-grow flex flex-col justify-between min-h-[80px]">
                      <div>
                        <p className="font-semibold text-base line-clamp-2 text-slate-800 dark:text-slate-200">{item.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Controls - Amazon Style */}
                        <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-md overflow-hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={isCheckingOut}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm w-8 text-center font-medium text-slate-700 dark:text-slate-300">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={isCheckingOut}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Item Total Price */}
                        <p className="text-base font-semibold text-slate-800 dark:text-slate-200">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                     {/* Remove Button */}
                     <AlertDialog>
                         <AlertDialogTrigger asChild>
                             <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 flex-shrink-0 ml-2"
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

            {/* Footer - Amazon Style */}
            <SheetFooter className="px-6 py-5 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 mt-auto space-y-4">
              <div className="flex justify-between items-center font-semibold text-lg text-slate-800 dark:text-slate-200">
                <span>Subtotal ({totalItems} items):</span>
                <span>${isClient ? totalPrice.toFixed(2) : '0.00'}</span>
              </div>
              {/* Checkout button - Amazon Orange/Yellow */}
              <Button
                onClick={handleCheckout}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                disabled={isCheckingOut || authLoading || !isClient || items.length === 0}
              >
                {isCheckingOut ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5"/>}
                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
              </Button>
               {/* Fix: Ensure SheetClose with asChild wraps a single element */}
               <SheetClose asChild>
                <Button variant="outline" className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700" disabled={isCheckingOut}>Continue Shopping</Button>
               </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
