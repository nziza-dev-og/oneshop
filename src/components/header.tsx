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
    <header className="sticky top-0 z-50 w-full border-b bg-slate-900 text-slate-50 shadow-md"> {/* Dark header background */}
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-accent" /> {/* Accent color for logo icon */}
          <span className="text-xl font-bold text-white">ShopEasy</span> {/* White text for logo */}
        </Link>

        <nav className="flex items-center gap-1 md:gap-2"> {/* Adjusted gap */}
          {/* Navigation Icons */}
           <Link href="/about" passHref>
              <Button variant="ghost" size="icon" aria-label="About Us" className="text-slate-300 hover:text-white hover:bg-slate-700"> {/* Adjusted button style */}
                  <Info className="h-5 w-5" />
              </Button>
           </Link>
            <Link href="/contact" passHref>
               <Button variant="ghost" size="icon" aria-label="Contact Us" className="text-slate-300 hover:text-white hover:bg-slate-700"> {/* Adjusted button style */}
                   <Mail className="h-5 w-5" />
               </Button>
            </Link>

           <Separator orientation="vertical" className="h-6 mx-1 md:mx-2 bg-slate-600" /> {/* Separator style */}


          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-md bg-slate-700"></div> // Skeleton loader
          ) : user ? (
            <>
             {isAdmin && (
                <Link href="/admin"> {/* Link to Admin Overview */}
                  <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-slate-300 hover:text-white hover:bg-slate-700" aria-label="Admin Panel"> {/* Hide on small screens, adjusted style */}
                    <ShieldCheck className="h-5 w-5" />
                  </Button>
                </Link>
              )}
               <NotificationDropdown /> {/* Add Notification Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   {/* Adjusted Avatar button style */}
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-slate-700">
                    <Avatar className="h-8 w-8">
                      {/* Use a conditional src to avoid passing null/undefined */}
                      {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName ?? user.email ?? 'User'} />}
                      <AvatarFallback className="bg-slate-600 text-slate-200">{getInitials(user.email)}</AvatarFallback> {/* Adjusted fallback style */}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card text-card-foreground border-border" align="end" forceMount> {/* Adjusted dropdown content style */}
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName ?? 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" /> {/* Adjusted separator style */}
                   <DropdownMenuItem asChild className="hover:bg-secondary focus:bg-secondary"> {/* Adjusted item style */}
                      <Link href="/dashboard"> {/* Link to User Dashboard */}
                         <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                   </DropdownMenuItem>
                   {/* Show Admin link here too for smaller screens */}
                    {isAdmin && (
                        <DropdownMenuItem asChild className="sm:hidden hover:bg-secondary focus:bg-secondary"> {/* Adjusted item style */}
                            <Link href="/admin">
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                <span>Admin Panel</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                  <DropdownMenuSeparator className="bg-border" /> {/* Adjusted separator style */}
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive"> {/* Adjusted logout item style */}
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                 <Button variant="ghost" size="sm" disabled={!auth} className="text-slate-300 hover:text-white hover:bg-slate-700"> {/* Adjusted button style */}
                    <LogIn className="mr-2 h-4 w-4" /> Login
                 </Button>
              </Link>
               <Link href="/register">
                 <Button variant="outline" size="sm" disabled={!auth} className="text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white"> {/* Adjusted button style */}
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
