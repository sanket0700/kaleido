"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

async function establishSession(idToken: string) {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    throw new Error("Signed in, but couldn't start a session. Try again.");
  }
}

async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error ?? fallback;
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
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  const idToken = await credential.user.getIdToken();

  await establishSession(idToken);

  const profileRes = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, username, displayName }),
  });
  if (!profileRes.ok) {
    throw new ProfileCreationFailedError(
      await readError(profileRes, "Couldn't create your profile."),
    );
  }
}

export async function logIn(email: string, password: string): Promise<void> {
  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  const idToken = await credential.user.getIdToken();
  await establishSession(idToken);
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
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in.");
  const idToken = await user.getIdToken();

  const profileRes = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, username, displayName }),
  });
  if (!profileRes.ok) {
    throw new Error(await readError(profileRes, "Couldn't create your profile."));
  }

  await establishSession(idToken);
}
