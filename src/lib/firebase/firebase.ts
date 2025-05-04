
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from "firebase/app"; // Added FirebaseApp
import { getAuth, Auth } from "firebase/auth"; // Added Auth type
import { getFirestore, Firestore } from "firebase/firestore"; // Added Firestore type
import { getAnalytics, Analytics, isSupported } from "firebase/analytics"; // Added Analytics type

// Your web app's Firebase configuration
// Using hardcoded config as provided by the user
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyC81v5TSrC0_wE0jsLW_kFLZs7BMdP5ceQ",
  authDomain: "auction-origin.firebaseapp.com",
  projectId: "auction-origin",
  storageBucket: "auction-origin.firebasestorage.app",
  messagingSenderId: "881371645224",
  appId: "1:881371645224:web:8391dc9d4e1b431ca8fc1d",
  measurementId: "G-R5GXNHTKFX"
};

// Basic check for essential config keys
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

// Initialize Firebase services, handling potential initialization errors
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
        if (typeof window !== 'undefined' && firebaseConfig.measurementId && app) {
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
        console.error("Failed to initialize Firebase services:", error.message);
        // Reset instances to null on initialization error
        app = null;
        auth = null;
        db = null;
        analytics = null;
    }
} else {
     console.error("Essential Firebase configuration (apiKey, projectId) is missing or invalid in the provided firebaseConfig object.");
     // Firebase services will remain null
}


// Export potentially null values, components using them MUST check for null
export { app, auth, db, analytics, isConfigValid };
