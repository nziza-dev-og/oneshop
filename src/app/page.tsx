"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowRight, Tag, Gift, Zap, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion'; // Import motion

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('createdAt', 'desc'), limit(8)); // Fetch 8 newest products
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

  const categories = [
    { name: "New Arrivals", icon: Zap, href: "/products?category=new", description: "Check out the latest trends." },
    { name: "Best Sellers", icon: Gift, href: "/products?category=bestsellers", description: "Discover customer favorites." },
    { name: "On Sale", icon: Tag, href: "/products?category=sale", description: "Grab deals before they're gone." },
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
    }),
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <motion.section
        className="relative bg-gradient-to-br from-primary/80 via-primary/60 to-accent/50 text-primary-foreground py-24 md:py-40 overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
         <div
            className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay"
            style={{ backgroundImage: "url('https://picsum.photos/1920/1080?blur=2&random=1')" }}
            data-ai-hint="abstract blurred background"
          />
         {/* Subtle geometric shapes */}
         <motion.div
            className="absolute top-10 left-10 w-24 h-24 bg-primary/30 rounded-full opacity-50 filter blur-xl"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
         />
         <motion.div
            className="absolute bottom-10 right-20 w-32 h-32 bg-accent/30 rounded-lg opacity-50 filter blur-2xl"
            animate={{ scale: [1, 0.9, 1], rotate: [0, -15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
         />
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 text-shadow-md"
             variants={fadeIn} custom={1}
          >
            Welcome to ShopEasy
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-3xl mx-auto"
             variants={fadeIn} custom={2}
          >
            Discover amazing products curated just for you. Effortless shopping, exceptional quality.
          </motion.p>
          <motion.div variants={fadeIn} custom={3}>
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg transform transition hover:scale-105 duration-300 px-8 py-3 text-lg">
              <Link href="#featured-products">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Category Links Section */}
       <section className="py-16 bg-muted/40">
          <div className="container mx-auto px-4 md:px-6">
             <motion.h2
                className="text-3xl font-bold tracking-tight mb-10 text-center"
                 initial="hidden"
                 whileInView="visible"
                 viewport={{ once: true, amount: 0.3 }}
                 variants={fadeIn}
                 custom={0}
             >
                Explore Our Collections
             </motion.h2>
             <motion.div
                className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ staggerChildren: 0.1 }}
            >
                {categories.map((category, index) => (
                   <motion.div key={category.name} variants={fadeIn} custom={index + 1}>
                      <Link href={category.href} passHref>
                         <div className="group flex flex-col items-center p-8 bg-background rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 text-center transform hover:-translate-y-1 h-full">
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <category.icon className="h-12 w-12 text-primary mb-4" />
                             </motion.div>
                            <h3 className="font-semibold text-lg text-foreground mb-2">{category.name}</h3>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                         </div>
                      </Link>
                    </motion.div>
                ))}
             </motion.div>
          </div>
       </section>

      {/* Featured Products Section */}
      <section id="featured-products" className="container mx-auto px-4 py-16 md:px-6 lg:py-24">
        <motion.h2
            className="text-3xl font-bold tracking-tight mb-10 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
            custom={0}
        >
          Newest Additions
        </motion.h2>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3 border p-4 rounded-lg shadow-sm">
                <Skeleton className="h-48 w-full rounded-md" />
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <motion.div
            className="text-center text-muted-foreground py-16"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
        >
            <ShoppingBag className="mx-auto h-16 w-16 mb-4 text-muted-foreground/50" />
            <p className="text-xl font-semibold">No products available right now.</p>
            <p className="text-md">Check back soon for new arrivals!</p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            transition={{ staggerChildren: 0.05 }}
        >
            {products.map((product) => (
              <motion.div key={product.id} variants={fadeIn}>
                  <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-gradient-to-t from-muted/30 to-background py-16">
           <div className="container mx-auto px-4 md:px-6">
               <motion.h2
                    className="text-3xl font-bold tracking-tight mb-10 text-center"
                     initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn}
               >
                    Why Shop With Us?
               </motion.h2>
               <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
                    initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} transition={{ staggerChildren: 0.1 }}
                >
                    <motion.div variants={fadeIn} className="p-6">
                        <Zap className="mx-auto h-12 w-12 text-primary mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Fast Shipping</h3>
                        <p className="text-muted-foreground">Get your orders delivered quickly and reliably.</p>
                    </motion.div>
                     <motion.div variants={fadeIn} className="p-6">
                        <Gift className="mx-auto h-12 w-12 text-accent mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
                        <p className="text-muted-foreground">Handpicked items that meet our quality standards.</p>
                    </motion.div>
                     <motion.div variants={fadeIn} className="p-6">
                        <Tag className="mx-auto h-12 w-12 text-secondary-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Great Prices</h3>
                        <p className="text-muted-foreground">Competitive pricing on all our products.</p>
                    </motion.div>
               </motion.div>
           </div>
      </section>

       {/* Call to Action */}
        <section className="py-16 text-center">
             <div className="container mx-auto px-4 md:px-6">
                 <motion.h2
                    className="text-2xl md:text-3xl font-semibold mb-4"
                     initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={0}
                >
                    Ready to Find Something You Love?
                 </motion.h2>
                 <motion.p
                    className="text-muted-foreground mb-8 max-w-xl mx-auto"
                     initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={1}
                 >
                    Browse our full collection or check out the latest deals.
                 </motion.p>
                 <motion.div
                    className="flex flex-col sm:flex-row justify-center gap-4"
                     initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} custom={2}
                >
                    <Button size="lg" asChild>
                       <Link href="/products">Browse All Products</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                       <Link href="/products?category=sale">View Sales</Link>
                    </Button>
                 </motion.div>
             </div>
        </section>

       {/* Footer is now in layout.tsx */}
    </div>
  );
}
