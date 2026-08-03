import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getComments, getPost, isLikedByUser } from "@/lib/data/posts";
import { getUserProfiles } from "@/lib/data/users";
import { LikeButton } from "./like-button";
import { CommentForm } from "./comment-form";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await getPost(postId);
  if (!post) notFound();

  const sessionUser = await getSessionUser();
  if (!sessionUser) return null; // layout already redirects unauthenticated requests

  const [comments, liked] = await Promise.all([
    getComments(postId),
    isLikedByUser(postId, sessionUser.uid),
  ]);

  const authors = await getUserProfiles([
    post.authorId,
    ...comments.map((comment) => comment.authorId),
  ]);
  const author = authors.get(post.authorId);

  return (
    <div className="mx-auto w-full max-w-md p-6">
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

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.imageURLs[0]}
        alt={post.caption || "Post image"}
        className="aspect-square w-full rounded-md object-cover"
      />

      <div className="mt-3">
        <LikeButton postId={post.id} initialLiked={liked} initialCount={post.likeCount} />
      </div>

      {post.caption && (
        <p className="mt-2 text-sm">
          <span className="font-medium">{author?.username}</span> {post.caption}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {comments.length === 0 && (
          <p className="text-sm text-zinc-500">No comments yet.</p>
        )}
        {comments.map((comment) => (
          <p key={comment.id} className="text-sm">
            <span className="font-medium">
              {authors.get(comment.authorId)?.username ?? "unknown"}
            </span>{" "}
            {comment.text}
          </p>
        ))}
      </div>

      <CommentForm postId={post.id} />
    </div>
  );
}
