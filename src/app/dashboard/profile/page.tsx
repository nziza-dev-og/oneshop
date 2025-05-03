"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Renamed function to avoid conflict if importing from old path
export default function DashboardProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(''); // Email display only, not editable here
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter(); // Keep router if needed for other actions, remove if unused
  const { toast } = useToast();

  useEffect(() => {
    // Authentication check is now handled by the dashboard layout
    if (user) {
      // Fetch user data from Firestore to get potentially updated display name
      const fetchUserData = async () => {
        setFetching(true); // Start fetching state
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setDisplayName(userData.displayName || user.displayName || '');
            setEmail(userData.email || user.email || '');
          } else {
             // Fallback to Auth profile data if Firestore doc doesn't exist
             setDisplayName(user.displayName || '');
             setEmail(user.email || '');
             // Consider creating the Firestore doc here if it's missing
             console.warn(`Firestore document missing for user ${user.uid}`);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
           // Fallback in case of error
           setDisplayName(user.displayName || '');
           setEmail(user.email || '');
           toast({ title: "Error", description: "Could not fetch profile details.", variant: "destructive"});
        } finally {
          setFetching(false); // End fetching state
        }
      };
      fetchUserData();
    } else if (!authLoading && !user) {
       // Redirect logic remains in layout, this is a fallback
       router.push('/login');
    }
  }, [user, authLoading, toast, router]); // Removed router from dependencies if not used for redirection


  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !auth.currentUser) { // Added check for auth.currentUser
        toast({ title: "Error", description: "User not found.", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName: displayName || null });

      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName || email, // Use display name or fallback to email
      });

      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      // Manually update user state in AuthProvider or trigger a refresh if necessary
      // This might involve refetching user data or updating the context state directly

    } catch (error) {
      console.error("Profile Update Error:", error);
      toast({ title: "Update Failed", description: "Could not update your profile. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Loading state handled by dashboard layout, but keep skeleton for fetching data
  if (fetching) {
    return (
       <Card>
          <CardHeader>
             <Skeleton className="h-8 w-1/3 mb-2" />
             <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
               <Skeleton className="h-4 w-16"/>
               <Skeleton className="h-10 w-full" />
             </div>
              <div className="space-y-2">
               <Skeleton className="h-4 w-16"/>
               <Skeleton className="h-10 w-full" />
             </div>
             <Skeleton className="h-10 w-24" />
          </CardContent>
       </Card>
    );
  }

   // User check also handled by layout, but kept as a safeguard
   if (!user) {
     return <div>Loading user data or redirecting...</div>;
   }

  return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">My Profile</CardTitle>
          <CardDescription>View and update your account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled // Email is not typically updated here
                className="bg-muted cursor-not-allowed"
              />
               <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
  );
}
