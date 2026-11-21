
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAdkn-l2OhgNgecixOgFlaAFkt35eoJRgw",
  authDomain: "superb-mega-group-2025f.firebaseapp.com",
  projectId: "superb-mega-group-2025f",
  storageBucket: "superb-mega-group-2025f.firebasestorage.app",
  messagingSenderId: "643579814938",
  appId: "1:643579814938:web:663c666cddb899aa619da3",
  measurementId: "G-WSYHMWR9L8"
};;

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
