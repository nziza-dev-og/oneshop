"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { collection, query, where, getDocs, orderBy, Timestamp, onSnapshot } from 'firebase/firestore'; // Import onSnapshot
import { db } from '@/lib/firebase/firebase'; // db might be null
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import type { Order } from '@/types'; // Corrected type import
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { ShoppingBag } from 'lucide-react'; // Import icon for empty state
import { format } from 'date-fns'; // Import format for better date display

// Renamed function
export default function DashboardOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Keep router if needed for redirecting non-logged in users
  const { toast } = useToast(); // Initialize toast

  useEffect(() => {
    // Ensure user is loaded, not loading, and db is available
    if (authLoading) {
      setLoading(true); // Keep loading if auth state is still determining
      return;
    }
    if (!user) {
       setLoading(false); // Stop loading if user is not logged in (layout handles redirect)
       return;
    }
    if (!db) {
       toast({ title: "Error", description: "Database service is not available.", variant: "destructive" });
       setLoading(false); // Stop loading if DB is unavailable
       return;
    }

    setLoading(true); // Start loading orders
    const ordersRef = collection(db, 'orders');
    // Query orders for the current user, ordered by date descending
    const q = query(ordersRef, where('userId', '==', user.uid), orderBy('orderDate', 'desc'));

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders = querySnapshot.docs.map(doc => {
        const data = doc.data();

        // Robust date handling
        let orderDate: Date | null = null;
        if (data.orderDate instanceof Timestamp) {
          orderDate = data.orderDate.toDate();
        } else if (data.orderDate?.seconds && typeof data.orderDate.seconds === 'number') {
          // Handle cases where it might be stored as an object { seconds: ..., nanoseconds: ... }
          orderDate = new Timestamp(data.orderDate.seconds, data.orderDate.nanoseconds || 0).toDate();
        } else if (data.orderDate instanceof Date) {
          orderDate = data.orderDate; // Already a Date object
        } else {
           console.warn(`Invalid or missing date format for order ${doc.id}:`, data.orderDate);
           // Keep orderDate as null if invalid/missing, handle display later
        }

        return {
          id: doc.id,
          userId: data.userId,
          items: data.items || [], // Ensure items array exists
          totalPrice: data.totalPrice || 0, // Ensure totalPrice exists
          orderDate: orderDate, // Assign the potentially null Date object
          status: data.status || 'Processing',
          stripeCheckoutSessionId: data.stripeCheckoutSessionId,
          paymentStatus: data.paymentStatus,
          customerEmail: data.customerEmail,
        } as Order;
      });
      setOrders(fetchedOrders);
      setLoading(false); // Stop loading after fetching/processing
    }, (error) => { // Error handling for onSnapshot
      console.error("Error fetching orders:", error);
      toast({ title: "Error", description: "Could not fetch your orders.", variant: "destructive" });
      setOrders([]); // Clear orders on error
      setLoading(false); // Stop loading on error
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();

  }, [user, authLoading, toast]); // Added db to dependency array if it can change, though typically it doesn't

   // Loading state skeleton
   if (loading) {
     return (
        <div>
         <h1 className="text-2xl font-bold mb-6"><Skeleton className="h-8 w-1/3" /></h1>
         <Card>
           <CardHeader>
             <Skeleton className="h-6 w-1/2 mb-2" />
             <Skeleton className="h-4 w-full" />
           </CardHeader>
           <CardContent className="pt-6">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                   <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                   <TableHead className="w-[100px] text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableHead>
                   <TableHead className="w-[120px] text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableHead>
                   <TableHead className="w-[120px] text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {[...Array(2)].map((_, i) => ( // Show skeleton for 2 orders
                   <TableRow key={i}>
                     <TableCell className="hidden sm:table-cell">
                       <Skeleton className="h-12 w-12 rounded-md" />
                     </TableCell>
                     <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                     <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </CardContent>
            <div className="border-t bg-muted/50 px-6 py-3 text-right font-semibold">
                <Skeleton className="h-6 w-40 ml-auto" />
            </div>
         </Card>
       </div>
     );
   }

  // Handled by layout, but good fallback
  if (!user && !authLoading) {
    return <div className="text-center text-muted-foreground p-6">Please log in to view your orders.</div>;
  }

  if (!db) {
       return <div className="text-center text-destructive p-6">Database service is unavailable. Cannot load orders.</div>;
  }


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="pt-10 pb-10 text-center text-muted-foreground flex flex-col items-center justify-center space-y-3">
             <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg">You haven't placed any orders yet.</p>
             <button onClick={() => router.push('/')} className="text-primary hover:underline">
                 Start Shopping
             </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden shadow-md border border-border/50">
              <CardHeader className="bg-muted/30 px-6 py-4 border-b">
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                        <CardTitle className="text-lg font-semibold">Order #{order.id.substring(0, 8)}...</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                           {/* Safely format date, provide fallback */}
                           Placed on: {order.orderDate instanceof Date ? format(order.orderDate, 'PPP') : 'Date unavailable'}
                        </CardDescription>
                    </div>
                    <Badge
                        variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                        className={`w-fit capitalize px-3 py-1 text-sm ${
                            order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                            order.status === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-200' : ''
                        }`}
                    >
                        {order.status}
                    </Badge>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10">
                      <TableHead className="w-[80px] hidden sm:table-cell pl-6"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[100px] text-center">Quantity</TableHead>
                      <TableHead className="w-[120px] text-right">Price</TableHead>
                      <TableHead className="w-[120px] text-right pr-6">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/5">
                        <TableCell className="hidden sm:table-cell pl-6">
                           <div className="relative h-14 w-14 rounded-md overflow-hidden border">
                             <Image
                               src={item.imageUrl}
                               alt={item.name}
                               fill // Use fill instead of layout="fill"
                               style={{ objectFit: 'cover' }} // Use style object for objectFit
                               sizes="(max-width: 640px) 10vw, 5vw" // Provide sizes for responsive images
                               data-ai-hint={item.imageHint || 'product image'} // Add fallback hint
                              />
                           </div>
                        </TableCell>
                        <TableCell className="font-medium py-3">{item.name}</TableCell>
                        <TableCell className="text-center py-3">{item.quantity}</TableCell>
                        <TableCell className="text-right py-3">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right py-3 pr-6">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="border-t bg-muted/30 px-6 py-3 text-right font-semibold text-lg">
                Order Total: ${order.totalPrice.toFixed(2)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
