"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackagePlus } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

// Define the Zod schema for form validation
const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters long."),
  description: z.string().min(10, "Description must be at least 10 characters long.").max(500, "Description must be less than 500 characters."),
  price: z.coerce.number().min(0.01, "Price must be positive.").refine(val => /^\d+(\.\d{1,2})?$/.test(String(val)), { message: "Price must have up to two decimal places." }),
  imageUrl: z.string().min(1, "Please enter an image URL."), // Allow any non-empty string
   imageHint: z.string().min(2, "Image hint must be at least 2 characters.").max(50, "Image hint must be less than 50 characters."), // Hint for future AI image search
});

type ProductFormData = z.infer<typeof productSchema>;

export default function AddProductPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0.00,
      imageUrl: '', // Default to empty string
      imageHint: '',
    },
  });

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    if (!isAdmin) {
        toast({ title: "Error", description: "Unauthorized action.", variant: "destructive" });
        return;
    }
    setLoading(true);
    try {
      // Add product to Firestore 'products' collection
      const docRef = await addDoc(collection(db, "products"), {
        ...data,
        createdAt: serverTimestamp(), // Add a creation timestamp if needed
      });

      toast({ title: "Product Added!", description: `"${data.name}" has been successfully added.` });
      form.reset(); // Reset form after successful submission
      router.push('/admin/products'); // Redirect back to the product list

    } catch (error) {
      console.error("Error adding product:", error);
      toast({ title: "Failed to Add Product", description: "Could not add the product. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

   if (authLoading) {
       return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div>;
   }

    if (!isAdmin && !authLoading) {
        return <div className="text-center text-muted-foreground">Access Denied.</div>;
    }

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
           <PackagePlus className="h-6 w-6"/> Add New Product
        </CardTitle>
        <CardDescription>Fill in the details for the new product.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., EcoComfort T-Shirt" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the product..." {...field} disabled={loading} rows={4}/>
                  </FormControl>
                   <FormDescription>
                        Keep it concise but informative (max 500 characters).
                   </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 24.99" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} disabled={loading} />
                  </FormControl>
                   <FormDescription>
                        Provide a URL for the product image. It can be any valid image URL.
                   </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="imageHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image Hint</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 'blue widget tech'" {...field} disabled={loading} />
                  </FormControl>
                   <FormDescription>
                        Enter 1-3 keywords describing the image (used for potential future AI image search).
                   </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? 'Adding Product...' : 'Add Product'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
