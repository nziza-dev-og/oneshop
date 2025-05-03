"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import type { Notification } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, CheckCheck, Trash2, BellOff } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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

export default function AllNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

   useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return; // No user, no notifications
    }

    setLoading(true);
    const notificationsRef = collection(db, 'notifications');
     // Query only for user-specific and 'all' notifications
     const q = query(
        notificationsRef,
        where('userId', 'in', [user.uid, 'all']),
        orderBy('createdAt', 'desc')
        // No limit, fetch all relevant notifications for this page
     );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
         let createdAt: Date;
         if (data.createdAt instanceof Timestamp) {
             createdAt = data.createdAt.toDate();
         } else if (data.createdAt && typeof data.createdAt.seconds === 'number') {
             createdAt = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate();
         } else if (data.createdAt instanceof Date) {
             createdAt = data.createdAt;
         } else {
             createdAt = new Date(); // Fallback
         }

        return {
          id: doc.id,
          ...data,
           createdAt: createdAt,
        } as Notification;
      });

       // Additional client-side filter might be needed if Firestore rules are complex
       const relevantNotifications = fetchedNotifications.filter(
            n => n.userId === 'all' || n.userId === user.uid
        );

      setNotifications(relevantNotifications);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching all notifications:", error);
      toast({ title: "Error", description: "Could not fetch notifications.", variant: "destructive" });
      setLoading(false);
    });

    return () => unsubscribe();
   }, [user, toast]);

  const handleMarkAsRead = async (notificationId: string) => {
     if (!user) return;
     const notificationRef = doc(db, 'notifications', notificationId);
     try {
       await updateDoc(notificationRef, { read: true });
       // Optimistic update not needed, listener handles it
     } catch (error) {
       console.error("Error marking notification as read:", error);
       toast({ title: "Error", description: "Could not update notification.", variant: "destructive" });
     }
  };

   const handleMarkAllAsRead = async () => {
    if (!user || notifications.filter(n => !n.read).length === 0) return;

    const batch = writeBatch(db);
    notifications.forEach(notification => {
      if (!notification.read) {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      }
    });

    try {
      await batch.commit();
      toast({ title: "Success", description: "All notifications marked as read." });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({ title: "Error", description: "Could not mark all as read.", variant: "destructive" });
    }
  };

   const handleDeleteNotification = async (notificationId: string) => {
        if (!user) return;
        setIsDeleting(true); // Optional: Show loading state on specific item
        const notificationRef = doc(db, 'notifications', notificationId);
        try {
            // **Important:** Decide if users can *actually* delete notifications.
            // Usually, marking as read is sufficient. Deleting might require
            // specific Firestore rules or cloud functions for security.
            // For now, let's *simulate* deletion by just removing from state
            // and showing a toast. Replace with actual deletion logic if implemented.

            // await deleteDoc(notificationRef); // Uncomment for actual deletion

            setNotifications(prev => prev.filter(n => n.id !== notificationId)); // Simulate removal
            toast({ title: "Notification Removed", description: "The notification has been removed." });

        } catch (error) {
            console.error("Error deleting notification:", error);
            toast({ title: "Error", description: "Could not remove notification.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
       <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">All Notifications</h1>
             {unreadCount > 0 && !loading && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                    <CheckCheck className="mr-2 h-4 w-4" /> Mark All as Read
                </Button>
            )}
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Notification History</CardTitle>
           <CardDescription>All received notifications, sorted by latest first.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                   <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                       <Skeleton className="h-10 w-10 rounded-full" />
                       <div className="flex-1 space-y-2">
                           <Skeleton className="h-4 w-3/4" />
                           <Skeleton className="h-3 w-1/4" />
                       </div>
                        <Skeleton className="h-8 w-8" />
                   </div>
                ))}
             </div>
          ) : notifications.length === 0 ? (
             <div className="text-center text-muted-foreground py-16">
                <BellOff className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold">No Notifications</p>
                <p>You haven't received any notifications yet.</p>
             </div>
          ) : (
             <div className="space-y-4">
                {notifications.map((notification) => {
                   const timeAgo = notification.createdAt ? formatDistanceToNow(notification.createdAt, { addSuffix: true }) : 'just now';
                   const isUnread = !notification.read;

                   const content = (
                        <div className="flex-1 space-y-1 mr-4">
                            <p className={`text-sm font-medium ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>{notification.message}</p>
                            <p className="text-xs text-muted-foreground">{timeAgo}</p>
                        </div>
                    );

                    return (
                        <div
                            key={notification.id}
                            className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${isUnread ? 'bg-muted/30' : 'bg-background'} hover:bg-muted/50`}
                        >
                            {isUnread && <span className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" aria-label="Unread" />}
                             {!isUnread && <span className="mt-1 h-2 w-2 rounded-full bg-transparent flex-shrink-0" aria-hidden="true" />} {/* Alignment placeholder */}

                             {notification.link ? (
                                <Link href={notification.link} className="flex-1 flex items-start" onClick={() => !isUnread || handleMarkAsRead(notification.id)}>
                                     {content}
                                </Link>
                             ) : (
                                <div className="flex-1 flex items-start cursor-pointer" onClick={() => !isUnread || handleMarkAsRead(notification.id)}>
                                     {content}
                                </div>
                             )}

                             {/* Actions */}
                             <div className="flex items-center space-x-1">
                                 {isUnread && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMarkAsRead(notification.id)} aria-label="Mark as read">
                                         <CheckCheck className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                    </Button>
                                 )}
                                  <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                         <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Delete notification" disabled={isDeleting}>
                                             <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                         </Button>
                                     </AlertDialogTrigger>
                                     <AlertDialogContent>
                                         <AlertDialogHeader>
                                             <AlertDialogTitle>Remove Notification?</AlertDialogTitle>
                                             <AlertDialogDescription>
                                                 Are you sure you want to remove this notification? This action cannot be undone.
                                             </AlertDialogDescription>
                                         </AlertDialogHeader>
                                         <AlertDialogFooter>
                                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                                             <AlertDialogAction
                                                 onClick={() => handleDeleteNotification(notification.id)}
                                                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                             >
                                                 Remove
                                             </AlertDialogAction>
                                         </AlertDialogFooter>
                                     </AlertDialogContent>
                                 </AlertDialog>
                            </div>
                        </div>
                    );
                })}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
