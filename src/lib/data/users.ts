import "server-only";

import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export { USERNAME_PATTERN } from "@/lib/data/usernamePattern";

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  photoURL: string | null;
  createdAt: Timestamp | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getAdminDb().collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, "uid">) };
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getAdminDb().collection("usernames").doc(username).get();
  return !snap.exists;
}

export class UsernameTakenError extends Error {
  constructor() {
    super("That username is taken.");
    this.name = "UsernameTakenError";
  }
}

export class ProfileExistsError extends Error {
  constructor() {
    super("Profile already exists.");
    this.name = "ProfileExistsError";
  }
}

export async function createUserProfile(
  uid: string,
  username: string,
  displayName: string,
): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const usernameRef = db.collection("usernames").doc(username);

  await db.runTransaction(async (tx) => {
    const [userSnap, usernameSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(usernameRef),
    ]);
    if (userSnap.exists) throw new ProfileExistsError();
    if (usernameSnap.exists) throw new UsernameTakenError();

    const profile: Omit<UserProfile, "uid" | "createdAt"> = {
      username,
      displayName,
      bio: "",
      photoURL: null,
      postCount: 0,
      followerCount: 0,
      followingCount: 0,
    };
    tx.set(userRef, { ...profile, createdAt: FieldValue.serverTimestamp() });
    tx.set(usernameRef, { uid });
  });
}
