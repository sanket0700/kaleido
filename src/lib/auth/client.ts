"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/data/apiFetch";

async function establishSession(): Promise<void> {
  try {
    await apiFetch("/api/auth/session", { method: "POST" });
  } catch {
    throw new Error("Signed in, but couldn't start a session. Try again.");
  }
}

export class ProfileCreationFailedError extends Error {}

/**
 * Creates the Firebase Auth account, then the session cookie, then the
 * Firestore profile doc - in that order. The session cookie comes before
 * profile creation on purpose: if profile creation then fails (e.g. a race
 * on the username), the Auth account exists and the user is already
 * server-side authenticated, so the caller can send them to
 * /complete-profile instead of treating it as a full failure. Retrying
 * signup from scratch isn't an option at that point since Firebase will
 * reject a second createUserWithEmailAndPassword for the same email.
 */
export async function signUp(
  email: string,
  password: string,
  username: string,
  displayName: string,
): Promise<void> {
  await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  await establishSession();

  try {
    await apiFetch("/api/users", { method: "POST", body: { username, displayName } });
  } catch (err) {
    throw new ProfileCreationFailedError(
      err instanceof Error ? err.message : "Couldn't create your profile.",
    );
  }
}

export async function logIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await establishSession();
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(getFirebaseAuth());
  await fetch("/api/auth/session", { method: "DELETE" });
}

/** For /complete-profile: the Auth account already exists, only the
 * Firestore profile doc is missing. */
export async function completeProfile(
  username: string,
  displayName: string,
): Promise<void> {
  try {
    await apiFetch("/api/users", { method: "POST", body: { username, displayName } });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Couldn't create your profile.");
  }
  await establishSession();
}
