import "server-only";

import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

export { MAX_CAPTION_LENGTH, MAX_IMAGES_PER_POST } from "@/lib/data/postLimits";

export interface Post {
  id: string;
  authorId: string;
  imageURLs: string[];
  caption: string;
  createdAt: Timestamp | null;
  likeCount: number;
  commentCount: number;
}

export async function getPost(postId: string): Promise<Post | null> {
  const snap = await getAdminDb().collection("posts").doc(postId).get();
  if (!snap.exists) return null;
  return { id: postId, ...(snap.data() as Omit<Post, "id">) };
}

// Firestore's "in" operator caps out at 10 comparison values. Fine for a
// low-traffic pet project; a following list past 10 accounts would need a
// fan-out-on-write feed instead of querying by author list directly - not
// worth building until there's an actual reason to.
const MAX_FEED_AUTHORS = 10;
const FEED_PAGE_SIZE = 30;

export async function getPostsByAuthors(authorIds: string[]): Promise<Post[]> {
  if (authorIds.length === 0) return [];

  const snap = await getAdminDb()
    .collection("posts")
    .where("authorId", "in", authorIds.slice(0, MAX_FEED_AUTHORS))
    .orderBy("createdAt", "desc")
    .limit(FEED_PAGE_SIZE)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Post, "id">),
  }));
}

/** Creates the post doc and bumps the author's postCount in one
 * transaction - the old backend did these as separate, un-transactional
 * writes with a fan-out loop that could partially fail. */
export async function createPost(
  authorId: string,
  imageURLs: string[],
  caption: string,
): Promise<string> {
  const db = getAdminDb();
  const postRef = db.collection("posts").doc();
  const userRef = db.collection("users").doc(authorId);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new Error("PROFILE_NOT_FOUND");
    }

    tx.set(postRef, {
      authorId,
      imageURLs,
      caption,
      createdAt: FieldValue.serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
    });
    tx.update(userRef, { postCount: FieldValue.increment(1) });
  });

  return postRef.id;
}
