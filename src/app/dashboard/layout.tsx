"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, ShoppingBag, Settings, Heart, MapPin, LayoutDashboard, Bell } from "lucide-react"; // Added Bell

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
  SidebarInset, // Import SidebarInset for the main content area
} from "@/components/ui/sidebar";
import { useAuth } from "@/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";

const menuItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/dashboard/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell }, // Added Notifications
  { href: "/dashboard/addresses", label: "Address Book", icon: MapPin },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/settings", label: "Account Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

   // Redirect if not logged in after loading
   React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard'); // Redirect to login, saving dashboard path
    }
   }, [user, loading, router]);

   // Show loading state or nothing if user is not confirmed yet
   if (loading || !user) {
     return (
       <div className="flex min-h-[calc(100vh-4rem)]">
         <div className="w-64 border-r p-4 hidden md:block">
           <Skeleton className="h-8 w-3/4 mb-6" />
           <div className="space-y-2">
             {[...Array(7)].map((_, i) => ( // Adjusted count for new item
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


  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader>
          {/* Optional: Add a logo or title here if needed */}
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
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
             <h1 className="text-lg font-semibold ml-4">Dashboard Menu</h1>
        </div>
        <div className="p-4 md:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
