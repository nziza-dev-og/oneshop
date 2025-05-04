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
    // Wait for Firebase auth and db to be potentially initialized
    // This is a basic check, more robust solutions might involve explicit ready state from firebase lib
    if (auth && db) {
        setFirebaseReady(true);
    } else {
        // Handle the case where Firebase failed to initialize
        console.error("Firebase Auth or Firestore is not initialized. Authentication checks will not work.");
        setLoading(false); // Stop loading, but state remains unauthenticated
        // Optionally show an error message to the user
    }

    if (firebaseReady && auth) { // Only subscribe if Firebase is ready and auth exists
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
    } else if (!auth) {
        // If auth is null after initial check, set loading to false
        setLoading(false);
    }
  }, [firebaseReady]); // Re-run when firebaseReady changes

  // Render a loading state until Firebase initialization attempt is complete
  if (loading && !firebaseReady) {
     return (
       <div className="flex min-h-screen items-center justify-center">
            <p>Initializing authentication...</p>
            {/* Or use a more sophisticated loading spinner */}
       </div>
      );
  }

  // Potentially render an error state if firebaseReady is false after loading
  if (!firebaseReady && !loading) {
      return (
          <div className="flex min-h-screen items-center justify-center p-4 text-center text-destructive">
              Authentication service could not be initialized. Please check the configuration and try again.
          </div>
      );
  }


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
