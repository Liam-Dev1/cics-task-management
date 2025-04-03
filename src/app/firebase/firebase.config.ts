// Import the functions you need from the SDKs you need
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage" // Import Firebase Storage

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDHcy0dzLUQ7y3rGzrSggSPH0tYvwOuqWY",
  authDomain: "cics-task-management.firebaseapp.com",
  projectId: "cics-task-management",
  storageBucket: "cics-task-management.appspot.com", // Update this to your storage bucket
  messagingSenderId: "8408950164",
  appId: "1:8408950164:web:547aad1d79a1a6e0d39b81",
  measurementId: "G-4R4Q56DN12"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app); // Initialize Firebase Storage


