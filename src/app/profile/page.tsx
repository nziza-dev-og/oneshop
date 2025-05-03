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

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(''); // Email display only, not editable here
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login'); // Redirect if not logged in
    } else if (user) {
      // Fetch user data from Firestore to get potentially updated display name
      const fetchUserData = async () => {
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
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
           // Fallback in case of error
           setDisplayName(user.displayName || '');
           setEmail(user.email || '');
           toast({ title: "Error", description: "Could not fetch profile details.", variant: "destructive"});
        } finally {
          setFetching(false);
        }
      };
      fetchUserData();
    }
  }, [user, authLoading, router, toast]);


  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser!, { displayName: displayName || null });

      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName || email, // Use display name or fallback to email
      });

      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    } catch (error) {
      console.error("Profile Update Error:", error);
      toast({ title: "Update Failed", description: "Could not update your profile. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetching) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
             <Skeleton className="h-8 w-1/4 mb-2" />
             <Skeleton className="h-4 w-1/2" />
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
      </div>
    );
  }

   if (!user) {
     // Should be redirected, but show message just in case
     return <div className="container mx-auto text-center py-12">Please log in to view your profile.</div>;
   }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
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
    </div>
  );
}
