// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from "firebase/app"; // Added FirebaseApp
import { getAuth, Auth } from "firebase/auth"; // Added Auth type
import { getFirestore, Firestore } from "firebase/firestore"; // Added Firestore type
import { getAnalytics, Analytics, isSupported } from "firebase/analytics"; // Added Analytics type

// Your web app's Firebase configuration is loaded from environment variables
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId is optional, only include if it exists
  ...(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID && {
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  })
};

// Basic check for essential config keys
const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain && firebaseConfig.appId);

if (!isConfigValid) {
    console.error("Essential Firebase configuration (apiKey, projectId, authDomain, appId) is missing or invalid. Ensure NEXT_PUBLIC_FIREBASE_* environment variables are correctly set in your environment.");
    console.error("Current Firebase config:", firebaseConfig); // Log the config
    // Depending on the desired behavior, you might throw an error here
    // or allow the app to continue with potentially broken Firebase functionality.
}

// Initialize Firebase services, handling potential initialization errors
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

// Initialize only if config is valid and running in a browser or server environment where initialization makes sense
if (isConfigValid && typeof window !== 'undefined') { // Check for window object before initializing
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);

        // Initialize Analytics only on client-side and if supported and configured
        if (firebaseConfig.measurementId && app) {
            isSupported().then((supported) => {
                if (supported) {
                    try {
                        analytics = getAnalytics(app);
                        console.log("Firebase Analytics initialized.");
                    } catch (analyticsError) {
                        console.error("Failed to initialize Firebase Analytics", analyticsError);
                    }
                }
            }).catch(err => {
                console.error("Error checking Firebase Analytics support:", err);
            });
        }
    } catch (error: any) {
        console.error("Failed to initialize Firebase services:", error); // Log full error
        console.error("Firebase configuration:", firebaseConfig); // Log config
        // Reset instances to null on initialization error
        app = null;
        auth = null;
        db = null;
        analytics = null;
    }
} else if (isConfigValid && typeof window === 'undefined') {
     // Handle server-side initialization if needed (e.g., for Admin SDK or specific server actions)
     // For client-side SDK, we typically initialize only in the browser.
     // If you need server-side Firebase access, consider using the Firebase Admin SDK.
     // For now, we assume client-side initialization is primary.
     console.log("Firebase client SDK initialized on server?"); // Check if this happens unexpectedly
      try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);
     } catch (error: any) {
         console.error("Failed to initialize Firebase services on server:", error); // Log full error
         console.error("Firebase configuration:", firebaseConfig); // Log config
         app = null;
         auth = null;
         db = null;
     }
}


// Export potentially null values, components using them MUST check for null
export { app, auth, db, analytics, isConfigValid };
    