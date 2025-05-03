// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// Using environment variables for security and correctness
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Validate that the environment variables are loaded
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase configuration is missing. Ensure NEXT_PUBLIC_FIREBASE_* environment variables are set.");
    // Optionally throw an error or handle this case appropriately
    // throw new Error("Firebase configuration is missing.");
}


// Initialize Firebase
// Conditional initialization to prevent reinitialization in Next.js hot reloading
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics only on client-side and if supported
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported && firebaseConfig.measurementId) { // Check if measurementId exists before initializing
      analytics = getAnalytics(app);
    }
  }).catch(err => {
    console.error("Error checking Firebase Analytics support:", err);
  });
}


export { app, auth, db, analytics };