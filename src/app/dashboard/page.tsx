"use client";

import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardOverviewPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
        <div>
            <Skeleton className="h-8 w-1/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-6" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
            </div>
        </div>
    )
  }

  if (!user) {
      // This should ideally be handled by the layout, but as a fallback
      return <div>Please log in to view your dashboard.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome back, {user.displayName || user.email}!</h1>
      <p className="text-muted-foreground mb-6">Here's a quick overview of your account.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>View your latest purchases.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder content - Fetch actual recent orders later */}
            <p className="text-sm text-muted-foreground mb-4">No recent orders to display.</p>
            <Link href="/dashboard/orders" passHref>
                 <Button variant="outline" size="sm">View All Orders</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Manage your profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-1"><strong>Email:</strong> {user.email}</p>
            <p className="text-sm mb-4"><strong>Name:</strong> {user.displayName || "Not set"}</p>
            <Link href="/dashboard/profile" passHref>
                 <Button variant="outline" size="sm">Edit Profile</Button>
            </Link>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
            <CardDescription>Manage your saved addresses.</CardDescription>
          </CardHeader>
          <CardContent>
             {/* Placeholder content - Fetch addresses later */}
             <p className="text-sm text-muted-foreground mb-4">No saved addresses.</p>
            <Link href="/dashboard/addresses" passHref>
                 <Button variant="outline" size="sm">Manage Addresses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
