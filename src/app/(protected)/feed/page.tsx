import { getSessionUser } from "@/lib/auth/session";
import { getFollowingIds } from "@/lib/data/follows";
import { getPostsByAuthors } from "@/lib/data/posts";
import { getUserProfiles } from "@/lib/data/users";
import { PostCard } from "@/components/post-card";

export default async function FeedPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null; // layout already redirects unauthenticated requests

  const followingIds = await getFollowingIds(sessionUser.uid);
  const posts = await getPostsByAuthors(followingIds);
  const authors = await getUserProfiles(posts.map((post) => post.authorId));

  if (posts.length === 0) {
    return (
      <div className="p-6">
        <p className="text-zinc-600 dark:text-zinc-400">
          {followingIds.length === 0
            ? "Follow some people to see their posts here."
            : "No posts yet from people you follow."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} author={authors.get(post.authorId)} />
      ))}
    </div>
  );
}
