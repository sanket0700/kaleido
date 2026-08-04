"use client";

import { apiFetch } from "@/lib/data/apiFetch";

/** Explicit desired state, not a toggle - see setPostLiked for the same
 * reasoning. Dispatches to the matching idempotent PUT/DELETE endpoint. */
export async function setFollowing(
  targetUid: string,
  following: boolean,
): Promise<{ following: boolean }> {
  return apiFetch(`/api/users/${targetUid}/follow`, {
    method: following ? "PUT" : "DELETE",
  });
}
