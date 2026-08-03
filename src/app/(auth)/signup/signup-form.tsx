"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, ProfileCreationFailedError } from "@/lib/auth/client";
import { firebaseErrorMessage } from "@/lib/auth/firebaseErrorMessage";
import { useUsernameAvailability } from "@/lib/auth/useUsernameAvailability";
import { UsernameStatusHint } from "@/components/username-status";
import { inputClass, primaryButtonClass } from "@/lib/ui/formClasses";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await signUp(email, password, username, displayName);
      router.push("/feed");
      router.refresh();
    } catch (err) {
      if (err instanceof ProfileCreationFailedError) {
        // Firebase Auth account + session already exist; only the profile
        // doc creation failed (e.g. a last-second username collision).
        router.push("/complete-profile");
        return;
      }
      setError(firebaseErrorMessage(err, "Couldn't sign up."));
      setSubmitting(false);
    }
  }

  const canSubmit =
    usernameStatus === "available" &&
    displayName.trim().length > 0 &&
    password.length >= 6 &&
    email.length > 0;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Join Kaleido
      </h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        type="email"
        required
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
      />
      <input
        type="password"
        required
        autoComplete="new-password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClass}
      />
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
        {submitting ? "Creating account..." : "Sign up"}
      </button>
      <p className="text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
