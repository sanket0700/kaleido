"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase/client";

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
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in.");
  const idToken = await user.getIdToken();

  const res = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, imageURLs, caption }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Couldn't create post.");
  }
  const data = await res.json();
  return data.postId as string;
}
