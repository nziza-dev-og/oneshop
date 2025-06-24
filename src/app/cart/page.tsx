
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from "next/navigation";
import { Trash2, Minus, Plus, ShoppingCart, Loader2, XCircle, PackageSearch } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Product } from '@/types';
import getStripe from '@/lib/stripe/client';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalItems, getTotalPrice, addItem: addItemToCartHook } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [promocode, setPromocode] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch suggested products from Firestore
  useEffect(() => {
    const fetchSuggestions = async () => {
        if (!db) {
            console.warn("Database not available for fetching suggestions.");
            setSuggestionsLoading(false);
            return;
        }
        setSuggestionsLoading(true);
        try {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, limit(3));
            const querySnapshot = await getDocs(q);
            const fetchedProducts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Product));
            
            // Filter out items that are already in the cart
            const cartItemIds = new Set(items.map(item => item.id));
            const filteredSuggestions = fetchedProducts.filter(p => !cartItemIds.has(p.id));

            setSuggestedProducts(filteredSuggestions);
        } catch (error) {
            console.error("Error fetching product suggestions:", error);
            // Optionally, show a toast for critical errors
        } finally {
            setSuggestionsLoading(false);
        }
    };

    // Only fetch on the client side
    if (isClient) {
      fetchSuggestions();
    }
  }, [isClient, items]);

  const totalItems = isClient ? getTotalItems() : 0;
  const totalPrice = isClient ? getTotalPrice() : 0;
  // Placeholder for savings, can be dynamic later
  const savings = 0; // Example: (promocode && totalPrice > 50) ? totalPrice * 0.1 : 0;
  const finalTotal = totalPrice - savings;


  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
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

  const handleClearCartConfirm = () => {
    clearCart();
    toast({ title: "Cart Cleared", description: "All items removed from your cart." });
  };

  const handleCheckout = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please log in to proceed with checkout.", variant: "destructive" });
      router.push('/login?redirect=/cart');
      return;
    }
    if (!items || items.length === 0) {
      toast({ title: "Cart Empty", description: "Cannot checkout with an empty cart.", variant: "destructive" });
      return;
    }
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      toast({ title: "Configuration Error", description: "Stripe is not configured. Checkout unavailable.", variant: "destructive" });
      console.error("Stripe publishable key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) missing in environment variables.");
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, userId: user.uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let userMessage = errorData.error || 'Failed to create checkout session. Please try again.';
        if (response.status === 500 && userMessage.startsWith("Internal Server Error")) {
           userMessage = "Checkout service is temporarily unavailable. Please try again later.";
        }
        throw new Error(userMessage);
      }

      const { sessionId } = await response.json();
      if (!sessionId) throw new Error('Invalid session ID received');

      const stripe = await getStripe();
      if (!stripe) throw new Error('Stripe.js failed to load.');

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
          console.error('[Checkout] Stripe redirectToCheckout error:', error);
          toast({ title: "Checkout Failed", description: error.message || "Could not redirect to checkout.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("[Checkout] Overall Checkout Error:", error);
      toast({ title: "Checkout Failed", description: error.message || "Could not initiate checkout.", variant: "destructive" });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleAddSuggestionToCart = (product: Product) => {
    addItemToCartHook(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 animate-pulse">
        <div className="h-8 w-1/4 bg-muted rounded mb-6"></div>
        <div className="flex justify-end mb-4">
          <div className="h-9 w-32 bg-muted rounded"></div>
        </div>
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 border border-muted rounded-lg shadow-sm">
                <div className="h-24 w-24 bg-muted rounded-md"></div>
                <div className="flex-grow space-y-2">
                  <div className="h-5 w-3/4 bg-muted rounded"></div>
                  <div className="h-4 w-1/2 bg-muted rounded"></div>
                  <div className="h-4 w-1/4 bg-muted rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-20 bg-muted rounded"></div>
                </div>
                <div className="h-6 w-20 bg-muted rounded"></div>
                <div className="h-8 w-8 bg-muted rounded-full"></div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1 sticky top-20">
            <div className="p-6 border border-muted rounded-lg shadow-sm space-y-4">
              <div className="h-6 w-1/2 bg-muted rounded mb-2"></div>
              <div className="h-10 w-full bg-muted rounded"></div>
              <div className="h-10 w-full bg-muted rounded"></div>
              <div className="h-px w-full bg-muted my-2"></div>
              <div className="h-5 w-3/4 bg-muted rounded"></div>
              <div className="h-5 w-1/2 bg-muted rounded"></div>
              <div className="h-8 w-full bg-muted rounded"></div>
              <div className="h-12 w-full bg-green-300 rounded mt-2"></div>
              <div className="h-5 w-1/3 bg-muted rounded mx-auto mt-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Your cart</h1>
        {items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-muted-foreground hover:text-destructive hover:border-destructive/50">
                <XCircle className="mr-2 h-4 w-4" /> Remove all items
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Cart?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove all items from your cart?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearCartConfirm} className="bg-destructive hover:bg-destructive/90">Clear Cart</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {items.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">Your cart is empty.</p>
                <Button variant="link" asChild className="mt-4 text-primary text-base">
                  <Link href="/">Continue Shopping</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-md overflow-hidden border flex-shrink-0">
                  <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} sizes="15vw" data-ai-hint={item.imageHint} />
                </div>
                <div className="flex-grow">
                  <Link href={`/products/${item.id}`} className="hover:underline">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2">{item.name}</h3>
                  </Link>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs mt-1">In Stock</Badge>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 my-2 sm:my-0">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={isCheckingOut}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-md font-medium w-6 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity + 1)} disabled={isCheckingOut}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-lg font-semibold text-foreground w-28 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" disabled={isCheckingOut}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Remove Item?</AlertDialogTitle><AlertDialogDescription>Remove "{item.name}" from cart?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveConfirm(item.id)} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            ))
          )}

          {items.length > 0 && (
            <div className="mt-10 pt-8 border-t">
              <h2 className="text-xl font-semibold mb-4 text-foreground">You may also like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {suggestionsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <Skeleton className="h-32 w-full"/>
                      <CardContent className="p-3 space-y-2">
                        <Skeleton className="h-4 w-3/4"/>
                        <Skeleton className="h-4 w-1/2"/>
                        <Skeleton className="h-9 w-full mt-1"/>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  suggestedProducts.map(product => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="relative h-32 w-full">
                          <Image src={product.imageUrl} alt={product.name} fill style={{objectFit: 'cover'}} sizes="30vw" data-ai-hint={product.imageHint}/>
                      </div>
                      <CardContent className="p-3">
                        <h4 className="text-sm font-medium truncate mb-1">{product.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">${product.price.toFixed(2)}</p>
                        <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleAddSuggestionToCart(product)}>
                          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Add to cart
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="lg:col-span-1 sticky top-24">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input 
                    type="text" 
                    placeholder="Promocode" 
                    value={promocode}
                    onChange={(e) => setPromocode(e.target.value)}
                    className="flex-grow h-10"
                  />
                  <Button variant="outline" className="h-10 px-4" onClick={() => toast({title: "Promocode Applied!", description: "JK, this is just a demo :)"})}>Apply</Button>
                </div>
                <Separator />
                <div className="flex justify-between text-muted-foreground">
                  <span>Item Subtotal ({totalItems} items)</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Your savings</span>
                    <span>-${savings.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-xl font-bold text-foreground">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-4">
                <Button
                  size="lg"
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-base py-3"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || items.length === 0}
                >
                  {isCheckingOut ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
                  {isCheckingOut ? 'Processing...' : 'Proceed to checkout'}
                </Button>
                <Button variant="link" asChild className="text-muted-foreground hover:text-primary">
                  <Link href="/">Continue Shopping</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
