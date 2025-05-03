"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trash2, MailCheck, Archive, Loader2, Inbox } from 'lucide-react';
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

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  status: 'new' | 'read' | 'archived';
}

export default function AdminMessagesPage() {
    const { isAdmin, loading: authLoading } = useAuth();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null); // Track loading state for actions
    const { toast } = useToast();

    useEffect(() => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const messagesRef = collection(db, 'contactMessages');
        // Query messages, order by status (new first) then date
        const q = query(
            messagesRef,
            orderBy('status', 'asc'), // 'archived', 'new', 'read'
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => {
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
                  name: data.name,
                  email: data.email,
                  subject: data.subject,
                  message: data.message,
                  createdAt: createdAt,
                  status: data.status || 'new',
                } as ContactMessage;
            });
            setMessages(fetchedMessages);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            toast({ title: "Error", description: "Could not load contact messages.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAdmin, toast]);

    const handleUpdateStatus = async (messageId: string, newStatus: ContactMessage['status']) => {
        if (!isAdmin) return;
        setActionLoadingId(messageId);
        const messageRef = doc(db, 'contactMessages', messageId);
        try {
            await updateDoc(messageRef, { status: newStatus });
            toast({ title: "Status Updated", description: `Message marked as ${newStatus}.` });
            // Listener will update the list
        } catch (error) {
            console.error("Error updating message status:", error);
            toast({ title: "Update Failed", description: "Could not update message status.", variant: "destructive" });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!isAdmin) return;
        setActionLoadingId(messageId);
        const messageRef = doc(db, 'contactMessages', messageId);
        try {
            await deleteDoc(messageRef);
            toast({ title: "Message Deleted", description: "The message has been permanently removed." });
            // Listener will update the list
        } catch (error) {
            console.error("Error deleting message:", error);
            toast({ title: "Delete Failed", description: "Could not delete the message.", variant: "destructive" });
        } finally {
            setActionLoadingId(null);
        }
    };

     if (authLoading) {
         return <Skeleton className="h-64 w-full" />;
    }

    if (!isAdmin && !authLoading) {
        return <div className="text-center text-muted-foreground">Access Denied.</div>;
    }

    return (
        <div className="space-y-8">
             <h1 className="text-2xl font-bold">Contact Messages</h1>

             <Card>
                <CardHeader>
                    <CardTitle>Inbox</CardTitle>
                    <CardDescription>Messages received from the contact form.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                        </div>
                    ) : messages.length === 0 ? (
                         <div className="text-center text-muted-foreground py-16">
                             <Inbox className="mx-auto h-12 w-12 mb-4"/>
                             <p className="text-lg font-semibold">Inbox Zero!</p>
                             <p>No contact messages received yet.</p>
                         </div>
                    ) : (
                         <ScrollArea className="h-[60vh] pr-4">
                            <div className="space-y-4">
                                {messages.map((msg) => {
                                     const timeAgo = msg.createdAt ? formatDistanceToNow(msg.createdAt, { addSuffix: true }) : 'just now';
                                     const isLoadingAction = actionLoadingId === msg.id;

                                     return (
                                         <div key={msg.id} className={`p-4 border rounded-lg shadow-sm ${msg.status === 'new' ? 'bg-primary/5 border-primary/20' : 'bg-muted/20'}`}>
                                             <div className="flex justify-between items-start mb-2">
                                                 <div>
                                                     <p className="font-semibold text-foreground">{msg.subject}</p>
                                                     <p className="text-sm text-muted-foreground">
                                                         From: {msg.name} (<a href={`mailto:${msg.email}`} className="text-primary hover:underline">{msg.email}</a>)
                                                     </p>
                                                      <p className="text-xs text-muted-foreground">{timeAgo}</p>
                                                 </div>
                                                 <Badge variant={msg.status === 'new' ? 'default' : msg.status === 'read' ? 'secondary' : 'outline'} className="capitalize">
                                                     {msg.status}
                                                 </Badge>
                                             </div>
                                             <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">{msg.message}</p>
                                             <div className="flex items-center justify-end gap-2">
                                                  {msg.status === 'new' && (
                                                     <Button
                                                        variant="outline" size="sm"
                                                        onClick={() => handleUpdateStatus(msg.id, 'read')}
                                                        disabled={isLoadingAction}
                                                        className="hover:bg-accent"
                                                     >
                                                        {isLoadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailCheck className="mr-2 h-4 w-4" />} Mark as Read
                                                     </Button>
                                                 )}
                                                 {msg.status !== 'archived' && (
                                                     <Button
                                                        variant="outline" size="sm"
                                                        onClick={() => handleUpdateStatus(msg.id, 'archived')}
                                                        disabled={isLoadingAction}
                                                        className="text-muted-foreground hover:bg-muted"
                                                     >
                                                         {isLoadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Archive className="mr-2 h-4 w-4" />} Archive
                                                     </Button>
                                                 )}
                                                 {msg.status === 'archived' && (
                                                     <Button
                                                        variant="outline" size="sm"
                                                        onClick={() => handleUpdateStatus(msg.id, 'read')} // Move back to read
                                                        disabled={isLoadingAction}
                                                        className="text-muted-foreground hover:bg-muted"
                                                     >
                                                         {isLoadingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Inbox className="mr-2 h-4 w-4" />} Unarchive
                                                     </Button>
                                                 )}
                                                 <AlertDialog>
                                                     <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" disabled={isLoadingAction}>
                                                            {isLoadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                         </Button>
                                                     </AlertDialogTrigger>
                                                     <AlertDialogContent>
                                                         <AlertDialogHeader>
                                                             <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                                             <AlertDialogDescription>
                                                                 Are you sure you want to permanently delete this message from "{msg.name}"? This action cannot be undone.
                                                             </AlertDialogDescription>
                                                         </AlertDialogHeader>
                                                         <AlertDialogFooter>
                                                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                             <AlertDialogAction
                                                                 onClick={() => handleDeleteMessage(msg.id)}
                                                                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                             >
                                                                 Delete Permanently
                                                             </AlertDialogAction>
                                                         </AlertDialogFooter>
                                                     </AlertDialogContent>
                                                 </AlertDialog>
                                             </div>
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
