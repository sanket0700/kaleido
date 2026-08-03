"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase/client";

function safeExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ext || "jpg";
}

/** Uploads straight to Storage (see storage.rules for the actual
 * enforcement: owner-scoped path, image content-type, 10MB cap). */
export async function uploadAvatar(file: File): Promise<string> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in.");

  const path = `avatars/${user.uid}/${Date.now()}.${safeExtension(file.name)}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function updateProfile(fields: {
  username: string;
  displayName: string;
  bio: string;
  photoURL?: string;
}): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in.");
  const idToken = await user.getIdToken();

  const res = await fetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, ...fields }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Couldn't update profile.");
  }
}
