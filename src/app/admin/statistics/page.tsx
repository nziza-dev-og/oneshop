"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"; // Assuming chart components exist
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'; // Using recharts directly
import { TrendingUp } from "lucide-react";


// Placeholder data - Replace with actual fetched data
const totalRevenue = 12345.67;
const totalOrders = 582;
const averageOrderValue = totalRevenue / totalOrders;

const salesData = [
  { month: "Jan", revenue: 1200 },
  { month: "Feb", revenue: 1500 },
  { month: "Mar", revenue: 1800 },
  { month: "Apr", revenue: 1600 },
  { month: "May", revenue: 2100 },
  { month: "Jun", revenue: 2500 },
];

const productSalesData = [
  { name: "EcoComfort T-Shirt", unitsSold: 150, revenue: 3748.50 },
  { name: "Urban Explorer Backpack", unitsSold: 80, revenue: 6396.00 },
  { name: "Wireless Headphones", unitsSold: 50, revenue: 7450.00 },
  { name: "Classic Canvas Sneakers", unitsSold: 120, revenue: 6600.00 },
  { name: "Smart Fitness Tracker", unitsSold: 75, revenue: 7499.25 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export default function AdminStatisticsPage() {
   // Add loading state later if data fetching is implemented
   const loading = false;

   if (loading) {
        return (
            <div>
                <Skeleton className="h-8 w-1/4 mb-6" />
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                     <Skeleton className="h-28 rounded-lg" />
                     <Skeleton className="h-28 rounded-lg" />
                     <Skeleton className="h-28 rounded-lg" />
                </div>
                 <Skeleton className="h-80 w-full mb-6" />
                 <Skeleton className="h-64 w-full" />
            </div>
        );
   }


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sales & Product Statistics</h1>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-muted-foreground">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+15.2% from last month</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
             <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">+8.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
             <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">+5.5% from last month</p>
          </CardContent>
        </Card>
      </div>

       {/* Sales Chart */}
        <Card className="mb-8">
            <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue trends over the past months.</CardDescription>
            </CardHeader>
            <CardContent>
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
               <BarChart data={salesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                 <CartesianGrid vertical={false} strokeDasharray="3 3" />
                 <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    // tickFormatter={(value) => value.slice(0, 3)} // Already short month names
                 />
                 <YAxis tickLine={false} axisLine={false} tickMargin={8} width={50}/>
                 <Tooltip
                   cursor={false}
                   content={<ChartTooltipContent hideLabel />}
                 />
                 <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
               </BarChart>
             </ChartContainer>
            </CardContent>
        </Card>

      {/* Product Buying Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Performance of products based on units sold and revenue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productSalesData.sort((a, b) => b.revenue - a.revenue).map((product) => ( // Sort by revenue desc
                <TableRow key={product.name}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">{product.unitsSold}</TableCell>
                  <TableCell className="text-right">${product.revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Add pagination if needed */}
        </CardContent>
      </Card>

    </div>
  );
}


// Ensure ChartTooltipContent exists or is defined/imported correctly
// If not using shadcn/ui charts directly, you might need a custom tooltip component
// const ChartTooltipContent = ({ active, payload, label }: any) => {
//   if (active && payload && payload.length) {
//     return (
//       <div className="rounded-lg border bg-background p-2 shadow-sm">
//         <div className="grid grid-cols-2 gap-2">
//           <div className="flex flex-col">
//             <span className="text-[0.70rem] uppercase text-muted-foreground">
//               Month
//             </span>
//             <span className="font-bold text-muted-foreground">{label}</span>
//           </div>
//           <div className="flex flex-col">
//             <span className="text-[0.70rem] uppercase text-muted-foreground">
//               Revenue
//             </span>
//             <span className="font-bold text-primary">
//               ${payload[0].value.toFixed(2)}
//             </span>
//           </div>
//         </div>
//       </div>
//     );
//   }
//   return null;
// };

