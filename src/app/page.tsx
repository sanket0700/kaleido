import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/data/users";
import { primaryButtonClass } from "@/lib/ui/formClasses";

export default async function Home() {
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    const profile = await getUserProfile(sessionUser.uid);
    redirect(profile ? "/feed" : "/complete-profile");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-sm flex-col items-center gap-6 px-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Kaleido
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Share your world, in color.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Link href="/signup" className={`${primaryButtonClass} text-center`}>
            Sign up
          </Link>
          <Link
            href="/login"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-center text-sm font-medium text-black dark:border-zinc-700 dark:text-zinc-50"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
