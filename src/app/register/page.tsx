"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebase'; // auth and db might be null
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const ADMIN_SECRET_CODE = "juleschat"; // Define the secret code for admin registration

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretCode, setSecretCode] = useState(''); // State for secret code input
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!auth || !db) {
      setError("Registration service is not available. Please try again later.");
      toast({ title: "Registration Failed", description: "Registration service unavailable.", variant: "destructive" });
      return;
    }


    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast({ title: "Registration Failed", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      toast({ title: "Registration Failed", description: "Password should be at least 6 characters long.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Determine if the user should be an admin
      const isAdminUser = secretCode === ADMIN_SECRET_CODE;

      // Update user profile (optional, Firebase Auth has email/password)
      await updateProfile(user, { displayName: displayName || null }); // Set display name if provided

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.email, // Use display name or email
        createdAt: serverTimestamp(), // Use server timestamp for consistency
        isAdmin: isAdminUser, // Set admin status based on secret code
      });

      toast({
          title: "Registration Successful",
          description: `Your account has been created.${isAdminUser ? ' You have been registered as an Admin.' : ''}`
      });
      router.push('/'); // Redirect to home page after successful registration

    } catch (err: any) {
      console.error("Registration Error:", err);
      let errorMessage = "Failed to register. Please try again.";
       if (err.code === 'auth/email-already-in-use') {
          errorMessage = "This email address is already in use.";
       } else if (err.code === 'auth/invalid-email') {
          errorMessage = "Please enter a valid email address.";
       } else if (err.code === 'auth/weak-password') {
         errorMessage = "Password is too weak. Please choose a stronger password.";
       }
      setError(errorMessage);
      toast({ title: "Registration Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 md:px-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Register</CardTitle>
          <CardDescription>Create a new account to start shopping</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="displayName">Display Name (Optional)</Label>
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
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Min. 6 characters"
              />
            </div>
             <div className="space-y-2">
               <Label htmlFor="confirmPassword">Confirm Password</Label>
               <Input
                 id="confirmPassword"
                 type="password"
                 required
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 disabled={loading}
               />
             </div>
              <div className="space-y-2">
                <Label htmlFor="secretCode">Secret Code (Optional for Admin)</Label>
                <Input
                  id="secretCode"
                  type="text"
                  placeholder="Enter admin code if applicable"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  If you have an admin registration code, enter it here.
                </p>
              </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !auth || !db}> {/* Disable if auth/db not ready */}
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary underline underline-offset-4 hover:text-primary/90">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
