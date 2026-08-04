import "server-only";

import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/data/collections";
import { ProfileNotFoundError } from "@/lib/data/users";

export {
  MAX_CAPTION_LENGTH,
  MAX_IMAGES_PER_POST,
  MAX_COMMENT_LENGTH,
} from "@/lib/data/postLimits";

export interface Post {
  id: string;
  authorId: string;
  imageURLs: string[];
  caption: string;
  createdAt: Timestamp | null;
  likeCount: number;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: Timestamp | null;
}

export class PostNotFoundError extends Error {
  constructor() {
    super("Post not found.");
    this.name = "PostNotFoundError";
  }
}

export async function getPost(postId: string): Promise<Post | null> {
  const snap = await getAdminDb().collection(COLLECTIONS.posts).doc(postId).get();
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
    .collection(COLLECTIONS.posts)
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
  const postRef = db.collection(COLLECTIONS.posts).doc();
  const userRef = db.collection(COLLECTIONS.users).doc(authorId);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new ProfileNotFoundError();

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

export async function isLikedByUser(postId: string, uid: string): Promise<boolean> {
  const snap = await getAdminDb()
    .collection(COLLECTIONS.posts)
    .doc(postId)
    .collection(SUBCOLLECTIONS.likes)
    .doc(uid)
    .get();
  return snap.exists;
}

/** Idempotent: liking an already-liked post is a no-op that returns the
 * current count rather than double-incrementing. Split from a single
 * toggle endpoint on purpose - a toggle can't be retried safely (a
 * double-click or a retried request flips state twice), and a request log
 * showing POST .../like tells you nothing about which direction it went,
 * whereas PUT vs DELETE does. */
export async function likePost(
  postId: string,
  uid: string,
): Promise<{ liked: true; likeCount: number }> {
  const db = getAdminDb();
  const postRef = db.collection(COLLECTIONS.posts).doc(postId);
  const likeRef = postRef.collection(SUBCOLLECTIONS.likes).doc(uid);

  return db.runTransaction(async (tx) => {
    const [postSnap, likeSnap] = await Promise.all([tx.get(postRef), tx.get(likeRef)]);
    if (!postSnap.exists) throw new PostNotFoundError();

    const currentCount = (postSnap.data()?.likeCount as number | undefined) ?? 0;
    if (likeSnap.exists) return { liked: true, likeCount: currentCount };

    const likeCount = currentCount + 1;
    tx.set(likeRef, { createdAt: FieldValue.serverTimestamp() });
    tx.update(postRef, { likeCount });
    return { liked: true, likeCount };
  });
}

export async function unlikePost(
  postId: string,
  uid: string,
): Promise<{ liked: false; likeCount: number }> {
  const db = getAdminDb();
  const postRef = db.collection(COLLECTIONS.posts).doc(postId);
  const likeRef = postRef.collection(SUBCOLLECTIONS.likes).doc(uid);

  return db.runTransaction(async (tx) => {
    const [postSnap, likeSnap] = await Promise.all([tx.get(postRef), tx.get(likeRef)]);
    if (!postSnap.exists) throw new PostNotFoundError();

    const currentCount = (postSnap.data()?.likeCount as number | undefined) ?? 0;
    if (!likeSnap.exists) return { liked: false, likeCount: currentCount };

    const likeCount = Math.max(0, currentCount - 1);
    tx.delete(likeRef);
    tx.update(postRef, { likeCount });
    return { liked: false, likeCount };
  });
}

const MAX_COMMENTS_PER_PAGE = 100;

export async function getComments(postId: string): Promise<Comment[]> {
  const snap = await getAdminDb()
    .collection(COLLECTIONS.posts)
    .doc(postId)
    .collection(SUBCOLLECTIONS.comments)
    .orderBy("createdAt", "asc")
    .limit(MAX_COMMENTS_PER_PAGE)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    postId,
    ...(doc.data() as Omit<Comment, "id" | "postId">),
  }));
}

/** Creates the comment and bumps the post's commentCount in one
 * transaction, same reasoning as createPost. */
export async function addComment(
  postId: string,
  authorId: string,
  text: string,
): Promise<string> {
  const db = getAdminDb();
  const postRef = db.collection(COLLECTIONS.posts).doc(postId);
  const commentRef = postRef.collection(SUBCOLLECTIONS.comments).doc();

  await db.runTransaction(async (tx) => {
    const postSnap = await tx.get(postRef);
    if (!postSnap.exists) throw new PostNotFoundError();

    tx.set(commentRef, {
      authorId,
      text,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.update(postRef, { commentCount: FieldValue.increment(1) });
  });

  return commentRef.id;
}
