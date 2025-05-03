"use client";

import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Users, BarChart3 } from "lucide-react"; // Import icons

export default function AdminOverviewPage() {
  const { user, loading, isAdmin } = useAuth(); // isAdmin check is mostly handled by layout

  if (loading) {
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

  // Fallback if layout somehow fails
  if (!isAdmin) {
      return <div>Access Denied.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Overview</h1>
      <p className="text-muted-foreground mb-6">Welcome, {user?.displayName || user?.email}. Manage your store here.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Stats Cards - Replace with actual data fetching later */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div> {/* Placeholder */}
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
            <div className="text-2xl font-bold">--</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Number of registered users</p>
            <Link href="/admin/users" passHref>
                 <Button variant="link" size="sm" className="px-0 mt-2">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Statistics</CardTitle>
             <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">$--,--</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Total revenue overview</p>
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
