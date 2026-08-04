import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/data/collections";

/** IDs of the accounts `uid` follows - reads the follows/{followerId}_
 * {followedId} docs created by the follow/unfollow action, keyed by
 * followerId so no composite index is needed for this query. */
export async function getFollowingIds(uid: string): Promise<string[]> {
  const snap = await getAdminDb()
    .collection(COLLECTIONS.follows)
    .where("followerId", "==", uid)
    .get();
  return snap.docs.map((doc) => doc.data().followedId as string);
}

export async function isFollowing(
  followerId: string,
  followedId: string,
): Promise<boolean> {
  const snap = await getAdminDb()
    .collection(COLLECTIONS.follows)
    .doc(`${followerId}_${followedId}`)
    .get();
  return snap.exists;
}

export class CannotFollowSelfError extends Error {
  constructor() {
    super("You can't follow yourself.");
    this.name = "CannotFollowSelfError";
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super("User not found.");
    this.name = "UserNotFoundError";
  }
}

/** Idempotent: following an already-followed account is a no-op rather
 * than double-incrementing counters. Split from a single toggle endpoint
 * for the same reason as likePost/unlikePost - a toggle isn't safe to
 * retry, and PUT vs DELETE is visible in a request log where POST
 * .../follow (either direction) isn't. */
export async function followUser(followerId: string, followedId: string): Promise<void> {
  if (followerId === followedId) throw new CannotFollowSelfError();

  const db = getAdminDb();
  const followRef = db.collection(COLLECTIONS.follows).doc(`${followerId}_${followedId}`);
  const followerRef = db.collection(COLLECTIONS.users).doc(followerId);
  const followedRef = db.collection(COLLECTIONS.users).doc(followedId);

  await db.runTransaction(async (tx) => {
    const [followSnap, followerSnap, followedSnap] = await Promise.all([
      tx.get(followRef),
      tx.get(followerRef),
      tx.get(followedRef),
    ]);
    if (!followerSnap.exists || !followedSnap.exists) throw new UserNotFoundError();
    if (followSnap.exists) return; // already following

    tx.set(followRef, {
      followerId,
      followedId,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(followerRef, { followingCount: FieldValue.increment(1) });
    tx.update(followedRef, { followerCount: FieldValue.increment(1) });
  });
}

export async function unfollowUser(followerId: string, followedId: string): Promise<void> {
  const db = getAdminDb();
  const followRef = db.collection(COLLECTIONS.follows).doc(`${followerId}_${followedId}`);
  const followerRef = db.collection(COLLECTIONS.users).doc(followerId);
  const followedRef = db.collection(COLLECTIONS.users).doc(followedId);

  await db.runTransaction(async (tx) => {
    const [followSnap, followerSnap, followedSnap] = await Promise.all([
      tx.get(followRef),
      tx.get(followerRef),
      tx.get(followedRef),
    ]);
    if (!followerSnap.exists || !followedSnap.exists) throw new UserNotFoundError();
    if (!followSnap.exists) return; // already not following

    tx.delete(followRef);
    tx.update(followerRef, { followingCount: FieldValue.increment(-1) });
    tx.update(followedRef, { followerCount: FieldValue.increment(-1) });
  });
}
