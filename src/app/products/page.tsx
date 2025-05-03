"use client";

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product-card';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation'; // To read URL query params

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || ''; // Get category from URL

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('name')); // Order by name by default
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        setAllProducts(fetchedProducts);
        // Apply initial filtering based on URL params
        filterAndSearchProducts(fetchedProducts, searchTerm, initialCategory);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({ title: "Error", description: "Could not fetch products.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // Fetch only once on mount

   // Function to filter and search products
  const filterAndSearchProducts = (productsToFilter: Product[], currentSearchTerm: string, category: string) => {
     let tempProducts = [...productsToFilter];

      // Apply category filter (example - needs actual category data on products)
      if (category) {
          // Replace with actual category filtering logic based on your Product type
          // Example: tempProducts = tempProducts.filter(p => p.category?.toLowerCase() === category.toLowerCase());
           console.log(`Filtering by category: ${category}`); // Placeholder
      }

      // Apply search term filter
      if (currentSearchTerm) {
          const lowerCaseSearchTerm = currentSearchTerm.toLowerCase();
          tempProducts = tempProducts.filter(product =>
              product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
              product.description.toLowerCase().includes(lowerCaseSearchTerm) ||
              product.imageHint.toLowerCase().includes(lowerCaseSearchTerm) // Search image hint too
          );
      }

      setFilteredProducts(tempProducts);
  };

   // Handle search input change
   const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
       const newSearchTerm = event.target.value;
       setSearchTerm(newSearchTerm);
       filterAndSearchProducts(allProducts, newSearchTerm, initialCategory); // Re-filter with new term
   };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" },
    }),
  };

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 lg:py-16">
      <motion.h1
        className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-center"
        initial="hidden" animate="visible" variants={fadeIn}
      >
        Our Products
      </motion.h1>

        {/* Search Bar */}
        <div className="mb-8 max-w-md mx-auto">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search products..."
                    className="pl-10 h-11"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>
            {initialCategory && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                    Showing results for category: <span className="font-medium">{initialCategory}</span>
                </p>
            )}
        </div>

      {loading ? (
        // Skeleton Loading Grid
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(12)].map((_, i) => (
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
      ) : filteredProducts.length === 0 ? (
        // No Products Message
         <motion.div
            className="text-center text-muted-foreground py-16"
            initial="hidden" animate="visible" variants={fadeIn}
        >
            <p className="text-xl font-semibold">No products found{searchTerm ? ` matching "${searchTerm}"` : ''}.</p>
            <p className="text-md">Try adjusting your search or check back later.</p>
        </motion.div>
      ) : (
        // Products Grid
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.05 }}
        >
          {filteredProducts.map((product, index) => (
            <motion.div key={product.id} variants={fadeIn} custom={index}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
