import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCQiPFiPgZl57E4uw3aeHQa6pm6wZTbDTg",
  authDomain: "azrylampremnew.firebaseapp.com",
  projectId: "azrylampremnew",
  storageBucket: "azrylampremnew.firebasestorage.app",
  messagingSenderId: "1029417536019",
  appId: "1:1029417536019:web:5af896a73e8ccb90d5cde6",
  measurementId: "G-L6X19G1TPC"
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app;
