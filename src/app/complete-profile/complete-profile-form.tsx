"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeProfile } from "@/lib/auth/client";
import { useUsernameAvailability } from "@/lib/auth/useUsernameAvailability";
import { UsernameStatusHint } from "@/components/username-status";
import { inputClass, primaryButtonClass } from "@/lib/ui/formClasses";

export function CompleteProfileForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const usernameStatus = useUsernameAvailability(username);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await completeProfile(username, displayName);
      router.push("/feed");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't finish setting up your profile.",
      );
      setSubmitting(false);
    }
  }

  const canSubmit = usernameStatus === "available" && displayName.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        One more step
      </h1>
      <p className="text-sm text-zinc-500">
        Your account was created, but we couldn&apos;t finish setting up your
        profile last time. Pick a username to continue.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
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
      <button
        type="submit"
        disabled={!canSubmit || submitting}
        className={primaryButtonClass}
      >
        {submitting ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}
