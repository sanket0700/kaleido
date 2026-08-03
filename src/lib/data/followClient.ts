"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

export async function toggleFollow(targetUid: string): Promise<{ following: boolean }> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in.");
  const idToken = await user.getIdToken();

  const res = await fetch(`/api/users/${targetUid}/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Couldn't update follow status.");
  }
  return res.json();
}
