"use client";

import { useState } from "react";
import { toggleLike } from "@/lib/data/postsClient";

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setCount((c) => c + (optimisticLiked ? 1 : -1));

    try {
      const result = await toggleLike(postId);
      setLiked(result.liked);
      setCount(result.likeCount);
    } catch {
      setLiked(liked);
      setCount((c) => c - (optimisticLiked ? 1 : -1));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-sm text-black disabled:opacity-50 dark:text-zinc-50"
    >
      {liked ? "♥ Liked" : "♡ Like"} &middot; {count}
    </button>
  );
}
