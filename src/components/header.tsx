
"use client";

import Link from 'next/link';
import { ShoppingBag, LogIn, UserPlus, User, LogOut, ShieldCheck, LayoutDashboard, Info, Mail, ShoppingCartIcon } from 'lucide-react'; // Added Info, Mail, ShoppingCartIcon
// Removed CartSheet import as it's replaced by a direct link
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
import { NotificationDropdown } from '@/components/notification-dropdown'; 
import { Separator } from "@/components/ui/separator";
import { useCart } from '@/hooks/useCart'; // Import useCart to display item count
import { useState, useEffect } from 'react'; // Import useState and useEffect for client-side count

export function Header() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { getTotalItems } = useCart(); // Get cart item count
  const [isClient, setIsClient] = useState(false); // Track client-side rendering

  useEffect(() => {
    setIsClient(true);
  }, []);

  const totalCartItems = isClient ? getTotalItems() : 0;


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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 mr-6">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">ShopEasy</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3 ml-auto">
           <Link href="/about" passHref>
              <Button variant="ghost" size="icon" aria-label="About Us" className="text-muted-foreground hover:text-primary hover:bg-accent/50">
                  <Info className="h-5 w-5" />
              </Button>
           </Link>
            <Link href="/contact" passHref>
               <Button variant="ghost" size="icon" aria-label="Contact Us" className="text-muted-foreground hover:text-primary hover:bg-accent/50">
                   <Mail className="h-5 w-5" />
               </Button>
            </Link>
           <Separator orientation="vertical" className="h-6 mx-1 md:mx-2" />

          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted"></div> 
          ) : user ? (
            <>
             {isAdmin && (
                <Link href="/admin"> 
                  <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-muted-foreground hover:text-primary hover:bg-accent/50" aria-label="Admin Panel">
                    <ShieldCheck className="h-5 w-5" />
                  </Button>
                </Link>
              )}
               <NotificationDropdown /> 
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-accent/50">
                    <Avatar className="h-8 w-8 border">
                      {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName ?? user.email ?? 'User'} />}
                      <AvatarFallback className="bg-muted text-muted-foreground font-medium">{getInitials(user.email)}</AvatarFallback>
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
                      <Link href="/dashboard"> 
                         <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                   </DropdownMenuItem>
                    {isAdmin && (
                        <DropdownMenuItem asChild className="sm:hidden">
                            <Link href="/admin">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                <span>Admin Panel</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                 <Button variant="ghost" size="sm" disabled={!auth} className="text-muted-foreground hover:text-primary hover:bg-accent/50">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                 </Button>
              </Link>
               <Link href="/register">
                 <Button variant="outline" size="sm" disabled={!auth}>
                    <UserPlus className="mr-2 h-4 w-4" /> Register
                 </Button>
               </Link>
            </>
          )}
          {/* Cart Icon linking to /cart page */}
          <Button variant="outline" size="icon" asChild className="relative border-border hover:bg-secondary">
            <Link href="/cart">
              <ShoppingCartIcon className="h-5 w-5" />
              {isClient && totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary rounded-full">
                  {totalCartItems}
                </span>
              )}
              <span className="sr-only">Open Cart Page</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
