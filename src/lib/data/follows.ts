import "server-only";

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
