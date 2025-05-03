"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, BarChart3, Users, Settings, LayoutDashboard, ShieldCheck, Bell } from "lucide-react"; // Added Bell

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";

// Updated menu items for admin
const adminMenuItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Manage Orders", icon: ShoppingBag },
  { href: "/admin/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/notifications", label: "Notifications", icon: Bell }, // Added Notifications
  // { href: "/admin/products", label: "Manage Products", icon: Package }, // Example: Add later if needed
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

   // Redirect if not admin or not logged in
   React.useEffect(() => {
    if (loading) return; // Wait for auth state to load

    if (!user) {
      router.push('/login?redirect=/admin'); // Redirect to login if not logged in
    } else if (!isAdmin) {
      router.push('/'); // Redirect to home if logged in but not admin
    }
   }, [user, loading, isAdmin, router]);

   // Show loading state or restrict access message
   if (loading) {
     return (
       <div className="flex min-h-[calc(100vh-4rem)]">
         <div className="w-64 border-r p-4 hidden md:block">
           <Skeleton className="h-8 w-3/4 mb-6" />
           <div className="space-y-2">
             {[...Array(6)].map((_, i) => ( // Adjusted count
               <Skeleton key={i} className="h-10 w-full" />
             ))}
           </div>
         </div>
         <div className="flex-1 p-6">
           <Skeleton className="h-8 w-1/4 mb-6"/>
           <Skeleton className="h-64 w-full" />
         </div>
       </div>
     );
   }

    if (!isAdmin) {
        // Render nothing or an access denied message while redirecting
        return <div className="container mx-auto p-6 text-center">Access Denied. Redirecting...</div>;
    }

  // Render the layout if user is admin
  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader className="p-2 flex items-center justify-center group-data-[collapsible=icon]:justify-center">
           <ShieldCheck className="h-6 w-6 text-primary" />
           <span className="font-semibold text-lg ml-2 group-data-[collapsible=icon]:hidden">Admin Panel</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {adminMenuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))} // Handle active state for nested routes
                    tooltip={item.label}
                    className="justify-start"
                  >
                    <a>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
         {/* Optional SidebarFooter */}
      </Sidebar>

      {/* Main content area */}
      <SidebarInset>
        <div className="flex items-center p-4 border-b md:hidden">
             <SidebarTrigger />
             <h1 className="text-lg font-semibold ml-4">Admin Menu</h1>
        </div>
        <div className="p-4 md:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
