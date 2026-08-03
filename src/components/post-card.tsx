import Link from "next/link";
import type { Post } from "@/lib/data/posts";
import type { UserProfile } from "@/lib/data/users";

export function PostCard({
  post,
  author,
}: {
  post: Post;
  author: UserProfile | undefined;
}) {
  return (
    <article className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
      <div className="mb-2 flex items-center gap-3">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          {author?.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.photoURL}
              alt={author.username}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <Link href={`/profile/${author?.username ?? ""}`} className="text-sm font-medium">
          {author?.username ?? "unknown"}
        </Link>
      </div>

      <Link href={`/post/${post.id}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageURLs[0]}
          alt={post.caption || "Post image"}
          className="aspect-square w-full rounded-md object-cover"
        />
      </Link>

      {post.caption && (
        <p className="mt-2 text-sm">
          <span className="font-medium">{author?.username}</span> {post.caption}
        </p>
      )}
      <p className="mt-1 text-xs text-zinc-500">
        {post.likeCount} likes &middot; {post.commentCount} comments
      </p>
    </article>
  );
}
