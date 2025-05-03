"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from '@/hooks/useCart'; // Use the combined hook
import { useToast } from "@/hooks/use-toast";
import type { Product } from '@/types';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, addItem: addToCart } = useCart();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRemove = (product: Product) => {
    removeFromWishlist(product.id);
    toast({
      title: "Removed from Wishlist",
      description: `${product.name} removed from your wishlist.`,
    });
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product); // Add one item to the cart
    removeFromWishlist(product.id); // Remove from wishlist after adding to cart
    toast({
      title: "Moved to Cart",
      description: `${product.name} added to your cart.`,
    });
  };

  // Only render content on the client
  if (!isClient) {
    // You can return a loading state or null during SSR
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
             <Card>
                <CardHeader>
                    <CardTitle>Your Saved Items</CardTitle>
                    <CardDescription>Loading your wishlist...</CardDescription>
                </CardHeader>
                 <CardContent className="py-8 text-center">
                     <Heart className="mx-auto h-12 w-12 animate-pulse text-muted-foreground/50 mb-4" />
                </CardContent>
             </Card>
        </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your Saved Items</CardTitle>
           <CardDescription>
                {wishlist.length > 0
                    ? `You have ${wishlist.length} item(s) in your wishlist.`
                    : "Items you've added to your wishlist."}
           </CardDescription>
        </CardHeader>
        <CardContent>
          {wishlist.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p>Your wishlist is currently empty.</p>
              <p className="text-sm">Start adding items you love!</p>
              <Button variant="link" className="mt-4 text-primary" asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {wishlist.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg shadow-sm">
                  <div className="relative h-20 w-20 rounded-md overflow-hidden border flex-shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 20vw, 10vw"
                      data-ai-hint={item.imageHint}
                    />
                  </div>
                  <div className="flex-grow min-w-0"> {/* Added min-w-0 for flex truncation */}
                    <p className="font-semibold truncate">{item.name}</p> {/* Added truncate */}
                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                  </div>
                   <div className="flex flex-col sm:flex-row gap-2 items-center flex-shrink-0">
                       <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                        aria-label={`Add ${item.name} to cart`}
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                       >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">Add to Cart</span>
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={() => handleRemove(item)}
                         aria-label={`Remove ${item.name} from wishlist`}
                         className="text-muted-foreground hover:text-destructive"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}