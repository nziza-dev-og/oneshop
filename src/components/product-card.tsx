"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link'; // Import Link
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Eye } from 'lucide-react'; // Import Heart and Eye icons
import { useCart } from '@/hooks/useCart';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react'; // Import useEffect and useState
import { cn } from '@/lib/utils'; // Import cn

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

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent link navigation when clicking button
    e.preventDefault(); // Prevent link navigation
    addItem(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
      variant: 'default',
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent link navigation when clicking button
    e.preventDefault(); // Prevent link navigation
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
  };

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 relative group h-full border border-border/50"> {/* Added border */}
      {/* Wishlist Button - positioned top-right */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
            "absolute top-2 right-2 z-10 h-9 w-9 rounded-full bg-background/70 hover:bg-background/90 text-foreground transition-colors duration-200",
            isWishlisted ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={handleToggleWishlist}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        disabled={!isClient}
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-transform duration-200 ease-in-out group-hover:scale-110",
            isWishlisted ? 'fill-current' : 'fill-none'
            )}
          strokeWidth={isWishlisted ? 0 : 2} // Hide stroke when filled
        />
      </Button>

      <Link href={`/products/${product.id}`} className="flex flex-col flex-grow cursor-pointer">
        <CardHeader className="p-0">
          <div className="relative w-full h-48">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 23vw"
              data-ai-hint={product.imageHint}
              priority={product.id.endsWith('1') || product.id.endsWith('2')} // Example priority logic
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</CardDescription>
          <p className="text-lg font-bold text-foreground">${product.price.toFixed(2)}</p> {/* Adjusted price color */}
        </CardContent>
      </Link>

      <CardFooter className="p-4 pt-0 mt-auto flex items-center gap-2">
        {/* Updated Add to Cart button style */}
        <Button
          onClick={handleAddToCart}
          className="flex-grow bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm hover:shadow-md transition-shadow"
          disabled={!isClient}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
         <Link href={`/products/${product.id}`} passHref legacyBehavior>
            <Button variant="outline" size="icon" aria-label="View Details" className="border-border hover:bg-secondary"> {/* Adjusted outline button */}
              <Eye className="h-4 w-4" />
            </Button>
         </Link>
      </CardFooter>
    </Card>
  );
}
