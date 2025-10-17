import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBuni3fmaQAPiE61OuDP8A6s4qybDrGelU",
  authDomain: "buscador-canastillas-e9352.firebaseapp.com",
  projectId: "buscador-canastillas-e9352",
  storageBucket: "buscador-canastillas-e9352.firebasestorage.app",
  messagingSenderId: "463137837323",
  appId: "1:463137837323:web:5dfc9611a4983aa8b2d20e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
