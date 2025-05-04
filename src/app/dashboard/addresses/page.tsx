"use client";

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Edit, Trash2, Home, Loader2 } from "lucide-react";
import { useAuth } from '@/providers/auth-provider';
import { db } from '@/lib/firebase/firebase'; // db might be null
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Address } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Zod schema for address validation
const addressSchema = z.object({
  street: z.string().min(5, "Street address is required."),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State/Province is required."),
  zipCode: z.string().min(5, "ZIP/Postal code is required."),
  country: z.string().min(2, "Country is required.").default("USA"), // Default country if needed
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function AddressesPage() {
    const { user, loading: authLoading } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const form = useForm<AddressFormData>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            street: '', city: '', state: '', zipCode: '', country: 'USA'
        },
    });

    // Fetch addresses on mount or when user changes
    useEffect(() => {
        if (!authLoading && user && db) {
            const fetchAddresses = async () => {
                setLoading(true);
                try {
                    const addressesRef = collection(db, 'users', user.uid, 'addresses');
                    const q = query(addressesRef); // Add orderBy if needed
                    const querySnapshot = await getDocs(q);
                    const fetchedAddresses = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    } as Address));
                    setAddresses(fetchedAddresses);
                } catch (error) {
                    console.error("Error fetching addresses:", error);
                    toast({ title: "Error", description: "Could not fetch addresses.", variant: "destructive" });
                } finally {
                    setLoading(false);
                }
            };
            fetchAddresses();
        } else if (!authLoading && !user) {
            setAddresses([]); // Clear addresses if user logs out
            setLoading(false);
        } else if (!db) {
            setLoading(false);
            toast({ title: "Error", description: "Database service is unavailable.", variant: "destructive" });
        }
    }, [user, authLoading, toast]);

    // Reset form when dialog opens or editingAddress changes
    useEffect(() => {
        if (isDialogOpen) {
            if (editingAddress) {
                form.reset({
                    street: editingAddress.street,
                    city: editingAddress.city,
                    state: editingAddress.state,
                    zipCode: editingAddress.zipCode,
                    country: editingAddress.country,
                });
            } else {
                form.reset({ street: '', city: '', state: '', zipCode: '', country: 'USA' });
            }
        }
    }, [editingAddress, isDialogOpen, form]);


    const handleSaveAddress: SubmitHandler<AddressFormData> = async (data) => {
        if (!user || !db) {
            toast({ title: "Error", description: "User not logged in or database unavailable.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const addressData = { ...data, userId: user.uid };
            if (editingAddress) {
                // Update existing address
                const addressRef = doc(db, 'users', user.uid, 'addresses', editingAddress.id);
                await updateDoc(addressRef, addressData);
                setAddresses(prev => prev.map(addr => addr.id === editingAddress.id ? { ...addr, ...addressData } : addr));
                toast({ title: "Address Updated", description: "Your address has been successfully updated." });
            } else {
                // Add new address
                const addressesRef = collection(db, 'users', user.uid, 'addresses');
                const docRef = await addDoc(addressesRef, addressData);
                setAddresses(prev => [...prev, { id: docRef.id, ...addressData }]);
                toast({ title: "Address Added", description: "Your new address has been saved." });
            }
            setIsDialogOpen(false); // Close dialog on success
            setEditingAddress(null); // Reset editing state
        } catch (error) {
            console.error("Error saving address:", error);
            toast({ title: "Save Failed", description: "Could not save the address.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAddress = async (addressId: string) => {
        if (!user || !db) return;
        setIsDeletingId(addressId);
        try {
            const addressRef = doc(db, 'users', user.uid, 'addresses', addressId);
            await deleteDoc(addressRef);
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
            toast({ title: "Address Deleted", description: "The address has been removed." });
        } catch (error) {
            console.error("Error deleting address:", error);
            toast({ title: "Delete Failed", description: "Could not remove the address.", variant: "destructive" });
        } finally {
            setIsDeletingId(null);
        }
    };

     const openEditDialog = (address: Address) => {
        setEditingAddress(address);
        setIsDialogOpen(true);
    };

    const openAddDialog = () => {
        setEditingAddress(null); // Ensure we are adding, not editing
        setIsDialogOpen(true);
    };


    if (loading || authLoading) {
        return (
             <div>
                <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-10 w-40" />
                </div>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                     <CardContent className="space-y-4">
                         {[...Array(2)].map((_, i) => (
                            <div key={i} className="border rounded-lg p-4 flex justify-between items-start">
                                <div className="space-y-1">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </div>
                         ))}
                         <Skeleton className="h-40 w-full flex items-center justify-center">
                            <Skeleton className="h-5 w-40" />
                         </Skeleton>
                     </CardContent>
                 </Card>
             </div>
        );
    }

     if (!user && !authLoading) {
         return <div className="text-center text-muted-foreground">Please log in to manage addresses.</div>;
     }

     if (!db) {
         return <div className="text-center text-destructive">Database service is unavailable.</div>;
     }


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Address Book</h1>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                 <Button onClick={openAddDialog}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
                 </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                    <DialogDescription>
                        {editingAddress ? 'Update your address details below.' : 'Enter your new address details below.'}
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSaveAddress)} className="space-y-4 py-4">
                         <FormField
                            control={form.control}
                            name="street"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Street Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="123 Main St" {...field} disabled={isSaving} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                         />
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>City</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Anytown" {...field} disabled={isSaving} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                             />
                             <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>State/Province</FormLabel>
                                    <FormControl>
                                        <Input placeholder="CA" {...field} disabled={isSaving} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="zipCode"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>ZIP Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="90210" {...field} disabled={isSaving} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                              />
                         </div>
                          <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                    {/* Could replace with a Select component for predefined countries */}
                                    <Input placeholder="United States" {...field} disabled={isSaving} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                          />
                         <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isSaving ? 'Saving...' : 'Save Address'}
                            </Button>
                         </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
         </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Addresses</CardTitle>
          <CardDescription>Manage your shipping and billing addresses.</CardDescription>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
               <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
              <p>You have no saved addresses yet.</p>
              <Button variant="link" className="mt-2" onClick={openAddDialog}>
                 Add your first address
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
                {addresses.map(address => (
                    <div key={address.id} className="border rounded-lg p-4 flex justify-between items-start shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-sm">
                            <p className="font-medium">{address.street}</p>
                            <p>{address.city}, {address.state} {address.zipCode}</p>
                            <p>{address.country}</p>
                            {/* Optional: Display default/type badges */}
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(address)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                        disabled={isDeletingId === address.id}
                                    >
                                        {isDeletingId === address.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete this address? This action cannot be undone.
                                            <p className="mt-2 font-medium">{address.street}, {address.city}, {address.state}</p>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isDeletingId === address.id}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDeleteAddress(address.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            disabled={isDeletingId === address.id}
                                        >
                                            {isDeletingId === address.id ? 'Deleting...' : 'Delete'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
