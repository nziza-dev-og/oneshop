
"use client";

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase'; // auth might be null
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

export default function AccountSettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reauthRequired, setReauthRequired] = useState(false);
    const [reauthPassword, setReauthPassword] = useState('');
    const [pendingPasswordData, setPendingPasswordData] = useState<PasswordFormData | null>(null);
    const { toast } = useToast();

    const form = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const handleChangePassword: SubmitHandler<PasswordFormData> = async (data) => {
        if (!user || !auth || !auth.currentUser) {
            toast({ title: "Error", description: "User not found or auth service unavailable.", variant: "destructive" });
            return;
        }

        setLoading(true);
        setPendingPasswordData(data); // Store data in case re-auth is needed

        try {
            // Re-authenticate the user first
            const credential = EmailAuthProvider.credential(user.email!, data.currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // If re-authentication is successful, update the password
            await updatePassword(auth.currentUser, data.newPassword);

            toast({ title: "Password Updated", description: "Your password has been successfully changed." });
            form.reset(); // Clear the form
            setPendingPasswordData(null); // Clear pending data

        } catch (error: any) {
            console.error("Password Change Error:", error);
            if (error.code === 'auth/requires-recent-login') {
                // This error is less common now with reauthenticate first, but handle just in case
                toast({ title: "Action Required", description: "Please log in again to change your password.", variant: "destructive" });
                setReauthRequired(true); // Trigger re-auth dialog (though handled above)
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                 form.setError("currentPassword", { type: "manual", message: "Incorrect current password." });
                 toast({ title: "Password Change Failed", description: "Incorrect current password.", variant: "destructive" });
            }
            else {
                toast({ title: "Password Change Failed", description: "Could not update your password. Please try again.", variant: "destructive" });
            }
        } finally {
            setLoading(false);
            setReauthPassword(''); // Clear reauth password input
        }
    };

    // Simplified handleReauthenticate - re-authentication is now part of the main flow
    // If needed, this could be a separate dialog triggered by specific errors.


    if (authLoading) {
         // You might want a skeleton loader here if preferred
        return <div>Loading account settings...</div>;
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

      {/* Re-authentication Dialog - Kept for potential future use or different error handling */}
       {/* <AlertDialog open={reauthRequired} onOpenChange={setReauthRequired}>
           <AlertDialogContent>
               <AlertDialogHeader>
                   <AlertDialogTitle>Re-authentication Required</AlertDialogTitle>
                   <AlertDialogDescription>
                       For your security, please enter your current password again to confirm this change.
                   </AlertDialogDescription>
               </AlertDialogHeader>
               <div className="space-y-2">
                   <Label htmlFor="reauth-password">Current Password</Label>
                   <Input
                       id="reauth-password"
                       type="password"
                       value={reauthPassword}
                       onChange={(e) => setReauthPassword(e.target.value)}
                   />
               </div>
               <AlertDialogFooter>
                   <AlertDialogCancel onClick={() => { setPendingPasswordData(null); setReauthPassword(''); }}>Cancel</AlertDialogCancel>
                   <AlertDialogAction onClick={handleReauthenticate} disabled={!reauthPassword || loading}>
                       {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                       Confirm & Change Password
                   </AlertDialogAction>
               </AlertDialogFooter>
           </AlertDialogContent>
       </AlertDialog> */}


      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your email notification preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Notification settings - Implement later */}
          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <Label htmlFor="newsletter-switch" className="flex flex-col space-y-1">
                <span>Marketing Emails</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receive updates about new products and promotions.
                </span>
            </Label>
             <Switch id="newsletter-switch" disabled />
          </div>
           <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg">
            <Label htmlFor="order-updates-switch" className="flex flex-col space-y-1">
                <span>Order Updates</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Get notified about the status of your orders.
                </span>
            </Label>
             <Switch id="order-updates-switch" disabled defaultChecked/>
          </div>
        </CardContent>
      </Card>

      {/* Add more settings sections like Payment Methods, etc. */}

    </div>
  );
}
