"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadAvatar, updateProfile } from "@/lib/data/profileClient";
import { useUsernameAvailability } from "@/lib/auth/useUsernameAvailability";
import { UsernameStatusHint } from "@/components/username-status";
import { inputClass, primaryButtonClass } from "@/lib/ui/formClasses";

export function EditProfileForm({
  initialUsername,
  initialDisplayName,
  initialBio,
  initialPhotoURL,
}: {
  initialUsername: string;
  initialDisplayName: string;
  initialBio: string;
  initialPhotoURL: string | null;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialPhotoURL);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const usernameStatus = useUsernameAvailability(username, initialUsername);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      let photoURL: string | undefined;
      if (avatarFile) {
        photoURL = await uploadAvatar(avatarFile);
      }
      await updateProfile({ username, displayName, bio, photoURL });
      router.push(`/profile/${username}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save changes.");
      setSubmitting(false);
    }
  }

  const canSubmit = usernameStatus === "available" && displayName.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Edit profile
      </h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          {avatarPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <label className="cursor-pointer text-sm underline">
          Change photo
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </label>
      </div>

      <input
        type="text"
        required
        placeholder="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className={inputClass}
      />

      <div className="space-y-1">
        <input
          type="text"
          required
          autoComplete="off"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />
        <UsernameStatusHint status={usernameStatus} />
      </div>

      <textarea
        placeholder="Bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
        className={inputClass}
      />

      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className={primaryButtonClass}
      >
        {submitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
