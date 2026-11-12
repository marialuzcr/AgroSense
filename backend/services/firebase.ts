
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAFhZEkS4B-LEmGYk_8s2JWSHOqYJzNXAQ",
  authDomain: "agrosense-47617.firebaseapp.com",
  projectId: "agrosense-47617",
  storageBucket: "agrosense-47617.firebasestorage.app",
  messagingSenderId: "158895911098",
  appId: "1:158895911098:web:41038024f1531160fed283",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
