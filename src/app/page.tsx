"use client"; // Mark as client component to use hooks

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowRight, Tag, Gift, Zap } from 'lucide-react'; // Icons for categories

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('name'), limit(8)); // Fetch 8 featured products
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
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
  }, [toast]);

  // Example categories - replace with dynamic data if needed
  const categories = [
    { name: "New Arrivals", icon: Zap, href: "/products?category=new" },
    { name: "Best Sellers", icon: Gift, href: "/products?category=bestsellers" },
    { name: "On Sale", icon: Tag, href: "/products?category=sale" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/80 to-primary/60 text-primary-foreground py-20 md:py-32">
        {/* Optional: Add a subtle background image/pattern */}
         <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: "url('https://picsum.photos/1600/900?grayscale&blur=1')" }}
            data-ai-hint="abstract background pattern"
          />
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Welcome to ShopEasy
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Discover amazing products at unbeatable prices. Your easy shopping journey starts here.
          </p>
          <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="#featured-products">
              Shop Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Category Links Section */}
       <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-4 md:px-6">
             <h2 className="text-2xl font-semibold tracking-tight mb-6 text-center">
                Explore Our Collections
             </h2>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {categories.map((category) => (
                   <Link key={category.name} href={category.href} passHref>
                      <div className="group flex flex-col items-center p-6 bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 text-center">
                         <category.icon className="h-10 w-10 text-primary mb-3 transition-transform duration-200 group-hover:scale-110" />
                         <span className="font-medium text-foreground">{category.name}</span>
                      </div>
                   </Link>
                ))}
             </div>
          </div>
       </section>

      {/* Featured Products Section */}
      <section id="featured-products" className="container mx-auto px-4 py-16 md:px-6 lg:py-24">
        <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">
          Featured Products
        </h2>
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
          // No products message
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
      </section>

        {/* Simple Footer */}
       <footer className="py-6 md:px-8 md:py-8 border-t bg-muted/30 mt-auto">
          <div className="container mx-auto flex flex-col items-center justify-center gap-4 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground">
              © {new Date().getFullYear()} ShopEasy. All rights reserved.
            </p>
             {/* Optional: Add social links or other footer content */}
          </div>
        </footer>
    </div>
  );
}