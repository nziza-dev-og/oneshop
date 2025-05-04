 "use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { useAuth } from '@/providers/auth-provider';
import { collection, query, getDocs, orderBy, doc, getDoc, Timestamp, updateDoc, addDoc, serverTimestamp, where } from 'firebase/firestore'; // Import where
import { db } from '@/lib/firebase/firebase'; // db might be null
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Import Button
import { MoreHorizontal, CheckCircle, XCircle, Loader2 } from 'lucide-react'; // Import icons
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
import type { CartItem, Notification } from '@/types'; // Assuming CartItem usage if viewing order details, Import Notification

interface Order {
  id: string;
  userId: string;
  userEmail?: string; // Add userEmail
  items: CartItem[];
  totalPrice: number;
  orderDate: Date;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'; // Updated status type
}

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

  useEffect(() => {
    // Auth checks handled by layout
    if (!authLoading && isAdmin && db) { // Check db
      const fetchOrders = async () => {
        setLoading(true);
        setFilteredUserName(null); // Reset user name on fetch
        try {
          const ordersRef = collection(db, 'orders');
          let q;

          if (filterUserId) {
            // Query orders for a specific user
            q = query(ordersRef, where('userId', '==', filterUserId), orderBy('orderDate', 'desc'));
             // Fetch the user's email/name to display in the title
             try {
                const userDocRef = doc(db, 'users', filterUserId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setFilteredUserName(userDocSnap.data().email || `User ${filterUserId.substring(0, 6)}...`);
                }
             } catch { /* Ignore error fetching user name */ }
          } else {
            // Query all orders
            q = query(ordersRef, orderBy('orderDate', 'desc'));
          }

          const querySnapshot = await getDocs(q);

          const fetchedOrdersPromises = querySnapshot.docs.map(async (orderDoc) => {
            const data = orderDoc.data();
            let userEmail = 'N/A';

             // Fetch user email from users collection if not already filtering by user
             if (!filterUserId || data.userId !== filterUserId) {
                 try {
                     const userDocRef = doc(db, 'users', data.userId);
                     const userDocSnap = await getDoc(userDocRef);
                     if (userDocSnap.exists()) {
                         userEmail = userDocSnap.data().email || 'N/A';
                     }
                 } catch (userError) {
                     console.error(`Error fetching user ${data.userId}:`, userError);
                 }
             } else if (filteredUserName) {
                 userEmail = filteredUserName; // Use the already fetched name/email
             }


             // Ensure orderDate is converted correctly from Firestore Timestamp
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
              userEmail: userEmail,
              items: data.items,
              totalPrice: data.totalPrice,
              orderDate: orderDate,
              status: data.status || 'Processing', // Default status
            } as Order;
          });

          const fetchedOrders = await Promise.all(fetchedOrdersPromises);
          setOrders(fetchedOrders);
        } catch (error) {
          console.error("Error fetching orders:", error);
          toast({ title: "Error", description: "Could not fetch orders.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    } else if (!authLoading && !isAdmin) {
       // Redirect logic in layout handles non-admins
    } else if (!db) {
        setLoading(false);
        toast({ title: "Error", description: "Database service is not available.", variant: "destructive" });
    }
  }, [user, authLoading, isAdmin, router, toast, filterUserId, filteredUserName]); // Added filterUserId and filteredUserName

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

      // Update local state immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

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
             // Optionally show a toast, but the main action (order update) succeeded
             // toast({ title: "Notification Error", description: "Could not send update notification to user.", variant: "destructive" });
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
                   <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-16 text-right" /></TableHead>
                   <TableHead><Skeleton className="h-5 w-24 text-center" /></TableHead>
                    <TableHead><Skeleton className="h-5 w-10 text-right" /></TableHead> {/* Actions column */}
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {[...Array(5)].map((_, i) => (
                   <TableRow key={i}>
                     <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                     <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                     <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                     <TableCell className="text-center"><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell> {/* Actions cell */}
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
                    {!filterUserId && <TableHead className="min-w-[150px]">User</TableHead>} {/* Hide User column if filtering */}
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
                             <div className="font-medium">{order.userEmail}</div>
                             <div className="text-xs text-muted-foreground">{order.userId.substring(0,10)}...</div>
                           </TableCell>
                       )}
                      <TableCell>{order.orderDate.toLocaleDateString()}</TableCell>
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
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild disabled={order.status === 'Delivered' || order.status === 'Cancelled'}>
                                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={order.status === 'Delivered' || order.status === 'Cancelled'}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
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
                                    className="text-destructive focus:text-destructive"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Mark as Cancelled
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
