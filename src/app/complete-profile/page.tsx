import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/data/users";
import { CompleteProfileForm } from "./complete-profile-form";

export default async function CompleteProfilePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const profile = await getUserProfile(sessionUser.uid);
  if (profile) redirect("/feed");

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <CompleteProfileForm />
    </div>
  );
}
