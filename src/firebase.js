// firebase.js
// This file connects your React app to your Firebase project.
// The config values come from Firebase console → Project settings → Your apps.
// initializeApp — registers your app with Firebase using your project's credentials
// getFirestore — returns your database instance
// getAuth — returns your authentication instance

import { initializeApp } from "firebase/app";
//import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
// Replace ALL values below with the ones from your Firebase console
// Project settings → Your apps → SDK setup and configuration

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};


// initializeApp registers your config with Firebase
// Everything else (db, auth) is built on top of this
const app = initializeApp(firebaseConfig);

// db — use this in any file that reads/writes to Firestore
// import { db } from "../firebase"
export const db = getFirestore(app);

// auth — use this in any file that handles login/logout/register
// import { auth } from "../firebase"
export const auth = getAuth(app);
//export const storage = getStorage(app);
