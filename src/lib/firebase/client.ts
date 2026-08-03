"use client";

import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  type Firestore,
  getFirestore,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  type FirebaseStorage,
  getStorage,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let cached: FirebaseClient | undefined;

declare global {
  var __kaleidoEmulatorsConnected: boolean | undefined;
}

// Lazily initialized on first call, not at module import time. Next.js
// server-renders Client Components too (for the initial HTML + hydration),
// so eager top-level initializeApp()/getAuth() calls here would also run
// during `next build`'s prerender pass, where no NEXT_PUBLIC_FIREBASE_*
// config is necessarily present. Deferring until something actually calls
// getFirebaseAuth()/etc. means this only ever runs in the browser.
function getFirebaseClient(): FirebaseClient {
  if (cached) return cached;

  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  if (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
    !globalThis.__kaleidoEmulatorsConnected
  ) {
    // Guarded by the global flag because Next.js Fast Refresh re-evaluates
    // this module without a full reload, and the SDK throws if you connect
    // to an emulator twice.
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    globalThis.__kaleidoEmulatorsConnected = true;
  }

  cached = { app, auth, db, storage };
  return cached;
}

export function getFirebaseAuth(): Auth {
  return getFirebaseClient().auth;
}

export function getFirebaseDb(): Firestore {
  return getFirebaseClient().db;
}

export function getFirebaseStorage(): FirebaseStorage {
  return getFirebaseClient().storage;
}
