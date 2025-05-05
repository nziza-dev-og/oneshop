
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyC81v5TSrC0_wE0jsLW_kFLZs7BMdP5ceQ",
  authDomain: "auction-origin.firebaseapp.com",
  projectId: "auction-origin",
  storageBucket: "auction-origin.appspot.com", // Corrected: Removed 'firebasestorage'
  messagingSenderId: "881371645224",
  appId: "1:881371645224:web:8391dc9d4e1b431ca8fc1d",
  measurementId: "G-R5GXNHTKFX" // Optional
};

// --- Logging Environment Variables (for debugging - now using hardcoded values) ---
console.log("--- Firebase Configuration ---");
console.log("apiKey:", firebaseConfig.apiKey ? 'Present' : 'MISSING');
console.log("authDomain:", firebaseConfig.authDomain ? 'Present' : 'MISSING');
console.log("projectId:", firebaseConfig.projectId ? 'Present' : 'MISSING');
console.log("storageBucket:", firebaseConfig.storageBucket ? 'Present' : 'MISSING');
console.log("messagingSenderId:", firebaseConfig.messagingSenderId ? 'Present' : 'MISSING');
console.log("appId:", firebaseConfig.appId ? 'Present' : 'MISSING');
console.log("measurementId:", firebaseConfig.measurementId ? 'Present' : 'Not Set (Optional)');
console.log("----------------------------");


// Basic check for essential config keys BEFORE attempting initialization
// Adjusted check for hardcoded config
const isConfigValid = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain &&
    firebaseConfig.appId &&
    firebaseConfig.storageBucket // Added storageBucket check
);

// Initialize Firebase services, handling potential initialization errors
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

// Check validity flag set in sessionStorage from previous failed attempts
const initializationPreviouslyFailed = typeof window !== 'undefined' && sessionStorage.getItem('firebase-initialization-failed') === 'true';


if (!isConfigValid) {
    console.error("Essential Firebase configuration (apiKey, projectId, authDomain, appId, storageBucket) is missing or invalid.");
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
        if (typeof window !== 'undefined' && firebaseConfig.measurementId && app) {
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
        console.error("CRITICAL: Failed to initialize Firebase services:", error); // Log full error
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
