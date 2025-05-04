"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, Timestamp, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { UserProfile, Order } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Mail, CalendarDays, ShoppingBag, ShieldCheck, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminUserProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const { isAdmin, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdmin || !db || !uid) {
        setLoading(false);
        if (!db && isAdmin) toast({ title: "Error", description: "Database service unavailable.", variant: "destructive" });
        // Redirect handled by layout, but can add extra check here
        if (!isAdmin && !authLoading) router.push('/');
        return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch User Profile
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          toast({ title: "Error", description: "User not found.", variant: "destructive" });
          router.push('/admin/users'); // Redirect if user doesn't exist
          return;
        }

        const userData = userDocSnap.data();
        let createdAt: Date;
        if (userData.createdAt instanceof Timestamp) createdAt = userData.createdAt.toDate();
        else if (userData.createdAt?.seconds) createdAt = new Timestamp(userData.createdAt.seconds, userData.createdAt.nanoseconds).toDate();
        else createdAt = new Date(); // Fallback

        setProfile({
            uid: userDocSnap.id,
            email: userData.email || 'N/A',
            displayName: userData.displayName || 'N/A',
            createdAt: createdAt,
            isAdmin: userData.isAdmin || false,
            notificationPreferences: userData.notificationPreferences || {},
        } as UserProfile);

        // Fetch User Orders
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('userId', '==', uid), orderBy('orderDate', 'desc'));
        const ordersSnapshot = await getDocs(q);
        const fetchedOrders = ordersSnapshot.docs.map(doc => {
            const data = doc.data();
            let orderDate: Date;
            if (data.orderDate instanceof Timestamp) orderDate = data.orderDate.toDate();
            else if (data.orderDate?.seconds) orderDate = new Timestamp(data.orderDate.seconds, data.orderDate.nanoseconds).toDate();
            else orderDate = new Date(); // Fallback

            return {
                id: doc.id,
                ...data,
                orderDate: orderDate,
            } as Order;
        });
        setOrders(fetchedOrders);

      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({ title: "Error", description: "Could not load user details.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAdmin, authLoading, uid, router, toast]);

   const handleToggleAdminRole = async () => {
        if (!isAdmin || !db || !profile) return;
        setRoleUpdating(true);
        const newAdminStatus = !profile.isAdmin;
        const userDocRef = doc(db, 'users', profile.uid);

        try {
            await updateDoc(userDocRef, { isAdmin: newAdminStatus });
            setProfile(prev => prev ? { ...prev, isAdmin: newAdminStatus } : null); // Update local state
            toast({
                title: "Role Updated",
                description: `${profile.displayName || profile.email} is now ${newAdminStatus ? 'an Admin' : 'a User'}.`,
            });
        } catch (error) {
            console.error("Error updating user role:", error);
            toast({ title: "Update Failed", description: "Could not update user role.", variant: "destructive" });
        } finally {
            setRoleUpdating(false);
        }
    };


  if (loading || authLoading) {
    return (
        <div className="space-y-6">
            <Button variant="outline" size="sm" disabled><ArrowLeft className="mr-2 h-4 w-4" />Back to Users</Button>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (!isAdmin) {
    return <div className="text-center text-muted-foreground">Access Denied.</div>; // Should be handled by layout
  }

  if (!profile) {
    return <div className="text-center text-muted-foreground">User not found or failed to load.</div>;
  }

   const getInitials = (name?: string | null, email?: string | null) => {
        if (name && name.includes(' ')) return name.split(' ').map(n => n[0]).join('').toUpperCase();
        if (name) return name.substring(0, 2).toUpperCase();
        if (email) return email.substring(0, 2).toUpperCase();
        return '??';
   }


  return (
    <div className="space-y-8">
       <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
         <ArrowLeft className="mr-2 h-4 w-4" />
         Back to Users List
       </Button>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
            <div className="flex items-center space-x-4">
                 <Avatar className="h-16 w-16 border">
                    {/* Add AvatarImage if profile picture URL exists */}
                    <AvatarFallback className="text-xl">{getInitials(profile.displayName, profile.email)}</AvatarFallback>
                 </Avatar>
                 <div className="flex-1">
                    <CardTitle className="text-2xl">{profile.displayName}</CardTitle>
                     <CardDescription className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4"/> {profile.email}
                        <span className="mx-1">•</span>
                        <CalendarDays className="h-4 w-4"/> Joined: {format(profile.createdAt as Date, 'PPP')}
                     </CardDescription>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <Badge variant={profile.isAdmin ? 'default' : 'secondary'} className="text-xs">
                        {profile.isAdmin ? <><ShieldCheck className="mr-1 h-3 w-3"/> Admin</> : <><User className="mr-1 h-3 w-3"/> User</>}
                    </Badge>
                      <AlertDialog>
                         <AlertDialogTrigger asChild>
                            <Button
                                variant="outline" size="sm"
                                disabled={roleUpdating}
                            >
                                 {roleUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (profile.isAdmin ? <User className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />)}
                                 {roleUpdating ? 'Updating...' : (profile.isAdmin ? 'Revoke Admin' : 'Make Admin')}
                            </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                             <AlertDialogHeader>
                                 <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
                                 <AlertDialogDescription>
                                     Are you sure you want to {profile.isAdmin ? 'revoke admin privileges from' : 'grant admin privileges to'} {profile.displayName || profile.email}?
                                 </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                                 <AlertDialogCancel disabled={roleUpdating}>Cancel</AlertDialogCancel>
                                 <AlertDialogAction onClick={handleToggleAdminRole} disabled={roleUpdating}>
                                      {roleUpdating ? 'Confirming...' : 'Confirm'}
                                 </AlertDialogAction>
                             </AlertDialogFooter>
                         </AlertDialogContent>
                      </AlertDialog>

                 </div>
            </div>
        </CardHeader>
        <CardContent>
          {/* Add more profile details here if needed, e.g., last login, addresses */}
           <h3 className="text-lg font-semibold mb-3 mt-4">Notification Preferences</h3>
           <div className="space-y-2 text-sm text-muted-foreground">
                <p>Marketing: {profile.notificationPreferences?.marketing ? 'Subscribed' : 'Not Subscribed'}</p>
                <p>Order Updates: {profile.notificationPreferences?.orderUpdates !== false ? 'Subscribed' : 'Not Subscribed'}</p>
                 <p>New Products: {profile.notificationPreferences?.newProducts ? 'Subscribed' : 'Not Subscribed'}</p>
            </div>
        </CardContent>
      </Card>

      {/* User Orders Card */}
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5"/> Order History</CardTitle>
          <CardDescription>Orders placed by this user.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No orders found for this user.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Order ID</TableHead>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead className="w-[100px] text-right">Total</TableHead>
                  <TableHead className="w-[120px] text-center">Status</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.substring(0,8)}...</TableCell>
                    <TableCell>{(order.orderDate as Date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">${order.totalPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                       <Badge
                            variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                            className={`capitalize ${order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : ''} ${order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' : ''}`}
                       >
                          {order.status}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-right">
                        {/* Link to the specific order details page in admin */}
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/orders/${order.id}`}>View</Link> {/* Assuming /admin/orders/[orderId] page */}
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
           {/* Add pagination if order list becomes long */}
        </CardContent>
      </Card>
    </div>
  );
}
