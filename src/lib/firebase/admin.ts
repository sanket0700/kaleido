import "server-only";

import {
  type App,
  type AppOptions,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

// Lazily initialized on first real use, not at module import time. Route
// Handler modules get imported during `next build`'s page-data-collection
// pass with no env vars / emulator present - eager initializeApp() here
// would crash the build. Deferring until a getAdmin*() is actually called
// (i.e. inside a request) means it only ever runs with real config: the
// emulator env vars locally, or Cloud Run's attached service account (via
// Application Default Credentials) in production.
function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const options: AppOptions = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
  // No service-account JSON is committed to this repo. Only set
  // GOOGLE_APPLICATION_CREDENTIALS for local testing against the live
  // project, pointed at a key file OUTSIDE the repo - never commit one.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    options.credential = cert(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }
  return initializeApp(options);
}

let cachedAuth: Auth | undefined;
let cachedDb: Firestore | undefined;
let cachedStorage: Storage | undefined;

export function getAdminAuth(): Auth {
  return (cachedAuth ??= getAuth(getAdminApp()));
}

export function getAdminDb(): Firestore {
  return (cachedDb ??= getFirestore(getAdminApp()));
}

export function getAdminStorage(): Storage {
  return (cachedStorage ??= getStorage(getAdminApp()));
}
