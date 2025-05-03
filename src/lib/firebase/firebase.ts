// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC81v5TSrC0_wE0jsLW_kFLZs7BMdP5ceQ",
  authDomain: "auction-origin.firebaseapp.com",
  projectId: "auction-origin",
  storageBucket: "auction-origin.firebasestorage.app",
  messagingSenderId: "881371645224",
  appId: "1:881371645224:web:8391dc9d4e1b431ca8fc1d",
  measurementId: "G-R5GXNHTKFX"
};


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
      try {
        analytics = getAnalytics(app);
      } catch (error) {
          console.error("Failed to initialize Firebase Analytics", error);
      }
    }
  }).catch(err => {
    console.error("Error checking Firebase Analytics support:", err);
  });
}


export { app, auth, db, analytics };
