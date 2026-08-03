"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/lib/data/postsClient";
import { MAX_COMMENT_LENGTH } from "@/lib/data/postLimits";
import { inputClass } from "@/lib/ui/formClasses";

export function CommentForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      await addComment(postId, text);
      setText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-1">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
          className={`${inputClass} flex-1`}
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="shrink-0 text-sm font-medium text-black disabled:opacity-50 dark:text-zinc-50"
        >
          Post
        </button>
      </div>
    </form>
  );
}
