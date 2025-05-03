"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import type { CartItem } from '@/types'; // Assuming CartItem includes product details

interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
  orderDate: Date;
  // Add other order fields like status, shipping address etc. if needed
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login'); // Redirect if not logged in
    } else if (user) {
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const ordersRef = collection(db, 'orders');
          // Query orders for the current user, ordered by date descending
          const q = query(ordersRef, where('userId', '==', user.uid), orderBy('orderDate', 'desc'));
          const querySnapshot = await getDocs(q);
          const fetchedOrders = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              items: data.items,
              totalPrice: data.totalPrice,
              // Convert Firestore Timestamp to JS Date
              orderDate: data.orderDate.toDate(),
            } as Order;
          });
          setOrders(fetchedOrders);
        } catch (error) {
          console.error("Error fetching orders:", error);
          // Handle error display if needed
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [user, authLoading, router]);

   if (authLoading || loading) {
     return (
       <div className="container mx-auto px-4 py-12 md:px-6">
         <Skeleton className="h-8 w-1/4 mb-6" />
         <Card>
           <CardHeader>
             <Skeleton className="h-6 w-1/3 mb-2" />
             <Skeleton className="h-4 w-full" />
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-full" /></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {[...Array(3)].map((_, i) => (
                   <TableRow key={i}>
                     <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                     <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                     <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                     <TableCell>
                       <div className="flex items-center space-x-2">
                         <Skeleton className="h-10 w-10 rounded" />
                         <Skeleton className="h-5 w-32" />
                       </div>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
       </div>
     );
   }

  if (!user) {
    return <div className="container mx-auto text-center py-12">Please log in to view your orders.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            You haven't placed any orders yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50 px-6 py-4">
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                        <CardTitle className="text-lg">Order #{order.id.substring(0, 8)}...</CardTitle>
                        <CardDescription>
                        Placed on: {order.orderDate.toLocaleDateString()}
                        </CardDescription>
                    </div>
                    <Badge variant="secondary" className="w-fit">Processing</Badge> {/* Placeholder status */}
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[100px] text-center">Quantity</TableHead>
                      <TableHead className="w-[120px] text-right">Price</TableHead>
                      <TableHead className="w-[120px] text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="hidden sm:table-cell">
                           <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                             <Image
                               src={item.imageUrl}
                               alt={item.name}
                               layout="fill"
                               objectFit="cover"
                               data-ai-hint={item.imageHint}
                              />
                           </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="border-t bg-muted/50 px-6 py-3 text-right font-semibold">
                Order Total: ${order.totalPrice.toFixed(2)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
