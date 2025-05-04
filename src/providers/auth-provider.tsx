
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/firebase'; // Import possibly null instances
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading state

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false); // Track Firebase readiness

  useEffect(() => {
    // Check if auth and db instances were successfully initialized
    if (auth && db) {
        setFirebaseReady(true);
    } else {
        // Log a warning if Firebase failed to initialize (likely due to bad config)
        console.warn("Firebase Auth or Firestore is not initialized. Authentication features will be unavailable.");
        setFirebaseReady(false);
        setLoading(false); // Stop loading, but state remains unauthenticated
    }
  }, []); // Run only once on mount to check initial Firebase state

  useEffect(() => {
    if (!firebaseReady) {
        // If Firebase is not ready after the initial check, do nothing further.
        return;
    }

    // If Firebase is ready and auth exists, set up the listener
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser && db) { // Also ensure db is ready for admin check
                setUser(firebaseUser);
                // Check for admin role
                try {
                    const userDocRef = doc(db, 'users', firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists() && userDocSnap.data().isAdmin === true) {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
                } catch (error) {
                    console.error("Error checking admin status:", error);
                    setIsAdmin(false); // Default to not admin on error
                }
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    } else {
        // If auth is still null even though firebaseReady was initially true (should be rare)
        setLoading(false);
    }
  }, [firebaseReady]); // Re-run when firebaseReady changes


  // Render a loading state while initially checking Firebase status or waiting for auth state
  if (loading) {
     return (
       <div className="flex min-h-screen items-center justify-center">
            <p>Loading...</p>
            {/* Or use a more sophisticated loading spinner */}
       </div>
      );
  }

  // If Firebase isn't ready after loading, render children but auth features will be disabled
  // The console warning from the first effect serves as the error indication.
  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
