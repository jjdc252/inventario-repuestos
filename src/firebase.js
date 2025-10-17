import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBuni3fmaQAPiE61OuDP8A6s4qybDrGelU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "buscador-canastillas-e9352.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "buscador-canastillas-e9352",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "buscador-canastillas-e9352.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "463137837323",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:463137837323:web:5dfc9611a4983aa8b2d20e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);