
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAsBHCBg9HnJM0MfQsl4zD0k0zBIKJTIR4",
  authDomain: "superb-mega-group-77537.firebaseapp.com",
  projectId: "superb-mega-group-77537",
  storageBucket: "superb-mega-group-77537.firebasestorage.app",
  messagingSenderId: "140109945016",
  appId: "1:140109945016:web:67fedb6813608ef161fc4d",
  measurementId: "G-ETVQFHPMV8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
