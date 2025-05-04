
"use client";

import type { Product } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Import cn utility

interface ProductDetailClientProps {
  product: Product; // Receives Product with createdAt as number | null
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addItem, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isWishlisted = isClient ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleToggleWishlist = () => {
    if (!isClient) return;

    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast({
        title: "Removed from Wishlist",
        description: `${product.name} removed from your wishlist.`,
      });
    } else {
      addToWishlist(product);
      toast({
        title: "Added to Wishlist",
        description: `${product.name} added to your wishlist.`,
      });
    }
  };

   const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };


  return (
    <div className="container mx-auto px-4 py-12 md:px-6 lg:py-16">
      <motion.div
        className="grid md:grid-cols-2 gap-8 lg:gap-16 items-start"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        >
        {/* Product Image */}
        <motion.div
         className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg border"
         whileHover={{ scale: 1.02 }}
         transition={{ type: "spring", stiffness: 300 }}
         >
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 90vw, 45vw"
            data-ai-hint={product.imageHint}
            priority // Prioritize loading the main product image
          />
        </motion.div>

        {/* Product Details */}
        <div className="space-y-6">
          <motion.h1
            className="text-3xl md:text-4xl font-bold tracking-tight text-foreground"
            variants={fadeIn}
            >
            {product.name}
          </motion.h1>

           {/* Example Rating - Replace with actual data if available */}
          <div className="flex items-center gap-1">
             <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
             <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
             <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
             <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
             <Star className="h-5 w-5 fill-muted stroke-muted-foreground" />
             <span className="text-sm text-muted-foreground ml-2">(4.0 / 5 ratings - Placeholder)</span>
          </div>

          <motion.p
            className="text-3xl font-semibold text-primary"
            variants={fadeIn}
          >
            ${product.price.toFixed(2)}
          </motion.p>

          <Separator />

           <motion.div variants={fadeIn}>
             <h2 className="text-xl font-semibold mb-2 text-foreground">Description</h2>
             <p className="text-muted-foreground leading-relaxed">
                {product.description}
             </p>
              {/* Display creation date if needed, converting from milliseconds */}
              {/* {product.createdAt && (
                 <p className="text-xs text-muted-foreground mt-2">
                    Added on: {new Date(product.createdAt).toLocaleDateString()}
                 </p>
              )} */}
           </motion.div>

          {/* Action Buttons */}
          <motion.div className="flex flex-col sm:flex-row gap-4 pt-4" variants={fadeIn}>
            <Button
              size="lg"
              onClick={handleAddToCart}
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 text-lg"
              disabled={!isClient} // Disable until client is ready
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleToggleWishlist}
              className={cn(
                 "flex items-center justify-center gap-2 text-lg",
                 isWishlisted ? "border-red-500 text-red-500 hover:bg-red-500/10" : ""
              )}
              disabled={!isClient} // Disable until client is ready
            >
              <Heart
                className={cn(
                    "h-5 w-5 transition-colors",
                    isWishlisted ? 'fill-red-500' : 'fill-none'
                 )}
                 strokeWidth={isWishlisted ? 0 : 2}
              />
               {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </Button>
          </motion.div>
        </div>
      </motion.div>

       {/* Related Products Section (Placeholder) */}
      {/* <div className="mt-16 lg:mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">You Might Also Like</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
               Placeholder for related product cards
              {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full rounded-lg" />
              ))}
          </div>
      </div> */}
    </div>
  );
}

