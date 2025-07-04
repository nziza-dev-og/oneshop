
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase'; // db might be null
import type { Order as GlobalOrder } from '@/types'; // Assuming Order type exists
import { useCart } from '@/hooks/useCart'; // Import useCart for wishlist count
import { Heart, Package } from 'lucide-react'; // Import icons

// Define a local type for the orders to be stored in state, allowing Date | null for orderDate
interface DashboardOrder extends Omit<GlobalOrder, 'orderDate' | 'items'> {
  orderDate: Date | null;
  // items can be kept minimal for overview, or use a specific type if needed
  items: Pick<GlobalOrder['items'][0], 'id' | 'name' | 'price' | 'quantity' | 'imageUrl' | 'imageHint'>[];
}


export default function DashboardOverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const { wishlist } = useCart(); // Get wishlist from cart hook
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // Track client-side rendering

   useEffect(() => {
     setIsClient(true); // Component has mounted
     if (!authLoading && user && db) { // Check db
       const fetchRecentOrders = async () => {
         setOrdersLoading(true);
         try {
           const ordersRef = collection(db, 'orders');
           // Query for the current user's orders, ordered by date, limit to 3
           const q = query(
             ordersRef,
             where('userId', '==', user.uid),
             orderBy('orderDate', 'desc'),
             limit(3)
           );
           const querySnapshot = await getDocs(q);
           const fetchedOrders = querySnapshot.docs.map(doc => {
              const data = doc.data();
               let orderDate: Date | null = null; // Initialize as null
               if (data.orderDate instanceof Timestamp) {
                 orderDate = data.orderDate.toDate();
               } else if (data.orderDate && typeof data.orderDate.seconds === 'number') {
                 orderDate = new Timestamp(data.orderDate.seconds, data.orderDate.nanoseconds || 0).toDate();
               } else if (data.orderDate instanceof Date){
                   orderDate = data.orderDate;
               } else if (data.orderDate) { // If it exists but is not a recognized type
                 console.warn(`Invalid date format for order ${doc.id}:`, data.orderDate);
                 // orderDate remains null
               }
               // else: data.orderDate is undefined/null, so orderDate remains null

             return {
               id: doc.id,
               userId: data.userId,
               items: data.items || [], // Ensure items array exists
               totalPrice: data.totalPrice || 0, // Ensure totalPrice exists
               orderDate: orderDate, // This is now Date | null
               status: data.status || 'Processing', // Default status
             } as DashboardOrder; // Cast to local type
           });
           setRecentOrders(fetchedOrders);
         } catch (error) {
           console.error("Error fetching recent orders:", error);
           // Handle error display if needed
         } finally {
           setOrdersLoading(false);
         }
       };
       fetchRecentOrders();
     } else if (!authLoading && !user) {
         setOrdersLoading(false); // Not logged in, stop loading
     } else if (!db) {
         setOrdersLoading(false); // db not available, stop loading
         console.error("Database service not available for dashboard overview.");
         // Optionally show a toast or message
     }
   }, [authLoading, user]);

  const wishlistCount = isClient ? wishlist.length : 0; // Get wishlist count on client

  // Use combined loading state
  const isLoading = authLoading || ordersLoading;

  if (isLoading) {
    return (
        <div>
            <Skeleton className="h-8 w-1/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48 rounded-lg" /> {/* Adjusted height */}
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-48 rounded-lg" />
                 <Skeleton className="h-48 rounded-lg" /> {/* Added skeleton for wishlist */}
            </div>
        </div>
    )
  }

  if (!user) {
      // This should ideally be handled by the layout, but as a fallback
      return <div>Please log in to view your dashboard.</div>
  }

  if (!db) {
      return <div className="text-center text-destructive">Database service is unavailable. Cannot load dashboard data.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome back, {user.displayName || user.email}!</h1>
      <p className="text-muted-foreground mb-6">Here's a quick overview of your account.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
             <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
               <div className="space-y-3 mt-2">
                 {recentOrders.map(order => (
                    <div key={order.id} className="flex justify-between items-start text-sm">
                       <div>
                         <p className="font-medium">Order #{order.id.substring(0,6)}...</p>
                         <p className="text-xs text-muted-foreground">
                           {order.orderDate ? order.orderDate.toLocaleDateString() : 'Date unavailable'}
                         </p>
                       </div>
                        <p className="font-semibold">${order.totalPrice.toFixed(2)}</p>
                    </div>
                 ))}
               </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No recent orders to display.</p>
            )}
            <Link href="/dashboard/orders" passHref>
                 <Button variant="link" size="sm" className="px-0 mt-4">View All Orders</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium">Account Details</CardTitle>
             {/* Optional icon */}
           </CardHeader>
          <CardContent>
            <p className="text-sm mb-1 mt-2"><strong>Email:</strong> {user.email}</p>
            <p className="text-sm mb-1"><strong>Name:</strong> {user.displayName || "Not set"}</p>
            <Link href="/dashboard/profile" passHref>
                 <Button variant="link" size="sm" className="px-0 mt-4">Edit Profile</Button>
            </Link>
          </CardContent>
        </Card>

         <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
             <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold mt-2">{wishlistCount}</div>
             <p className="text-xs text-muted-foreground">
                 Item(s) saved for later
             </p>
            <Link href="/dashboard/wishlist" passHref>
                 <Button variant="link" size="sm" className="px-0 mt-4">View Wishlist</Button>
            </Link>
          </CardContent>
        </Card>

         {/* Address Card remains the same - data fetching not implemented yet */}
         <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Addresses</CardTitle>
            {/* Optional icon */}
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground mt-2">No saved addresses.</p>
            <Link href="/dashboard/addresses" passHref>
                 <Button variant="link" size="sm" className="px-0 mt-4">Manage Addresses</Button>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

