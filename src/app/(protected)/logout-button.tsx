"use client";

import { useRouter } from "next/navigation";
import { logOut } from "@/lib/auth/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleClick() {
    await logOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      className="text-zinc-500 hover:text-black dark:hover:text-zinc-50"
    >
      Log out
    </button>
  );
}
