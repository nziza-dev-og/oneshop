
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
import { Bell, CheckCheck, Mail, Megaphone, AlertTriangle, Info, Package, Sparkles } from 'lucide-react'; // Added more icons
import { useAuth } from '@/providers/auth-provider';
import { db } from '@/lib/firebase/firebase'; // db might be null
import { collection, query, where, orderBy, onSnapshot, limit, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore'; // Added Timestamp
import type { Notification } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils'; // Import cn utility

export function NotificationDropdown() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Only proceed if db and user are available
    if (!db || !user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return; // No user or db not ready, no notifications
    }

    setLoading(true);
    const notificationsRef = collection(db, 'notifications');
    // Query for user-specific notifications OR general notifications ('all')
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
         if (data.createdAt instanceof Timestamp) { // Check if it's already a Timestamp
            createdAt = data.createdAt.toDate();
         } else if (data.createdAt && typeof data.createdAt.seconds === 'number') { // Check for plain object structure
            createdAt = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate();
         } else if (data.createdAt instanceof Date){
             createdAt = data.createdAt; // Already a Date object
         } else {
             console.warn("Notification date format unexpected or missing:", data.createdAt);
             createdAt = new Date(); // Fallback
         }

        return {
          id: doc.id,
          ...data,
          createdAt: createdAt,
        } as Notification;
      });

       // Filter notifications that are either for 'all' or the specific user.
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
    if (!user || !db) {
        toast({ title: "Error", description: "Service not available.", variant: "destructive" });
        return;
    }
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
    if (!user || !db || unreadCount === 0) return;

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

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'promotion': return <Megaphone className="h-4 w-4 text-accent flex-shrink-0" />;
      case 'system_alert': return <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />;
      case 'order_update': return <Package className="h-4 w-4 text-blue-500 flex-shrink-0" />;
      case 'new_product': return <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />;
      case 'general':
      default: return <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
    }
  };

  const renderNotificationItem = (notification: Notification) => {
    const timeAgo = notification.createdAt ? formatDistanceToNow(notification.createdAt, { addSuffix: true }) : 'just now';
    const isAdminMessage = notification.userId === 'all'; // Check if it's an admin broadcast

    const content = (
        <div className="flex items-start space-x-3">
             {getNotificationIcon(notification.type)} {/* Add icon based on type */}
            <div className="flex-1 space-y-1">
                <p className={cn(
                    "text-sm",
                    !notification.read ? 'font-semibold text-foreground' : 'text-muted-foreground',
                    isAdminMessage && 'italic text-primary/80' // Style admin messages
                    )}>
                    {notification.message}
                 </p>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
            {!notification.read && <span className="ml-auto mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" aria-label="Unread" />}
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

    const itemClasses = cn(
        "cursor-pointer",
        !notification.read ? '' : '', // Base styling for read/unread can go here if needed
        isAdminMessage ? 'bg-primary/5 hover:bg-primary/10' : '' // Specific background for admin messages
    );


    if (notification.link) {
        return (
            <Link href={notification.link} passHref legacyBehavior key={notification.id}>
                <DropdownMenuItem
                  className={itemClasses}
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
            key={notification.id}
            className={itemClasses}
            onClick={handleItemClick} // Handle read status
            >
            {content}
        </DropdownMenuItem>
    );
  };


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" disabled={!db}> {/* Disable if db not ready */}
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
            <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs" onClick={handleMarkAllAsRead} disabled={!db}>
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
          ) : !db ? ( // Check if db is available
              <div className="text-center text-muted-foreground p-6">
                  Notification service unavailable.
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
