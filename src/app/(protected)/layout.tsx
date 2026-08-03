import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/data/users";
import { LogoutButton } from "./logout-button";

// The real auth boundary for every route under this layout - proxy.ts only
// does a cheap cookie-presence redirect for snappy UX, this is the check
// that actually verifies the session and that a profile exists.
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const profile = await getUserProfile(sessionUser.uid);
  if (!profile) redirect("/complete-profile");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <nav className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <Link href="/feed" className="text-lg font-semibold">
          Kaleido
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/post/new">New post</Link>
          <Link href="/people">People</Link>
          <Link href={`/profile/${profile.username}`}>{profile.username}</Link>
          <LogoutButton />
        </div>
      </nav>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
