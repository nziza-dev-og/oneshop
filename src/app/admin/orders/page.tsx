"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import type { CartItem } from '@/types';

interface Order {
  id: string;
  userId: string;
  userEmail?: string; // Add userEmail
  items: CartItem[];
  totalPrice: number;
  orderDate: Date;
  // Add other order fields like status, shipping address etc. if needed
}

export default function AdminOrdersPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Redirect logic:
    // 1. If auth is loading, wait.
    // 2. If auth is done and user is not logged in, redirect to login.
    // 3. If auth is done, user is logged in, but not admin, redirect to home.
    // 4. If auth is done, user is logged in and is admin, proceed to fetch data.
    if (authLoading) return;

    if (!user) {
      router.push('/login');
    } else if (!isAdmin) {
      router.push('/'); // Redirect non-admins away
    } else {
      // User is admin, fetch orders
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const ordersRef = collection(db, 'orders');
          // Query all orders, ordered by date descending
          const q = query(ordersRef, orderBy('orderDate', 'desc'));
          const querySnapshot = await getDocs(q);

          const fetchedOrdersPromises = querySnapshot.docs.map(async (orderDoc) => {
            const data = orderDoc.data();
            let userEmail = 'N/A';

            // Fetch user email from users collection
            try {
               const userDocRef = doc(db, 'users', data.userId);
               const userDocSnap = await getDoc(userDocRef);
               if (userDocSnap.exists()) {
                 userEmail = userDocSnap.data().email || 'N/A';
               }
            } catch (userError) {
                console.error(`Error fetching user ${data.userId}:`, userError);
            }


            return {
              id: orderDoc.id,
              userId: data.userId,
              userEmail: userEmail, // Include fetched email
              items: data.items,
              totalPrice: data.totalPrice,
              orderDate: data.orderDate.toDate(), // Convert Timestamp to Date
            } as Order;
          });

          const fetchedOrders = await Promise.all(fetchedOrdersPromises);
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
  }, [user, authLoading, isAdmin, router]);

   if (authLoading || loading) {
     // Show skeleton loader while loading auth state or orders
     return (
       <div className="container mx-auto px-4 py-12 md:px-6">
         <Skeleton className="h-8 w-1/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
         <Card>
           <CardContent className="pt-6">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-full" /></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {[...Array(5)].map((_, i) => (
                   <TableRow key={i}>
                     <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                     <TableCell><Skeleton className="h-5 w-32" /></TableCell>
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

  // If not loading and not admin (should have been redirected, but as fallback)
  if (!isAdmin) {
      return <div className="container mx-auto text-center py-12">Access Denied.</div>;
  }


  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <Card>
          <CardHeader>
            <CardTitle>All Customer Orders</CardTitle>
            <CardDescription>Manage and view all orders placed by users.</CardDescription>
          </CardHeader>
          <CardContent>
              {orders.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    No orders found.
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Order ID</TableHead>
                    <TableHead className="min-w-[150px]">User</TableHead>
                    <TableHead className="w-[150px]">Date</TableHead>
                    <TableHead className="w-[100px] text-right">Total</TableHead>
                    <TableHead className="w-[120px] text-center">Status</TableHead>
                    {/* Add more columns like Items count if needed */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0,8)}...</TableCell>
                       <TableCell>
                        <div className="font-medium">{order.userEmail}</div>
                        <div className="text-xs text-muted-foreground">{order.userId.substring(0,10)}...</div>
                       </TableCell>
                      <TableCell>{order.orderDate.toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">${order.totalPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        {/* Implement status logic later */}
                         <Badge variant="secondary">Processing</Badge>
                      </TableCell>
                       {/* Optionally add a button/link to view order details */}
                       {/* <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                       </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
