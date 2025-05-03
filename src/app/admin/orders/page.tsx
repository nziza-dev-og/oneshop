"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { collection, query, getDocs, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore'; // Import Timestamp
import { db } from '@/lib/firebase/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image'; // Image usage might be added later if viewing order details
import type { CartItem } from '@/types'; // Assuming CartItem usage if viewing order details

interface Order {
  id: string;
  userId: string;
  userEmail?: string; // Add userEmail
  items: CartItem[];
  totalPrice: number;
  orderDate: Date;
  status: string; // Added status
  // Add other order fields like shipping address etc. if needed
}

export default function AdminOrdersPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Auth checks handled by layout
    if (!authLoading && isAdmin) {
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const ordersRef = collection(db, 'orders');
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

             // Ensure orderDate is converted correctly from Firestore Timestamp
             let orderDate: Date;
             if (data.orderDate instanceof Timestamp) {
               orderDate = data.orderDate.toDate();
             } else if (data.orderDate && typeof data.orderDate.seconds === 'number') {
               orderDate = new Timestamp(data.orderDate.seconds, data.orderDate.nanoseconds).toDate();
             } else if (data.orderDate instanceof Date) {
                 orderDate = data.orderDate;
             } else {
               console.warn(`Invalid date format for order ${orderDoc.id}:`, data.orderDate);
               orderDate = new Date(); // Fallback
             }


            return {
              id: orderDoc.id,
              userId: data.userId,
              userEmail: userEmail,
              items: data.items,
              totalPrice: data.totalPrice,
              orderDate: orderDate,
              status: data.status || 'Processing', // Default status
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
    } else if (!authLoading && !isAdmin) {
       // Redirect logic in layout handles non-admins
    }
  }, [user, authLoading, isAdmin, router]); // Dependency array updated

   // Skeleton loader while data is fetching
   if (loading) {
     return (
        <div>
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
                   <TableHead><Skeleton className="h-5 w-16 text-right" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-24 text-center" /></TableHead>
                   {/* <TableHead><Skeleton className="h-5 w-full" /></TableHead> */}
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {[...Array(5)].map((_, i) => (
                   <TableRow key={i}>
                     <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                     <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                     <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                     <TableCell className="text-center"><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                     {/* <TableCell>
                       <div className="flex items-center space-x-2">
                         <Skeleton className="h-10 w-10 rounded" />
                         <Skeleton className="h-5 w-32" />
                       </div>
                     </TableCell> */}
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
       </div>
     );
   }

  // If not loading and is admin (layout should ensure this)
  return (
    <div>
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
                         <Badge
                            variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                            className="capitalize"
                         >
                            {order.status}
                        </Badge>
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
