"use client"; // Mark as client component to use hooks

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product-card';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { useToast } from '@/hooks/use-toast'; // Import useToast

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, 'products');
        // Fetch products, maybe order by creation time or name, limit if needed
        const q = query(productsRef, orderBy('name'), limit(12)); // Example: order by name, limit to 12
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => ({
          id: doc.id, // Use Firestore document ID
          ...doc.data()
        } as Product));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({ title: "Error", description: "Could not fetch products.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [toast]); // Added toast to dependency array

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8 text-center md:text-left">
        Featured Products
      </h1>
      {loading ? (
         // Skeleton loading state
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
             <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
         <div className="text-center text-muted-foreground py-16">
             <p className="text-lg font-semibold">No products available right now.</p>
             <p>Check back soon!</p>
         </div>
      ) : (
         // Render actual products
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
