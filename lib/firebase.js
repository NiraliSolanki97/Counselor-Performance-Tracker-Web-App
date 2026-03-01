
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB4VIpb-o0IjioV1I8yGyJeNlYxk2jcuXs",
  authDomain: "counselor-performance-tr-f9967.firebaseapp.com",
  projectId: "counselor-performance-tr-f9967",
  storageBucket: "counselor-performance-tr-f9967.firebasestorage.app",
  messagingSenderId: "65145639884",
  appId: "1:65145639884:web:66977ccad38bc5e7660369",
  measurementId: "G-9EQ6S1QS2V"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

