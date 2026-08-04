"use client";

import { useState } from "react";
import { setFollowing as setFollowingRemote } from "@/lib/data/followClient";

export function FollowButton({
  targetUid,
  initialFollowing,
}: {
  targetUid: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const optimistic = !following;
    setFollowing(optimistic);
    try {
      const result = await setFollowingRemote(targetUid, optimistic);
      setFollowing(result.following);
    } catch {
      setFollowing(following);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={
        following
          ? "shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700"
          : "shrink-0 rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
