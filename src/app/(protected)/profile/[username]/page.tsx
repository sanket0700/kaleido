import { notFound } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getUserProfileByUsername } from "@/lib/data/users";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getUserProfileByUsername(username);
  if (!profile) notFound();

  const sessionUser = await getSessionUser();
  const isOwnProfile = sessionUser?.uid === profile.uid;

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <div className="flex items-center gap-6">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          {profile.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoURL}
              alt={profile.username}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            {profile.username}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {profile.displayName}
          </p>
          {profile.bio && <p className="mt-1 text-sm">{profile.bio}</p>}
        </div>
        {isOwnProfile && (
          <Link href="/profile/edit" className="ml-auto shrink-0 text-sm underline">
            Edit profile
          </Link>
        )}
      </div>
      <div className="mt-6 flex gap-6 text-sm text-zinc-600 dark:text-zinc-400">
        <span>
          <strong className="text-black dark:text-zinc-50">
            {profile.postCount}
          </strong>{" "}
          posts
        </span>
        <span>
          <strong className="text-black dark:text-zinc-50">
            {profile.followerCount}
          </strong>{" "}
          followers
        </span>
        <span>
          <strong className="text-black dark:text-zinc-50">
            {profile.followingCount}
          </strong>{" "}
          following
        </span>
      </div>
    </div>
  );
}
