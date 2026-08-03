import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

/** IDs of the accounts `uid` follows - reads the follows/{followerId}_
 * {followedId} docs created by the follow/unfollow action, keyed by
 * followerId so no composite index is needed for this query. */
export async function getFollowingIds(uid: string): Promise<string[]> {
  const snap = await getAdminDb()
    .collection("follows")
    .where("followerId", "==", uid)
    .get();
  return snap.docs.map((doc) => doc.data().followedId as string);
}

export async function isFollowing(
  followerId: string,
  followedId: string,
): Promise<boolean> {
  const snap = await getAdminDb()
    .collection("follows")
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

/** Toggles the follow relationship and both users' counters in one
 * transaction - the old backend updated following/followers arrays on two
 * separate user docs as unrelated writes with no atomicity between them. */
export async function toggleFollow(
  followerId: string,
  followedId: string,
): Promise<{ following: boolean }> {
  if (followerId === followedId) throw new CannotFollowSelfError();

  const db = getAdminDb();
  const followRef = db.collection("follows").doc(`${followerId}_${followedId}`);
  const followerRef = db.collection("users").doc(followerId);
  const followedRef = db.collection("users").doc(followedId);

  return db.runTransaction(async (tx) => {
    const [followSnap, followerSnap, followedSnap] = await Promise.all([
      tx.get(followRef),
      tx.get(followerRef),
      tx.get(followedRef),
    ]);
    if (!followerSnap.exists || !followedSnap.exists) {
      throw new UserNotFoundError();
    }

    const following = !followSnap.exists;

    if (following) {
      tx.set(followRef, {
        followerId,
        followedId,
        createdAt: FieldValue.serverTimestamp(),
      });
    } else {
      tx.delete(followRef);
    }
    tx.update(followerRef, {
      followingCount: FieldValue.increment(following ? 1 : -1),
    });
    tx.update(followedRef, {
      followerCount: FieldValue.increment(following ? 1 : -1),
    });

    return { following };
  });
}
