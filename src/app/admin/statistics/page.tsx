 "use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { collection, query, getDocs, orderBy, where, Timestamp, onSnapshot } from 'firebase/firestore'; // Added onSnapshot
import { db } from '@/lib/firebase/firebase'; // db might be null
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"; // Assuming chart components exist
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; // Using recharts directly, Added ResponsiveContainer
import { ShoppingBag, Users, DollarSign } from "lucide-react"; // Added Users, DollarSign
import type { Order, Product, UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface MonthlySalesData {
  month: string;
  revenue: number;
}

interface ProductSalesData {
    id: string; // Use product ID as key
    name: string;
    unitsSold: number;
    revenue: number;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export default function AdminStatisticsPage() {
   const { isAdmin, loading: authLoading } = useAuth();
   const [loading, setLoading] = useState(true);
   const [totalRevenue, setTotalRevenue] = useState<number>(0);
   const [totalOrders, setTotalOrders] = useState<number>(0);
   const [totalUsers, setTotalUsers] = useState<number>(0);
   const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
   const [productSales, setProductSales] = useState<ProductSalesData[]>([]);
   const { toast } = useToast();

   useEffect(() => {
     if (!authLoading && isAdmin && db) { // Check db
       setLoading(true);

       // Listener for Users count
       const usersRef = collection(db, 'users');
       const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
         setTotalUsers(snapshot.size);
       }, (error) => {
         console.error("Error fetching user count:", error);
         toast({ title: "Error", description: "Could not fetch user statistics.", variant: "destructive" });
       });

       // Listener for Orders data
       const ordersRef = collection(db, 'orders');
       const ordersQuery = query(ordersRef, orderBy('orderDate', 'desc'));
       const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
         const fetchedOrders: Order[] = snapshot.docs.map(doc => {
           const data = doc.data();
           let orderDate: Date;
           if (data.orderDate instanceof Timestamp) {
             orderDate = data.orderDate.toDate();
           } else if (data.orderDate && typeof data.orderDate.seconds === 'number') {
             orderDate = new Timestamp(data.orderDate.seconds, data.orderDate.nanoseconds).toDate();
           } else if (data.orderDate instanceof Date) {
               orderDate = data.orderDate;
           } else {
             orderDate = new Date(); // Fallback
           }
           return {
              id: doc.id,
              userId: data.userId,
              items: data.items,
              totalPrice: data.totalPrice,
              orderDate: orderDate,
              status: data.status || 'Processing',
           } as Order;
         });

         // Calculate Totals
         const currentTotalRevenue = fetchedOrders.reduce((sum, order) => order.status !== 'Cancelled' ? sum + order.totalPrice : sum, 0);
         const currentTotalOrders = fetchedOrders.length;
         setTotalRevenue(currentTotalRevenue);
         setTotalOrders(currentTotalOrders);

         // --- Calculate Monthly Sales ---
         const salesByMonth: { [key: string]: number } = {};
         const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
         const currentYear = new Date().getFullYear();
         const lastSixMonthsKeys: string[] = [];
         for (let i = 5; i >= 0; i--) {
             const date = new Date(currentYear, new Date().getMonth() - i, 1);
             const monthKey = `${date.getFullYear()}-${monthNames[date.getMonth()]}`;
             lastSixMonthsKeys.push(monthKey);
             salesByMonth[monthKey] = 0; // Initialize with 0
         }


         fetchedOrders.forEach(order => {
           if (order.status !== 'Cancelled') {
              const monthIndex = order.orderDate.getMonth(); // 0-11
              const year = order.orderDate.getFullYear();
              const monthKey = `${year}-${monthNames[monthIndex]}`;

              if (salesByMonth.hasOwnProperty(monthKey)) { // Only include months within our target range
                salesByMonth[monthKey] += order.totalPrice;
              }
           }
         });

         // Convert to chart format using the pre-defined keys
         const monthlySalesData = lastSixMonthsKeys.map(key => ({
             month: key.split('-')[1], // Get "May" from "2024-May"
             revenue: salesByMonth[key]
         }));

         setMonthlySales(monthlySalesData);

         // --- Calculate Product Sales ---
         const salesByProduct: { [key: string]: ProductSalesData } = {};
         fetchedOrders.forEach(order => {
           if (order.status !== 'Cancelled') {
               order.items.forEach(item => {
                   if (!salesByProduct[item.id]) {
                       // Ensure name is available, provide fallback
                       salesByProduct[item.id] = { id: item.id, name: item.name || 'Unknown Product', unitsSold: 0, revenue: 0 };
                   }
                   salesByProduct[item.id].unitsSold += item.quantity;
                   salesByProduct[item.id].revenue += item.quantity * item.price;
               });
           }
         });

         const productSalesData = Object.values(salesByProduct)
              .sort((a, b) => b.revenue - a.revenue); // Sort by revenue

         setProductSales(productSalesData.slice(0, 10)); // Show top 10 products

         setLoading(false); // Data processed, stop loading

       }, (error) => {
         console.error("Error fetching order statistics:", error);
         toast({ title: "Error", description: "Could not fetch order statistics.", variant: "destructive" });
         setLoading(false);
       });

       // Cleanup listeners on component unmount
       return () => {
         unsubscribeUsers();
         unsubscribeOrders();
       };

     } else if (!db) {
        setLoading(false);
        toast({ title: "Error", description: "Database service is not available.", variant: "destructive" });
     } else if (!isAdmin && !authLoading) {
         setLoading(false); // Stop loading if not admin
     }
   }, [isAdmin, authLoading, db, toast]); // Added db to dependency array


   if (loading) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-6"><Skeleton className="h-8 w-1/2" /></h1>
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                     <Skeleton className="h-28 rounded-lg" />
                     <Skeleton className="h-28 rounded-lg" />
                     <Skeleton className="h-28 rounded-lg" />
                </div>
                 <Skeleton className="h-80 w-full mb-8" />
                 <Skeleton className="h-64 w-full" />
            </div>
        );
   }

    // Layout should handle non-admin access, but adding a fallback check
   if (!isAdmin && !authLoading) {
        return <div className="text-center text-muted-foreground py-10">Access Denied.</div>;
   }

   if (!db) {
        return <div className="text-center text-destructive">Database service is unavailable. Cannot load statistics.</div>;
   }


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sales &amp; Business Statistics</h1>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {totalOrders} orders</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
             <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Total orders placed</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
             <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
      </div>

       {/* Sales Chart */}
        <Card className="mb-8">
            <CardHeader>
            <CardTitle>Monthly Revenue (Last 6 Months)</CardTitle>
            <CardDescription>Revenue trends over the recent months.</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlySales.length > 0 ? (
                 <ChartContainer config={chartConfig} className="h-[300px] w-full">
                   {/* Wrap BarChart with ResponsiveContainer */}
                   <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={monthlySales} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                         <CartesianGrid vertical={false} strokeDasharray="3 3" />
                         <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                         />
                         <YAxis tickLine={false} axisLine={false} tickMargin={8} width={50} tickFormatter={(value) => `$${value}`}/>
                         <Tooltip
                           cursor={false}
                           content={<ChartTooltipContent hideLabel />}
                           formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                         />
                         <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} /> {/* Added radius */}
                       </BarChart>
                   </ResponsiveContainer>
                 </ChartContainer>
                ) : (
                    <div className="text-center text-muted-foreground py-8">No sales data available for the chart.</div>
                )}
            </CardContent>
        </Card>

      {/* Product Buying Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products (by Revenue)</CardTitle>
          <CardDescription>Performance of products based on units sold and revenue.</CardDescription>
        </CardHeader>
        <CardContent>
          {productSales.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {productSales.map((product) => (
                    <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.unitsSold}</TableCell>
                    <TableCell className="text-right">${product.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
           ) : (
             <div className="text-center text-muted-foreground py-8">No product sales data available.</div>
           )}
          {/* Add pagination if needed */}
        </CardContent>
      </Card>

    </div>
  );
}

