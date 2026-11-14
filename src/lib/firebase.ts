import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { getEnv } from "./env";

// Inicia Firebase Admin una sola vez, con la cuenta de servicio de las variables de entorno.
function ensureApp(): void {
  if (getApps().length > 0) {
    return;
  }
  const env = getEnv();
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

export function getDb(): Firestore {
  ensureApp();
  return getFirestore();
}

export function getAdminAuth(): Auth {
  ensureApp();
  return getAuth();
}
