
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/firebase'; // auth and db might be null
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Import Firestore functions
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import type { UserProfile } from '@/types';

// Zod schema for password change
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters long."),
  confirmPassword: z.string().min(1, "Please confirm your new password.")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"], // Set the error on the confirmPassword field
});

type PasswordFormData = z.infer<typeof passwordSchema>;

// Default preferences
const defaultPreferences = {
    marketing: false,
    orderUpdates: true, // Default order updates to true
    newProducts: false,
};

export default function AccountSettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [prefsLoading, setPrefsLoading] = useState(true); // Separate loading state for preferences
    const [preferences, setPreferences] = useState(defaultPreferences);
    const { toast } = useToast();

    const form = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

     // Fetch preferences on mount
    useEffect(() => {
        if (user && db) {
            setPrefsLoading(true);
            const userDocRef = doc(db, 'users', user.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data() as UserProfile;
                    // Merge saved preferences with defaults
                    setPreferences({ ...defaultPreferences, ...data.notificationPreferences });
                } else {
                     setPreferences(defaultPreferences); // Use defaults if no profile found
                }
            }).catch(error => {
                console.error("Error fetching preferences:", error);
                toast({ title: "Error", description: "Could not load notification preferences.", variant: "destructive" });
                 setPreferences(defaultPreferences); // Use defaults on error
            }).finally(() => {
                setPrefsLoading(false);
            });
        } else {
            setPrefsLoading(false); // No user or db, stop loading
        }
    }, [user, toast]);

    const handlePreferenceChange = (prefKey: keyof typeof preferences, checked: boolean) => {
        setPreferences(prev => ({ ...prev, [prefKey]: checked }));
        // Immediately save the change
        handleSavePreferences({ ...preferences, [prefKey]: checked });
    };

    const handleSavePreferences = async (newPreferences: typeof preferences) => {
        if (!user || !db) {
            toast({ title: "Error", description: "User not logged in or database unavailable.", variant: "destructive" });
            return;
        }
        setPrefsLoading(true); // Indicate saving
        const userDocRef = doc(db, 'users', user.uid);
        try {
            await updateDoc(userDocRef, {
                notificationPreferences: newPreferences
            }, { merge: true }); // Use merge to avoid overwriting other user data
            // toast({ title: "Preferences Updated", description: "Your notification settings have been saved." });
            // No toast here for instant feedback, state update handles UI change
        } catch (error) {
            console.error("Error saving preferences:", error);
            toast({ title: "Save Failed", description: "Could not save notification preferences.", variant: "destructive" });
            // Revert state if save fails? (Consider this UX)
        } finally {
             setPrefsLoading(false);
        }
    };


    const handleChangePassword: SubmitHandler<PasswordFormData> = async (data) => {
        if (!user || !auth || !auth.currentUser) {
            toast({ title: "Error", description: "User not found or auth service unavailable.", variant: "destructive" });
            return;
        }

        setLoading(true);

        try {
            // Re-authenticate the user first
            const credential = EmailAuthProvider.credential(user.email!, data.currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // If re-authentication is successful, update the password
            await updatePassword(auth.currentUser, data.newPassword);

            toast({ title: "Password Updated", description: "Your password has been successfully changed." });
            form.reset(); // Clear the form

        } catch (error: any) {
            console.error("Password Change Error:", error);
            if (error.code === 'auth/requires-recent-login') {
                toast({ title: "Action Required", description: "Please log in again to change your password.", variant: "destructive" });
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                 form.setError("currentPassword", { type: "manual", message: "Incorrect current password." });
                 toast({ title: "Password Change Failed", description: "Incorrect current password.", variant: "destructive" });
            }
            else {
                toast({ title: "Password Change Failed", description: "Could not update your password. Please try again.", variant: "destructive" });
            }
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        // Skeleton for the whole page might be better handled in layout
        return (
             <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-80 w-full" />
             </div>
        );
    }

    if (!user && !authLoading) {
        return <div>Please log in to access account settings.</div>;
    }


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...form}>
                <form onSubmit={form.handleSubmit(handleChangePassword)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} disabled={loading || !auth} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} disabled={loading || !auth} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                     />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} disabled={loading || !auth} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={loading || !auth}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                </form>
           </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your email and app notification preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {prefsLoading ? (
                 <div className="space-y-4">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                 </div>
            ) : (
              <>
                <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                    <Label htmlFor="marketing-switch" className="flex flex-col space-y-1">
                        <span>Marketing Emails</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                        Receive updates about new products and promotions.
                        </span>
                    </Label>
                    <Switch
                        id="marketing-switch"
                        checked={preferences.marketing}
                        onCheckedChange={(checked) => handlePreferenceChange('marketing', checked)}
                        disabled={!db} // Disable if db unavailable
                    />
                </div>
                <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                    <Label htmlFor="order-updates-switch" className="flex flex-col space-y-1">
                        <span>Order Updates</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                        Get notified about the status of your orders.
                        </span>
                    </Label>
                    <Switch
                        id="order-updates-switch"
                        checked={preferences.orderUpdates}
                        onCheckedChange={(checked) => handlePreferenceChange('orderUpdates', checked)}
                        disabled={!db} // Disable if db unavailable
                    />
                </div>
                <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
                    <Label htmlFor="new-products-switch" className="flex flex-col space-y-1">
                        <span>New Product Alerts</span>
                        <span className="font-normal leading-snug text-muted-foreground">
                          Be the first to know when new items are added.
                        </span>
                    </Label>
                    <Switch
                        id="new-products-switch"
                        checked={preferences.newProducts}
                        onCheckedChange={(checked) => handlePreferenceChange('newProducts', checked)}
                        disabled={!db} // Disable if db unavailable
                    />
                </div>
                {!db && <p className="text-sm text-destructive text-center">Notification settings unavailable.</p>}
              </>
            )}
        </CardContent>
      </Card>

      {/* Add more settings sections like Payment Methods, etc. */}

    </div>
  );
}
