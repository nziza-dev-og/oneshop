
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// --- Environment Variable Loading ---
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; // Optional

// --- Logging Environment Variables (for debugging) ---
console.log("--- Firebase Environment Variables ---");
console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", apiKey ? 'Loaded' : 'MISSING');
console.log("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", authDomain ? 'Loaded' : 'MISSING');
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", projectId ? 'Loaded' : 'MISSING');
console.log("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", storageBucket ? 'Loaded' : 'MISSING');
console.log("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", messagingSenderId ? 'Loaded' : 'MISSING');
console.log("NEXT_PUBLIC_FIREBASE_APP_ID:", appId ? 'Loaded' : 'MISSING');
console.log("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:", measurementId ? 'Loaded' : 'Not Set (Optional)');
console.log("------------------------------------");


// Your web app's Firebase configuration is loaded from environment variables
const firebaseConfig: FirebaseOptions = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  // measurementId is optional, only include if it exists
  ...(measurementId && {
      measurementId: measurementId
  })
};

// Basic check for essential config keys BEFORE attempting initialization
const isConfigValid = !!(apiKey && projectId && authDomain && appId);

// Initialize Firebase services, handling potential initialization errors
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

// Check validity flag set in sessionStorage from previous failed attempts
const initializationPreviouslyFailed = typeof window !== 'undefined' && sessionStorage.getItem('firebase-initialization-failed') === 'true';


if (!isConfigValid) {
    console.error("Essential Firebase configuration (apiKey, projectId, authDomain, appId) is missing or invalid. Ensure NEXT_PUBLIC_FIREBASE_* environment variables are correctly set in your environment.");
    // Set a flag in session storage ONLY if in the browser, to prevent repeated console errors on client-side navigation
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('firebase-initialization-failed', 'true');
    }
} else if (initializationPreviouslyFailed) {
    console.warn("Firebase initialization was previously marked as failed. Skipping initialization attempt.");
}
else {
    // Configuration seems valid and no previous failure flag set, attempt initialization
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);

        // Initialize Analytics only on client-side and if supported and configured
        if (typeof window !== 'undefined' && measurementId && app) {
            isSupported().then((supported) => {
                if (supported) {
                    try {
                        analytics = getAnalytics(app);
                        console.log("Firebase Analytics initialized.");
                    } catch (analyticsError) {
                        console.error("Failed to initialize Firebase Analytics:", analyticsError);
                    }
                } else {
                    console.log("Firebase Analytics is not supported in this environment.");
                }
            }).catch(err => {
                console.error("Error checking Firebase Analytics support:", err);
            });
        }
        // Clear the failure flag if initialization succeeds
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('firebase-initialization-failed');
        }
         console.log("Firebase initialized successfully.");

    } catch (error: any) {
        console.error("CRITICAL: Failed to initialize Firebase services even after config check:", error); // Log full error
        console.error("Firebase configuration used:", firebaseConfig); // Log config again just in case
        // Reset instances to null on initialization error
        app = null;
        auth = null;
        db = null;
        analytics = null;
         // Set the session storage flag to prevent repeated initialization attempts on client.
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('firebase-initialization-failed', 'true');
        }
    }
}


// Export potentially null values, components using them MUST check for null
export { app, auth, db, analytics, isConfigValid };

