"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/data/apiFetch";

function safeExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ext || "jpg";
}

/** Uploads all images for one post under a shared draft id (posts/{uid}/
 * {draftId}/...) so storage.rules can scope the whole batch to its owner
 * before the post doc even exists. */
export async function uploadPostImages(files: File[]): Promise<string[]> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in.");

  const draftId = crypto.randomUUID();
  const storage = getFirebaseStorage();

  const urls: string[] = [];
  for (const [index, file] of files.entries()) {
    const path = `posts/${user.uid}/${draftId}/${index}.${safeExtension(file.name)}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    urls.push(await getDownloadURL(storageRef));
  }
  return urls;
}

export async function createPost(
  imageURLs: string[],
  caption: string,
): Promise<string> {
  const data = await apiFetch<{ postId: string }>("/api/posts", {
    method: "POST",
    body: { imageURLs, caption },
  });
  return data.postId;
}

/** Explicit desired state, not a toggle - the caller (LikeButton) already
 * knows what it wants from its own optimistic UI state, so there's no
 * reason to ask the server to flip-and-report-back. Dispatches to the
 * matching idempotent PUT/DELETE endpoint. */
export async function setPostLiked(
  postId: string,
  liked: boolean,
): Promise<{ liked: boolean; likeCount: number }> {
  return apiFetch(`/api/posts/${postId}/like`, { method: liked ? "PUT" : "DELETE" });
}

export async function addComment(postId: string, text: string): Promise<void> {
  await apiFetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: { text },
  });
}
