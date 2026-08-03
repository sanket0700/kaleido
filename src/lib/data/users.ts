import "server-only";

import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export { USERNAME_PATTERN, isValidUsername } from "@/lib/data/usernamePattern";

export const MAX_DISPLAY_NAME_LENGTH = 60;
export const MAX_BIO_LENGTH = 150;

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

/** Batch lookup for rendering a list of posts/comments without an N+1
 * waterfall - one parallel round of reads, not one per post. */
export async function getUserProfiles(
  uids: string[],
): Promise<Map<string, UserProfile>> {
  const uniqueUids = [...new Set(uids)];
  const profiles = await Promise.all(uniqueUids.map(getUserProfile));
  const byUid = new Map<string, UserProfile>();
  profiles.forEach((profile, i) => {
    if (profile) byUid.set(uniqueUids[i], profile);
  });
  return byUid;
}

export async function getUserProfileByUsername(
  username: string,
): Promise<UserProfile | null> {
  const usernameSnap = await getAdminDb()
    .collection("usernames")
    .doc(username)
    .get();
  if (!usernameSnap.exists) return null;
  const { uid } = usernameSnap.data() as { uid: string };
  return getUserProfile(uid);
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

export class ProfileNotFoundError extends Error {
  constructor() {
    super("Profile not found.");
    this.name = "ProfileNotFoundError";
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

export interface ProfileUpdate {
  username: string;
  displayName: string;
  bio: string;
  photoURL: string | null;
}

export async function updateUserProfile(
  uid: string,
  update: ProfileUpdate,
): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection("users").doc(uid);
  const newUsernameRef = db.collection("usernames").doc(update.username);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new ProfileNotFoundError();
    const current = userSnap.data() as Omit<UserProfile, "uid">;

    const usernameChanged = current.username !== update.username;
    if (usernameChanged) {
      const newUsernameSnap = await tx.get(newUsernameRef);
      if (newUsernameSnap.exists) throw new UsernameTakenError();
    }

    // All reads above must happen before any writes below - Firestore
    // transactions require reads-before-writes.
    if (usernameChanged) {
      const oldUsernameRef = db.collection("usernames").doc(current.username);
      tx.delete(oldUsernameRef);
      tx.set(newUsernameRef, { uid });
    }

    tx.update(userRef, {
      username: update.username,
      displayName: update.displayName,
      bio: update.bio,
      photoURL: update.photoURL,
    });
  });
}
