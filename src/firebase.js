// /src/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getDatabase } from "firebase/database";

// ✅ Firebase Config from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_ID,
  appId: import.meta.env.VITE_APP_ID,
};

// 🛡️ Safety check for missing environment variables
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
  throw new Error("❌ Firebase environment variables are missing or invalid.");
}

// ✅ Initialize Firebase app (prevent double init in dev/hot-reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Auth & set local persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("✅ Auth persistence set to local"))
  .catch((error) => console.error("❌ Persistence error:", error));

// ✅ Realtime Database
const db = getDatabase(app);

// ✅ Export
export { app, auth, db };


