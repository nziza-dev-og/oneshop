 "use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Users, BarChart3, DollarSign } from "lucide-react"; // Import icons
import { collection, getDocs, query, where, Timestamp, onSnapshot } from 'firebase/firestore'; // Import onSnapshot
import { db } from '@/lib/firebase/firebase'; // db might be null


export default function AdminOverviewPage() {
  const { user, loading: authLoading, isAdmin } = useAuth(); // isAdmin check is mostly handled by layout
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);

  useEffect(() => {
      if (!authLoading && isAdmin && db) { // Check db
        setStatsLoading(true);

        // Listener for total orders count
        const ordersRef = collection(db, 'orders');
        const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
             setTotalOrders(snapshot.size); // Get total count of documents

             // Calculate total revenue from orders (excluding cancelled)
             let currentRevenue = 0;
             snapshot.forEach(doc => {
                 const data = doc.data();
                 if (data.status !== 'Cancelled') {
                     currentRevenue += data.totalPrice || 0;
                 }
             });
             setTotalRevenue(currentRevenue);

        }, (error) => {
            console.error("Error fetching order count:", error);
            setTotalOrders(0); // Set to 0 or handle error state
            setTotalRevenue(0);
        });

        // Listener for total users count
        const usersRef = collection(db, 'users');
        const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
          setTotalUsers(snapshot.size);
        }, (error) => {
           console.error("Error fetching user count:", error);
           setTotalUsers(0); // Set to 0 or handle error state
        });

         // Set loading to false once initial data might be available (or after a short delay)
         // Note: onSnapshot provides real-time updates, so "loading" is more about the initial fetch
         const timer = setTimeout(() => setStatsLoading(false), 500); // Adjust delay as needed

        // Cleanup listeners on component unmount
        return () => {
            unsubscribeOrders();
            unsubscribeUsers();
            clearTimeout(timer);
        };
      } else if (!authLoading && !isAdmin) {
          setStatsLoading(false); // Not admin, stop loading
      } else if (!db) {
          setStatsLoading(false); // db not available, stop loading
          console.error("Database service not available for admin overview.");
          // Optionally show a toast or message
      }
  }, [authLoading, isAdmin]);

  if (authLoading || statsLoading) {
    return (
        <div>
            <Skeleton className="h-8 w-1/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-40 rounded-lg" />
            </div>
        </div>
    )
  }

  // Fallback if layout somehow fails or user is not admin
  if (!isAdmin) {
      return <div>Access Denied.</div>
  }

   if (!db) {
       return <div className="text-center text-destructive">Database service is unavailable. Cannot load overview data.</div>;
   }


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Overview</h1>
      <p className="text-muted-foreground mb-6">Welcome, {user?.displayName || user?.email}. Manage your store here.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Stats Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders ?? '--'}</div>
            <p className="text-xs text-muted-foreground">Number of orders placed</p>
             <Link href="/admin/orders" passHref>
                <Button variant="link" size="sm" className="px-0 mt-2">View Orders</Button>
             </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers ?? '--'}</div>
            <p className="text-xs text-muted-foreground">Number of registered users</p>
            <Link href="/admin/users" passHref>
                 <Button variant="link" size="sm" className="px-0 mt-2">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
             <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">${totalRevenue?.toFixed(2) ?? '--,--'}</div>
            <p className="text-xs text-muted-foreground">Total revenue from orders</p>
             <Link href="/admin/statistics" passHref>
                <Button variant="link" size="sm" className="px-0 mt-2">View Statistics</Button>
             </Link>
          </CardContent>
        </Card>

        {/* Add more quick links or summary cards as needed */}

      </div>
    </div>
  );
}

    
