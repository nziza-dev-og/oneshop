"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { db } from '@/lib/firebase/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, where, doc, deleteDoc } from 'firebase/firestore';
import type { Notification, UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Mail, BellOff, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export default function AdminNotificationsPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [targetUser, setTargetUser] = useState<'all' | 'admin' | string>('all'); // 'all', 'admin', or specific user UID
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]); // To populate user dropdown
    const [notificationType, setNotificationType] = useState<'general' | 'promotion' | 'system_alert'>('general');
    const { toast } = useToast();

    // Fetch all users for the dropdown (only needed if sending to specific users)
    useEffect(() => {
        if (isAdmin) {
            const fetchUsers = async () => {
                try {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, orderBy('email')); // Sort by email
                    const snapshot = await getDocs(usersRef);
                    const usersData = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
                    setAllUsers(usersData);
                } catch (error) {
                    console.error("Error fetching users:", error);
                }
            };
            fetchUsers();
        }
    }, [isAdmin]);

    // Fetch sent notifications (can be refined based on what admins should see)
    useEffect(() => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const notificationsRef = collection(db, 'notifications');
        // Query all notifications sent by anyone (or filter by admin ID if needed)
        const q = query(notificationsRef, orderBy('createdAt', 'desc'));

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
            setNotifications(fetchedNotifications);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            toast({ title: "Error", description: "Could not load notification history.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAdmin, toast]);

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin || !newMessage.trim() || !targetUser) {
            toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
            return;
        }

        setIsSending(true);
        try {
            const notificationData: Omit<Notification, 'id' | 'read' | 'createdAt'> = {
                userId: targetUser, // 'all', 'admin', or specific UID
                message: newMessage.trim(),
                type: notificationType,
                createdAt: serverTimestamp(),
                read: false, // All new notifications start unread
            };

            await addDoc(collection(db, "notifications"), notificationData);

            toast({ title: "Notification Sent!", description: `Message sent to ${targetUser === 'all' ? 'all users' : targetUser === 'admin' ? 'admins' : 'selected user'}.` });
            setNewMessage(''); // Clear form
            setTargetUser('all'); // Reset target
            setNotificationType('general'); // Reset type

        } catch (error) {
            console.error("Error sending notification:", error);
            toast({ title: "Send Failed", description: "Could not send the notification.", variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteNotification = async (notificationId: string) => {
        if (!isAdmin) return;
        // Consider adding a loading state per item if needed
        const notificationRef = doc(db, 'notifications', notificationId);
        try {
            await deleteDoc(notificationRef);
            toast({ title: "Notification Deleted", description: "The notification has been removed from the system." });
            // Listener will update the list
        } catch (error) {
            console.error("Error deleting notification:", error);
            toast({ title: "Delete Failed", description: "Could not delete the notification.", variant: "destructive" });
        }
    };

    if (authLoading) {
         return <Skeleton className="h-64 w-full" />; // Or a more detailed layout skeleton
    }

    if (!isAdmin && !authLoading) {
        return <div className="text-center text-muted-foreground">Access Denied.</div>;
    }


    return (
        <div className="space-y-8">
             <h1 className="text-2xl font-bold">Manage Notifications</h1>

            {/* Send Notification Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Send New Notification</CardTitle>
                    <CardDescription>Send alerts, promotions, or general messages to users.</CardDescription>
                </CardHeader>
                 <form onSubmit={handleSendNotification}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Enter your notification message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                required
                                disabled={isSending}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="targetUser">Target Audience</Label>
                                <Select
                                    value={targetUser}
                                    onValueChange={(value) => setTargetUser(value)}
                                    disabled={isSending}
                                >
                                    <SelectTrigger id="targetUser">
                                        <SelectValue placeholder="Select target..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Users</SelectItem>
                                        <SelectItem value="admin">Admins Only</SelectItem>
                                         {allUsers.map(u => (
                                            <SelectItem key={u.uid} value={u.uid}>{u.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="notificationType">Notification Type</Label>
                                <Select
                                    value={notificationType}
                                    onValueChange={(value: 'general' | 'promotion' | 'system_alert') => setNotificationType(value)}
                                    disabled={isSending}
                                >
                                    <SelectTrigger id="notificationType">
                                        <SelectValue placeholder="Select type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="promotion">Promotion</SelectItem>
                                        <SelectItem value="system_alert">System Alert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSending}>
                             {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {isSending ? 'Sending...' : 'Send Notification'}
                        </Button>
                    </CardFooter>
                 </form>
            </Card>

            {/* Notification History */}
             <Card>
                <CardHeader>
                    <CardTitle>Sent Notification History</CardTitle>
                    <CardDescription>List of all notifications sent.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                             <Mail className="mx-auto h-10 w-10 mb-2"/>
                            No notifications have been sent yet.
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                                {notifications.map((notification) => {
                                    const timeAgo = notification.createdAt ? formatDistanceToNow(notification.createdAt, { addSuffix: true }) : 'just now';
                                    let targetDisplay: string;
                                    if (notification.userId === 'all') {
                                        targetDisplay = 'All Users';
                                    } else if (notification.userId === 'admin') {
                                        targetDisplay = 'Admins Only';
                                    } else {
                                        const targetUserData = allUsers.find(u => u.uid === notification.userId);
                                        targetDisplay = targetUserData?.email ?? `User (${notification.userId.substring(0,6)}...)`;
                                    }

                                     return (
                                        <div key={notification.id} className="flex items-start space-x-3 p-3 border rounded-md bg-muted/20">
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium">{notification.message}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                     <span>To: {targetDisplay}</span>
                                                     <span>•</span>
                                                     <span>Type: {notification.type}</span>
                                                      <span>•</span>
                                                     <span>{timeAgo}</span>
                                                </div>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" aria-label="Delete notification">
                                                        <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to permanently delete this notification for everyone? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteNotification(notification.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Delete Permanently
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Helper function to fetch user details - might be needed if displaying user names
async function getDocs(queryRef: any) {
    const snapshot = await getDocs(queryRef); // Replace with actual getDocs import if needed
    return snapshot;
}


