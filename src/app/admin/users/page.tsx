"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'; // Import Timestamp
import { db } from '@/lib/firebase/firebase'; // db might be null
import type { UserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, User as UserIcon, ShoppingBag } from 'lucide-react'; // For actions dropdown trigger, added UserIcon, ShoppingBag
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast'; // Import useToast
import Link from 'next/link'; // Import Link

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  // Auth check is handled by layout

  useEffect(() => {
    if (!db) { // Check if db is available
        setLoading(false);
        toast({ title: "Error", description: "Database service is not available.", variant: "destructive" });
        return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('createdAt', 'desc')); // Order by creation date
        const querySnapshot = await getDocs(q);
        const fetchedUsers = querySnapshot.docs.map(doc => {
           const data = doc.data();
            let createdAt: Date;
            if (data.createdAt instanceof Timestamp) {
               createdAt = data.createdAt.toDate();
            } else if (data.createdAt && typeof data.createdAt.seconds === 'number') {
               createdAt = new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds).toDate();
            } else if (data.createdAt instanceof Date) {
                createdAt = data.createdAt;
            } else {
                console.warn(`Invalid date format for user ${doc.id}:`, data.createdAt);
                createdAt = new Date(); // Fallback
            }
          return {
            uid: doc.id, // Use doc.id as uid
            email: data.email,
            displayName: data.displayName || 'N/A',
            createdAt: createdAt,
            isAdmin: data.isAdmin || false,
            // Include notificationPreferences if needed later
            notificationPreferences: data.notificationPreferences || {},
          } as UserProfile;
        });
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({ title: "Error", description: "Could not fetch users.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [toast]); // Added toast to dependency array

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6"><Skeleton className="h-8 w-1/4" /></h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-40" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
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
       return <div className="text-center text-destructive">Database service is unavailable. Cannot load users.</div>;
   }


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>View and manage registered users.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered On</TableHead>
                  <TableHead>Role</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.displayName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" className="h-8 w-8 p-0">
                             <span className="sr-only">Open menu</span>
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           {/* Link to a future dedicated admin view of user profile */}
                           <DropdownMenuItem asChild disabled>
                                {/* <Link href={`/admin/users/${user.uid}`}> // Disabled for now
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    View Profile
                                </Link> */}
                                <button className="w-full text-left flex items-center opacity-50 cursor-not-allowed">
                                     <UserIcon className="mr-2 h-4 w-4" />
                                     View Profile
                                </button>
                           </DropdownMenuItem>
                           {/* Link to admin orders page filtered by this user's ID */}
                           <DropdownMenuItem asChild>
                             <Link href={`/admin/orders?userId=${user.uid}`}>
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                View Orders
                              </Link>
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                            {/* Add role change/delete actions later with confirmation dialogs */}
                           <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled>
                             Delete User
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
           {/* Add pagination if user list becomes long */}
        </CardContent>
      </Card>
    </div>
  );
}
