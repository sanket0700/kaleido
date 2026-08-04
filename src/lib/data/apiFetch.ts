"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
}

/**
 * Attaches the signed-in user's ID token as a Bearer header and throws a
 * readable Error built from the server's { error } body on failure - the
 * one place every client data module routes through, instead of each
 * repeating "get current user, get token, fetch, parse error" by hand.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in.");
  const idToken = await user.getIdToken();

  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Request failed (${res.status}).`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
