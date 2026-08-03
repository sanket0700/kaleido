import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/data/users";
import { EditProfileForm } from "./edit-profile-form";

export default async function EditProfilePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const profile = await getUserProfile(sessionUser.uid);
  if (!profile) redirect("/complete-profile");

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <EditProfileForm
        initialUsername={profile.username}
        initialDisplayName={profile.displayName}
        initialBio={profile.bio}
        initialPhotoURL={profile.photoURL}
      />
    </div>
  );
}
