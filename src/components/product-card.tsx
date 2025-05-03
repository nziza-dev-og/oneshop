"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart } from 'lucide-react'; // Import Heart icon
import { useCart } from '@/hooks/useCart';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react'; // Import useEffect and useState

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false); // State to track client-side rendering

  // Ensure hook access only happens on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize or derive wishlist status only on client
  const isWishlisted = isClient ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
      variant: 'default',
    });
  };

  const handleToggleWishlist = () => {
    if (!isClient) return; // Guard against server-side execution

    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from Wishlist",
        description: `${product.name} removed from your wishlist.`,
        variant: 'default',
      });
    } else {
      addToWishlist(product);
      toast({
        title: "Added to Wishlist",
        description: `${product.name} added to your wishlist.`,
        variant: 'default',
      });
    }
     // Force re-render might not be needed if zustand state updates trigger it
  };

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 relative group">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 23vw"
            data-ai-hint={product.imageHint}
            priority={product.id.endsWith('1') || product.id.endsWith('2')}
          />
           {/* Wishlist Button - positioned top-right */}
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-2 right-2 z-10 h-9 w-9 rounded-full bg-background/70 hover:bg-background/90 text-foreground transition-colors duration-200 ${
                isWishlisted ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={handleToggleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={`h-5 w-5 transition-transform duration-200 ease-in-out group-hover:scale-110 ${isWishlisted ? 'fill-current' : 'fill-none'}`}
                strokeWidth={isWishlisted ? 0 : 2} // Hide stroke when filled
              />
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold mb-1">{product.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</CardDescription>
        <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAddToCart} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}