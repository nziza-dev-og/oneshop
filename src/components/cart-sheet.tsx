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
import { Input } from "@/components/ui/input";
import { useCart } from '@/hooks/useCart';
import Image from 'next/image';
import { Trash2, ShoppingCart, Minus, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function CartSheet() {
  const { items, removeItem, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCart();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

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

  const handleCheckout = () => {
    // Simulate checkout
    clearCart();
    toast({
      title: "Checkout Successful!",
      description: "Your order has been placed (simulation).",
      variant: 'default', // Use accent color indirectly
    });
    // Close the sheet after checkout
    // Cannot directly close Sheet from here, need user interaction or state management outside
  }

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
                        layout="fill"
                        objectFit="cover"
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
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-4 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
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
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6">
                     Simulate Checkout
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Confirm Checkout Simulation</AlertDialogTitle>
                     <AlertDialogDescription>
                       This is a simulation. No real payment will be processed. Clicking 'Confirm' will clear your cart and simulate a successful order.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel>Cancel</AlertDialogCancel>
                     <SheetClose asChild>
                      <AlertDialogAction onClick={handleCheckout} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        Confirm
                      </AlertDialogAction>
                     </SheetClose>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
               <SheetClose asChild>
                <Button variant="outline" className="w-full">Continue Shopping</Button>
               </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
