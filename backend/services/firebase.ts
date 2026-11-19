import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAFhZEkS4B-LEmGYk_8s2JWSHOqYJzNXAQ",
  authDomain: "agrosense-47617.firebaseapp.com",
  databaseURL: "https://agrosense-47617-default-rtdb.firebaseio.com",
  projectId: "agrosense-47617",
  storageBucket: "agrosense-47617.firebasestorage.app",
  messagingSenderId: "158895911098",
  appId: "1:158895911098:web:41038024f1531160fed283",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const realtimeDb = getDatabase(app);
