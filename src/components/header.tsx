"use client";

import Link from 'next/link';
import { ShoppingBag, LogIn, UserPlus, User, LogOut, ShieldCheck, LayoutDashboard, Info, Mail } from 'lucide-react'; // Added Info, Mail
import { CartSheet } from '@/components/cart-sheet';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/firebase'; // auth might be null
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { NotificationDropdown } from '@/components/notification-dropdown'; // Import NotificationDropdown
import { Separator } from "@/components/ui/separator";

export function Header() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) {
        toast({ title: "Logout Failed", description: "Authentication service not available.", variant: "destructive" });
        return;
    }
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/'); // Redirect to home after logout
    } catch (error) {
      console.error("Logout Error:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    }
  };

  const getInitials = (email?: string | null) => {
    return email ? email.substring(0, 2).toUpperCase() : '??';
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">ShopEasy</span>
        </Link>

        <nav className="flex items-center gap-1 md:gap-2"> {/* Adjusted gap */}
          {/* Navigation Icons */}
           <Link href="/about" passHref>
              <Button variant="ghost" size="icon" aria-label="About Us">
                  <Info className="h-5 w-5" />
              </Button>
           </Link>
            <Link href="/contact" passHref>
               <Button variant="ghost" size="icon" aria-label="Contact Us">
                   <Mail className="h-5 w-5" />
               </Button>
            </Link>

           <Separator orientation="vertical" className="h-6 mx-1 md:mx-2" /> {/* Separator */}


          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-muted"></div> // Skeleton loader
          ) : user ? (
            <>
             {isAdmin && (
                <Link href="/admin"> {/* Link to Admin Overview */}
                  <Button variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Admin Panel"> {/* Hide on small screens */}
                    <ShieldCheck className="h-5 w-5" />
                  </Button>
                </Link>
              )}
               <NotificationDropdown /> {/* Add Notification Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      {/* Use a conditional src to avoid passing null/undefined */}
                      {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName ?? user.email ?? 'User'} />}
                      <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName ?? 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem asChild>
                      <Link href="/dashboard"> {/* Link to User Dashboard */}
                         <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                   </DropdownMenuItem>
                   {/* Show Admin link here too for smaller screens */}
                    {isAdmin && (
                        <DropdownMenuItem asChild className="sm:hidden">
                            <Link href="/admin">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                <span>Admin Panel</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                 <Button variant="ghost" size="sm" disabled={!auth}> {/* Disable if auth not ready */}
                    <LogIn className="mr-2 h-4 w-4" /> Login
                 </Button>
              </Link>
               <Link href="/register">
                 <Button variant="outline" size="sm" disabled={!auth}> {/* Disable if auth not ready */}
                    <UserPlus className="mr-2 h-4 w-4" /> Register
                 </Button>
               </Link>
            </>
          )}
          <CartSheet />
        </nav>
      </div>
    </header>
  );
}

// Helper component (optional, depends on project structure)
// Removed the import of Separator again as it was already imported above
