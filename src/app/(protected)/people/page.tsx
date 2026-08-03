import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { listOtherUsers } from "@/lib/data/users";
import { getFollowingIds } from "@/lib/data/follows";
import { FollowButton } from "@/components/follow-button";

// Phase-1 discovery mechanism: everyone else, most recently joined first.
// Full search is a later-phase feature.
export default async function PeoplePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null; // layout already redirects unauthenticated requests

  const [people, followingIds] = await Promise.all([
    listOtherUsers(sessionUser.uid),
    getFollowingIds(sessionUser.uid),
  ]);
  const followingSet = new Set(followingIds);

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <h1 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
        People
      </h1>
      {people.length === 0 && (
        <p className="text-sm text-zinc-500">No one else here yet.</p>
      )}
      <ul className="space-y-4">
        {people.map((person) => (
          <li key={person.uid} className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              {person.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.photoURL}
                  alt={person.username}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${person.username}`} className="block text-sm font-medium">
                {person.username}
              </Link>
              <p className="truncate text-sm text-zinc-500">{person.displayName}</p>
            </div>
            <FollowButton
              targetUid={person.uid}
              initialFollowing={followingSet.has(person.uid)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
