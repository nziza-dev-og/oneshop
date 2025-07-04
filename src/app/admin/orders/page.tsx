 "use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { useAuth } from '@/providers/auth-provider';
import { collection, query, getDocs, orderBy, doc, getDoc, Timestamp, updateDoc, addDoc, serverTimestamp, where, onSnapshot } from 'firebase/firestore'; // Import where and onSnapshot
import { db } from '@/lib/firebase/firebase'; // db might be null
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Import Button
import { MoreHorizontal, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react'; // Import icons, added Eye
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { useToast } from '@/hooks/use-toast'; // Import useToast
import type { Notification } from '@/types'; // Import Notification
import Link from 'next/link'; // Import Link
import type { Order } from '@/types'; // Import Order type


export default function AdminOrdersPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null); // Track updating order
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const filterUserId = searchParams.get('userId'); // Get userId from query param
  const { toast } = useToast(); // Initialize toast
  const [filteredUserName, setFilteredUserName] = useState<string | null>(null); // State to hold the user's name/email if filtering
  const [userEmails, setUserEmails] = useState<Record<string, string>>({}); // Cache user emails

  useEffect(() => {
      // Fetch user emails when component mounts or isAdmin changes, only if not filtering
      const fetchUserEmails = async () => {
          if (isAdmin && db && !filterUserId) {
              try {
                  const usersRef = collection(db, 'users');
                  const userSnapshot = await getDocs(usersRef);
                  const emails: Record<string, string> = {};
                  userSnapshot.forEach(doc => {
                      emails[doc.id] = doc.data().email || 'N/A';
                  });
                  setUserEmails(emails);
              } catch (error) {
                  console.error("Error fetching user emails:", error);
              }
          }
      };
      fetchUserEmails();
  }, [isAdmin, db, filterUserId]); // Depend on db availability

  useEffect(() => {
    // Auth checks handled by layout
    if (!authLoading && isAdmin && db) { // Check db
      setLoading(true);
      setFilteredUserName(null); // Reset user name on fetch

      const ordersRef = collection(db, 'orders');
      let q;
      let fetchedUserName: string | null = null;

      const processOrders = (querySnapshot: any) => { // Helper function
        const fetchedOrders = querySnapshot.docs.map((orderDoc: any) => {
          const data = orderDoc.data();
          const userEmail = filterUserId ? fetchedUserName : (userEmails[data.userId] || 'Loading...'); // Use cache or default

           // Ensure orderDate is converted correctly from Firestore Timestamp or Date
           let orderDate: Date;
           if (data.orderDate instanceof Timestamp) {
             orderDate = data.orderDate.toDate();
           } else if (data.orderDate && typeof data.orderDate.seconds === 'number') {
             orderDate = new Timestamp(data.orderDate.seconds, data.orderDate.nanoseconds).toDate();
           } else if (data.orderDate instanceof Date) {
               orderDate = data.orderDate;
           } else {
             console.warn(`Invalid date format for order ${orderDoc.id}:`, data.orderDate);
             orderDate = new Date(); // Fallback
           }

          return {
            id: orderDoc.id,
            userId: data.userId,
            userEmail: userEmail, // Add userEmail
            items: data.items,
            totalPrice: data.totalPrice,
            orderDate: orderDate, // Use converted Date object
            status: data.status || 'Processing', // Default status
            stripeCheckoutSessionId: data.stripeCheckoutSessionId,
            paymentStatus: data.paymentStatus,
            customerEmail: data.customerEmail,
          } as Order;
        });
        setOrders(fetchedOrders);
        setLoading(false); // Set loading to false after data processing
      }

      if (filterUserId) {
        // Query orders for a specific user
        q = query(ordersRef, where('userId', '==', filterUserId), orderBy('orderDate', 'desc'));
         // Fetch the user's email/name to display in the title
         getDoc(doc(db, 'users', filterUserId)).then(userDocSnap => {
             if (userDocSnap.exists()) {
                fetchedUserName = userDocSnap.data().displayName || userDocSnap.data().email || `User ${filterUserId.substring(0, 6)}...`;
                setFilteredUserName(fetchedUserName);
             }
         }).catch(err => console.error("Error fetching filtered user name:", err));
      } else {
        // Query all orders
        q = query(ordersRef, orderBy('orderDate', 'desc'));
      }

      const unsubscribe = onSnapshot(q, (querySnapshot) => { // Use onSnapshot for real-time updates
          processOrders(querySnapshot);
        }, (error) => { // Error handling for onSnapshot
             console.error("Error fetching orders:", error);
             toast({ title: "Error", description: "Could not fetch orders.", variant: "destructive" });
             setLoading(false);
        });

        // Cleanup function for unsubscribe
        return () => unsubscribe();

    } else if (!authLoading && !isAdmin) {
       // Redirect logic in layout handles non-admins
       setLoading(false);
    } else if (!db) {
        setLoading(false);
        toast({ title: "Error", description: "Database service is not available.", variant: "destructive" });
    }
  }, [user, authLoading, isAdmin, db, router, toast, filterUserId]);


  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    if (!db) { // Check db
        toast({ title: "Error", description: "Database service is not available.", variant: "destructive" });
        return;
    }
    setUpdatingOrderId(orderId); // Set loading state for this specific order
    const orderToUpdate = orders.find(o => o.id === orderId);

    if (!orderToUpdate) {
        toast({ title: "Error", description: "Order not found.", variant: "destructive" });
        setUpdatingOrderId(null);
        return;
    }

    try {
      const orderDocRef = doc(db, 'orders', orderId);
      await updateDoc(orderDocRef, { status: newStatus });

      // Local state update is handled by the onSnapshot listener

      toast({
        title: "Order Updated",
        description: `Order status changed to ${newStatus}.`,
      });

      // Send notification to the user
      if ((newStatus === 'Delivered' || newStatus === 'Cancelled') && db) { // Check db for notification sending
         try {
             const notificationMessage = newStatus === 'Delivered'
                ? `Your order #${orderId.substring(0, 6)}... has been delivered!`
                : `Your order #${orderId.substring(0, 6)}... has been cancelled.`;

             const notificationData: Omit<Notification, 'id' | 'createdAt'> = {
                 userId: orderToUpdate.userId,
                 message: notificationMessage,
                 type: 'order_update',
                 link: '/dashboard/orders', // Link to user's order page
                 read: false,
                 createdAt: serverTimestamp(),
             };
             await addDoc(collection(db, "notifications"), notificationData);
             console.log(`Notification sent to user ${orderToUpdate.userId} for order ${orderId}`);
         } catch (notificationError) {
             console.error("Error sending order status notification:", notificationError);
         }
      }

    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Update Failed",
        description: "Could not update order status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrderId(null); // Reset loading state
    }
  };


   // Skeleton loader while data is fetching
   if (loading) {
     return (
        <div>
         <Skeleton className="h-8 w-1/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-6" />
         <Card>
           <CardContent className="pt-6">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                    {!filterUserId && <TableHead><Skeleton className="h-5 w-32" /></TableHead>}
                   <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-16 text-right" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-24 text-center" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-10 text-right" /></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {[...Array(5)].map((_, i) => (
                   <TableRow key={i}>
                     <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                     {!filterUserId && <TableCell><Skeleton className="h-5 w-32" /></TableCell>}
                     <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                     <TableCell className="text-center"><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
       </div>
     );
   }

  if (!db) {
       return <div className="text-center text-destructive">Database service is unavailable.</div>;
  }


  // If not loading and is admin (layout should ensure this)
  return (
    <div>
      <Card>
          <CardHeader>
            <CardTitle>{filterUserId ? `Orders for ${filteredUserName || 'User'}` : 'All Customer Orders'}</CardTitle>
            <CardDescription>
              {filterUserId ? `Viewing orders placed by ${filteredUserName || filterUserId}` : 'Manage and view all orders placed by users.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
              {orders.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    {filterUserId ? `No orders found for this user.` : `No orders found.`}
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Order ID</TableHead>
                    {!filterUserId && <TableHead className="min-w-[150px]">User</TableHead>}
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
                       {!filterUserId && (
                           <TableCell>
                             <div className="font-medium">{order.customerEmail || userEmails[order.userId] || 'N/A'}</div>
                             <div className="text-xs text-muted-foreground">{order.userId.substring(0,10)}...</div>
                           </TableCell>
                       )}
                      <TableCell>{order.orderDate instanceof Date ? order.orderDate.toLocaleDateString() : 'Invalid Date'}</TableCell>
                      <TableCell className="text-right">${order.totalPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                         <Badge
                            variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                            className={`capitalize ${
                                order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                order.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-200' : ''
                            }`}
                         >
                            {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" className="h-8 w-8 p-0" disabled={updatingOrderId === order.id}>
                             {updatingOrderId === order.id ? (
                               <Loader2 className="h-4 w-4 animate-spin" />
                             ) : (
                               <MoreHorizontal className="h-4 w-4" />
                             )}
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                               <Link href={`/admin/orders/${order.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                               </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild disabled={order.status === 'Delivered' || order.status === 'Cancelled'}>
                                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={order.status === 'Delivered' || order.status === 'Cancelled'}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                    Mark as Delivered
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Delivery</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to mark order {order.id.substring(0,8)}... as Delivered? This will notify the user.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                                    className="bg-primary text-primary-foreground"
                                   >
                                    Confirm Delivery
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                             <AlertDialog>
                                <AlertDialogTrigger asChild disabled={order.status === 'Delivered' || order.status === 'Cancelled'}>
                                   <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    disabled={order.status === 'Delivered' || order.status === 'Cancelled'}
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel Order
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to mark order {order.id.substring(0,8)}... as Cancelled? This action cannot be undone and will notify the user.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Back</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleUpdateOrderStatus(order.id, 'Cancelled')}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                    Confirm Cancellation
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                         </DropdownMenuContent>
                       </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
