import "server-only";

import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// No service-account JSON is used here on purpose. On Cloud Run this picks
// up the attached service account automatically via Application Default
// Credentials; locally it talks to the Firebase emulators via the
// FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST /
// FIREBASE_STORAGE_EMULATOR_HOST env vars set in .env.local. If you ever
// need a real service-account key for local testing against the live
// project, set GOOGLE_APPLICATION_CREDENTIALS to a path OUTSIDE the repo —
// never commit a key file.
const app: App =
  getApps()[0] ??
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      : undefined,
  });

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);
