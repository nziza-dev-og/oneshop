"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase'; // db might be null
import type { Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react'; // Import icons
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/providers/auth-provider';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth(); // Check admin status

  useEffect(() => {
     if (!authLoading && isAdmin && db) { // Check db
        const fetchProducts = async () => {
          setLoading(true);
          try {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, orderBy('name')); // Order by name
            const querySnapshot = await getDocs(q);
            const fetchedProducts = querySnapshot.docs.map(doc => ({
              id: doc.id, // Use Firestore document ID as product ID
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
     } else if (!authLoading && !isAdmin) {
         setLoading(false); // Stop loading if not admin
     } else if (!db) {
         setLoading(false); // Stop loading if db not available
         toast({ title: "Error", description: "Database service is not available.", variant: "destructive" });
     }
  }, [isAdmin, authLoading, toast]);

  const handleDeleteProduct = async (productId: string) => {
    if (!isAdmin || !db) return; // Check db
    setDeletingProductId(productId);
    try {
      const productDocRef = doc(db, 'products', productId);
      await deleteDoc(productDocRef);
      setProducts(prev => prev.filter(p => p.id !== productId)); // Update local state
      toast({ title: "Product Deleted", description: "The product has been successfully removed." });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "Delete Failed", description: "Could not delete the product.", variant: "destructive" });
    } finally {
      setDeletingProductId(null);
    }
  };

  if (loading || authLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
             <Skeleton className="h-8 w-1/3" />
             <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-40" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-16 text-right" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-24 text-right" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

   if (!isAdmin && !authLoading) {
        return <div className="text-center text-muted-foreground">Access Denied.</div>;
    }

    if (!db) {
        return <div className="text-center text-destructive">Database service is unavailable. Cannot load products.</div>;
    }


  return (
    <div>
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <Link href="/admin/products/add" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
          </Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>View, edit, or delete existing products.</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No products found. Add your first product!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px] text-right">Price</TableHead>
                  <TableHead className="w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="5vw"
                            data-ai-hint={product.imageHint}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-1">
                        {/* <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                           <Edit className="h-4 w-4" />
                        </Button> */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive/70 hover:text-destructive"
                                    disabled={deletingProductId === product.id}
                                >
                                    {deletingProductId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to permanently delete "{product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete Permanently
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
           {/* Add pagination if product list becomes long */}
        </CardContent>
      </Card>
    </div>
  );
}
