import { getSessionUser } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/data/users";

// Placeholder - the real following-based feed query lands in a later step.
export default async function FeedPage() {
  const sessionUser = await getSessionUser();
  const profile = sessionUser ? await getUserProfile(sessionUser.uid) : null;

  return (
    <div className="p-6">
      <p className="text-zinc-600 dark:text-zinc-400">
        Welcome, {profile?.displayName ?? "there"}. Your feed will show up
        here once posts and follows are wired up.
      </p>
    </div>
  );
}
