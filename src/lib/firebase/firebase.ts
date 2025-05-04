
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from "firebase/app"; // Added FirebaseApp
import { getAuth, Auth } from "firebase/auth"; // Added Auth type
import { getFirestore, Firestore } from "firebase/firestore"; // Added Firestore type
import { getAnalytics, Analytics, isSupported } from "firebase/analytics"; // Added Analytics type

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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


// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

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


// Export potentially null values, components using them MUST check for null
export { app, auth, db, analytics };
