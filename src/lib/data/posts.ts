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
