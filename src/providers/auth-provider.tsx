
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, isConfigValid } from '@/lib/firebase/firebase'; // Import possibly null instances and isConfigValid
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

  useEffect(() => {
    // Only set up the listener if Firebase config is valid and auth/db instances exist
    if (isConfigValid && auth && db) {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Check for admin role only if db is available
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
        // Firebase is not configured or initialized correctly
        console.error("AuthProvider: Firebase is not properly configured or initialized. Auth features disabled.");
        setUser(null);
        setIsAdmin(false);
        setLoading(false); // Stop loading as auth state won't change
    }
  }, []); // Run only once on mount


  // Render a loading state while initially checking Firebase status or waiting for auth state
  if (loading) {
     return (
       <div className="flex min-h-screen items-center justify-center">
            {/* Use a simple loading indicator or skeleton */}
            <Skeleton className="h-8 w-32" />
       </div>
      );
  }

  // Render children once loading is complete, regardless of Firebase status
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
