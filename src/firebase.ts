import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDJpOWwrJzJ3O1Saa239tY50pYH7jXyqs0",
  authDomain: "loginform-3a1d4.firebaseapp.com",
  projectId: "loginform-3a1d4",
  storageBucket: "loginform-3a1d4.firebasestorage.app",
  messagingSenderId: "809712304763",
  appId: "1:809712304763:web:0a8fa356951a47c64b98de"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;

