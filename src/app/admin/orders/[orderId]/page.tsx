"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, Timestamp, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { Order, UserProfile, Notification } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { ArrowLeft, Package, User, Mail, Phone, MapPin, DollarSign, CalendarDays, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
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

export default function AdminOrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const { isAdmin, loading: authLoading } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!isAdmin || !db || !orderId) {
            setLoading(false);
             if (!db && isAdmin) toast({ title: "Error", description: "Database service unavailable.", variant: "destructive" });
            // Redirect handled by layout/parent page
            return;
        }

        const fetchOrderDetails = async () => {
            setLoading(true);
            try {
                // Fetch Order
                const orderDocRef = doc(db, 'orders', orderId);
                const orderDocSnap = await getDoc(orderDocRef);

                if (!orderDocSnap.exists()) {
                    toast({ title: "Error", description: "Order not found.", variant: "destructive" });
                    router.push('/admin/orders');
                    return;
                }

                const orderData = orderDocSnap.data();
                let orderDate: Date;
                if (orderData.orderDate instanceof Timestamp) orderDate = orderData.orderDate.toDate();
                else if (orderData.orderDate?.seconds) orderDate = new Timestamp(orderData.orderDate.seconds, orderData.orderDate.nanoseconds).toDate();
                else orderDate = new Date(); // Fallback

                const fetchedOrder = { id: orderDocSnap.id, ...orderData, orderDate } as Order;
                setOrder(fetchedOrder);

                // Fetch Customer Details
                if (fetchedOrder.userId) {
                    const userDocRef = doc(db, 'users', fetchedOrder.userId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        let userCreatedAt: Date;
                         if (userData.createdAt instanceof Timestamp) userCreatedAt = userData.createdAt.toDate();
                         else if (userData.createdAt?.seconds) userCreatedAt = new Timestamp(userData.createdAt.seconds, userData.createdAt.nanoseconds).toDate();
                         else userCreatedAt = new Date(); // Fallback

                        setCustomer({
                            uid: userDocSnap.id,
                            email: userData.email || 'N/A',
                            displayName: userData.displayName || 'N/A',
                            createdAt: userCreatedAt,
                            isAdmin: userData.isAdmin || false,
                             // Add other fields if needed, like phone
                        } as UserProfile);
                    } else {
                        console.warn(`Customer profile not found for userId: ${fetchedOrder.userId}`);
                         // Use email from order if available, otherwise show placeholder
                         setCustomer({ uid: fetchedOrder.userId, email: fetchedOrder.customerEmail || 'N/A', displayName: 'N/A', createdAt: new Date(), isAdmin: false });
                    }
                }

            } catch (error) {
                console.error("Error fetching order details:", error);
                toast({ title: "Error", description: "Could not load order details.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [isAdmin, authLoading, orderId, router, toast]);

    const handleUpdateOrderStatus = async (newStatus: Order['status']) => {
        if (!isAdmin || !db || !order) return;
        setUpdatingStatus(true);

        try {
          const orderDocRef = doc(db, 'orders', order.id);
          await updateDoc(orderDocRef, { status: newStatus });

          // Update local state immediately
          setOrder(prev => prev ? { ...prev, status: newStatus } : null);

          toast({ title: "Order Updated", description: `Order status changed to ${newStatus}.` });

          // Send notification to the user
          if ((newStatus === 'Delivered' || newStatus === 'Cancelled') && order.userId && db) {
             try {
                 const notificationMessage = newStatus === 'Delivered'
                    ? `Your order #${order.id.substring(0, 6)}... has been delivered!`
                    : `Your order #${order.id.substring(0, 6)}... has been cancelled.`;

                 const notificationData: Omit<Notification, 'id' | 'createdAt'> = {
                     userId: order.userId,
                     message: notificationMessage,
                     type: 'order_update',
                     link: '/dashboard/orders',
                     read: false,
                     createdAt: serverTimestamp(),
                 };
                 await addDoc(collection(db, "notifications"), notificationData);
             } catch (notificationError) {
                 console.error("Error sending order status notification:", notificationError);
             }
          }

        } catch (error) {
          console.error("Error updating order status:", error);
          toast({ title: "Update Failed", description: "Could not update order status.", variant: "destructive" });
        } finally {
          setUpdatingStatus(false);
        }
      };

    if (loading || authLoading) {
        return (
            <div className="space-y-6">
                <Button variant="outline" size="sm" disabled><ArrowLeft className="mr-2 h-4 w-4" />Back to Orders</Button>
                <Skeleton className="h-32 w-full" />
                <div className="grid md:grid-cols-3 gap-6">
                     <Skeleton className="h-40 md:col-span-2" />
                     <Skeleton className="h-40" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

     if (!isAdmin) return <div className="text-center text-muted-foreground">Access Denied.</div>;
     if (!order) return <div className="text-center text-muted-foreground">Order not found.</div>;
     if (!db) return <div className="text-center text-destructive">Database service unavailable.</div>;

  return (
     <div className="space-y-8">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders List
        </Button>

         {/* Order Summary Header */}
         <Card>
            <CardHeader className="bg-muted/30">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                     <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                             <Package className="h-6 w-6"/> Order #{order.id.substring(0, 8)}...
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1 text-sm">
                             <CalendarDays className="h-4 w-4"/> Placed on: {format(order.orderDate as Date, 'PPP p')}
                             <span className="mx-1">•</span>
                              <DollarSign className="h-4 w-4"/> Total: ${order.totalPrice.toFixed(2)}
                         </CardDescription>
                     </div>
                    <div className="flex flex-col sm:items-end gap-2">
                        <Badge
                            variant={order.status === 'Delivered' ? 'default' : order.status === 'Cancelled' ? 'destructive' : 'secondary'}
                            className={`w-fit capitalize px-3 py-1 text-sm ${
                                order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                order.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800 border-red-200' : ''
                            }`}
                        >
                            {order.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Payment: {order.paymentStatus || 'N/A'}</span>
                    </div>
                 </div>
            </CardHeader>
             {/* Order Actions */}
             {(order.status === 'Processing' || order.status === 'Shipped') && (
                 <CardFooter className="pt-4 flex justify-end gap-2">
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={updatingStatus}>
                                {updatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4 text-green-600" />}
                                Mark as Delivered
                            </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                             <AlertDialogHeader>
                                 <AlertDialogTitle>Confirm Delivery</AlertDialogTitle>
                                 <AlertDialogDescription>
                                     Mark order #{order.id.substring(0,8)}... as Delivered? This will notify the user.
                                 </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                                 <AlertDialogAction onClick={() => handleUpdateOrderStatus('Delivered')} className="bg-primary">Confirm</AlertDialogAction>
                             </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>

                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={updatingStatus} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                {updatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Cancel Order
                            </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                             <AlertDialogHeader>
                                 <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
                                 <AlertDialogDescription>
                                     Cancel order #{order.id.substring(0,8)}...? This cannot be undone and will notify the user.
                                 </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                                 <AlertDialogCancel>Back</AlertDialogCancel>
                                 <AlertDialogAction onClick={() => handleUpdateOrderStatus('Cancelled')} className="bg-destructive hover:bg-destructive/90">Confirm Cancellation</AlertDialogAction>
                             </AlertDialogFooter>
                         </AlertDialogContent>
                        </AlertDialog>
                 </CardFooter>
             )}
        </Card>

        {/* Customer & Items Grid */}
        <div className="grid md:grid-cols-3 gap-6">
            {/* Customer Details */}
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5"/> Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                     {customer ? (
                        <>
                            <p><strong>Name:</strong> <Link href={`/admin/users/${customer.uid}`} className="text-primary hover:underline">{customer.displayName}</Link></p>
                            <p className="flex items-center gap-1"><Mail className="h-4 w-4 text-muted-foreground"/> {customer.email}</p>
                            {/* Add phone if available */}
                            {/* <p className="flex items-center gap-1"><Phone className="h-4 w-4 text-muted-foreground"/> {customer.phone || 'Not Provided'}</p> */}
                            <Separator className="my-3"/>
                            <p className="font-medium">Shipping Address:</p>
                            {/* Add actual shipping address from order data if stored */}
                            <p className="text-muted-foreground">Address details not stored in this version.</p>
                        </>
                    ) : (
                        <p className="text-muted-foreground">Customer details loading or unavailable.</p>
                    )}
                </CardContent>
            </Card>

            {/* Order Items */}
             <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg">Order Items ({order.items.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px] hidden sm:table-cell pl-6"></TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead className="w-[80px] text-center">Qty</TableHead>
                                <TableHead className="w-[100px] text-right">Price</TableHead>
                                <TableHead className="w-[100px] text-right pr-6">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="hidden sm:table-cell pl-6">
                                <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                                    <Image
                                        src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }}
                                        sizes="5vw" data-ai-hint={item.imageHint || 'product'}
                                    />
                                </div>
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                                <TableCell className="text-right pr-6">${(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="justify-end font-semibold text-lg pt-4 pr-6">
                    Order Total: ${order.totalPrice.toFixed(2)}
                </CardFooter>
             </Card>
        </div>
     </div>
  );
}
