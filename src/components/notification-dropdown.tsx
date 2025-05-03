"use client";

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Mail } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, orderBy, onSnapshot, limit, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Notification } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationDropdown() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return; // No user, no notifications
    }

    setLoading(true);
    const notificationsRef = collection(db, 'notifications');
    // Query for user-specific notifications OR general notifications ('all')
    // We might need a more complex query if admins also get specific notifications
    const q = query(
      notificationsRef,
      where('userId', 'in', [user.uid, 'all']), // Listen for user-specific and general notifications
      orderBy('createdAt', 'desc'),
      limit(20) // Limit initial fetch for performance
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => {
         const data = doc.data();
         let createdAt: Date;
          // Correctly handle Firestore Timestamps
         if (data.createdAt && typeof data.createdAt.seconds === 'number') {
            createdAt = data.createdAt.toDate();
         } else if (data.createdAt instanceof Date){
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

       // Filter notifications that are either for 'all' or the specific user.
       // This secondary filter might be redundant if the Firestore query is precise,
       // but ensures correctness if 'all' notifications are mixed with others potentially.
       const relevantNotifications = fetchedNotifications.filter(
            n => n.userId === 'all' || n.userId === user.uid
        );

      setNotifications(relevantNotifications);
      const currentUnreadCount = relevantNotifications.filter(n => !n.read).length;
      setUnreadCount(currentUnreadCount);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      toast({ title: "Error", description: "Could not fetch notifications.", variant: "destructive" });
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user, toast]); // Re-run effect when user changes

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    const notificationRef = doc(db, 'notifications', notificationId);
    try {
      await updateDoc(notificationRef, { read: true });
      // Optimistic update or rely on snapshot listener
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({ title: "Error", description: "Could not update notification status.", variant: "destructive" });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    const batch = writeBatch(db);
    const unreadNotifications = notifications.filter(n => !n.read);

    unreadNotifications.forEach(notification => {
      const notificationRef = doc(db, 'notifications', notification.id);
      batch.update(notificationRef, { read: true });
    });

    try {
      await batch.commit();
      toast({ title: "Success", description: "All notifications marked as read." });
      // State will update via the snapshot listener
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({ title: "Error", description: "Could not mark all notifications as read.", variant: "destructive" });
    }
  };

  const renderNotificationItem = (notification: Notification) => {
    const timeAgo = notification.createdAt ? formatDistanceToNow(notification.createdAt, { addSuffix: true }) : 'just now';

    const content = (
        <div className="flex items-start space-x-3">
             {!notification.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />}
              {notification.read && <span className="mt-1 h-2 w-2 rounded-full bg-transparent flex-shrink-0" aria-hidden="true" />} {/* Placeholder for alignment */}
            <div className="flex-1 space-y-1">
                <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>{notification.message}</p>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
        </div>
    );

     // Mark as read when clicking the item directly
     const handleItemClick = (e: React.MouseEvent) => {
         if (!notification.read) {
            handleMarkAsRead(notification.id);
         }
         // If there's a link, let the Link component handle navigation
         // If no link, prevent default dropdown closing if desired, but usually okay to close.
     };

    if (notification.link) {
        return (
            <Link href={notification.link} passHref legacyBehavior>
                <DropdownMenuItem
                  className={`cursor-pointer ${!notification.read ? 'font-semibold' : ''}`}
                  onSelect={(e) => e.preventDefault()} // Prevent auto-closing for Link
                  onClick={handleItemClick} // Handle read status and navigation
                  >
                   {content}
                </DropdownMenuItem>
            </Link>
        );
    }

    return (
        <DropdownMenuItem
            className={`cursor-pointer ${!notification.read ? 'font-semibold' : ''}`}
            onClick={handleItemClick} // Handle read status
            >
            {content}
        </DropdownMenuItem>
    );
  };


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && !loading && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
           {loading && <Skeleton className="absolute -top-2 -right-2 h-5 w-5 rounded-full" />}
          <span className="sr-only">Open Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && !loading && (
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px] pr-2"> {/* Added padding-right */}
          {loading ? (
             <div className="p-2 space-y-3">
                 {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
             </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-muted-foreground p-6">
                <Mail className="mx-auto h-8 w-8 mb-2"/>
              No notifications yet.
            </div>
          ) : (
            notifications.map(renderNotificationItem)
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center text-sm text-primary cursor-pointer">
          <Link href="/dashboard/notifications">View All Notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
