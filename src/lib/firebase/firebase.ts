
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from "firebase/app"; // Added FirebaseApp
import { getAuth, Auth } from "firebase/auth"; // Added Auth type
import { getFirestore, Firestore } from "firebase/firestore"; // Added Firestore type
import { getAnalytics, Analytics, isSupported } from "firebase/analytics"; // Added Analytics type

// Your web app's Firebase configuration from environment variables
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

// Validate that the essential environment variables are loaded and seem valid
const isConfigValid =
    typeof firebaseConfig.apiKey === 'string' && firebaseConfig.apiKey.length > 0 &&
    typeof firebaseConfig.projectId === 'string' && firebaseConfig.projectId.length > 0;

if (!isConfigValid) {
    console.error("Essential Firebase configuration (apiKey, projectId) is missing or invalid. Ensure NEXT_PUBLIC_FIREBASE_* environment variables are correctly set in your environment.");
    // Depending on the desired behavior, you might throw an error here
    // or allow the app to continue with potentially broken Firebase functionality.
}

// Initialize Firebase only if config seems present and valid
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

if (isConfigValid) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        db = getFirestore(app);

        // Initialize Analytics only on client-side and if supported and configured
        if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
            isSupported().then((supported) => {
                if (supported && app) { // Ensure app is defined before using it
                    try {
                        analytics = getAnalytics(app);
                        console.log("Firebase Analytics initialized.");
                    } catch (analyticsError) {
                        console.error("Failed to initialize Firebase Analytics", analyticsError);
                    }
                } else {
                     // console.log("Firebase Analytics is not supported in this environment or measurementId is missing.");
                }
            }).catch(err => {
                console.error("Error checking Firebase Analytics support:", err);
            });
        }
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        // Reset instances to null on initialization error
        app = null;
        auth = null;
        db = null;
        analytics = null;
    }
} else {
    // Handle the case where essential config is missing or invalid
    console.warn("Firebase initialization skipped due to missing or invalid configuration.");
}


// Export potentially null values, components using them MUST check for null
export { app, auth, db, analytics };
