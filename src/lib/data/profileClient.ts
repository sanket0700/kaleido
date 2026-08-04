"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/data/apiFetch";

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
  await apiFetch("/api/users/me", { method: "PATCH", body: fields });
}
