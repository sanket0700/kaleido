"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logIn } from "@/lib/auth/client";
import { firebaseErrorMessage } from "@/lib/auth/firebaseErrorMessage";
import { inputClass, primaryButtonClass } from "@/lib/ui/formClasses";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await logIn(email, password);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(firebaseErrorMessage(err, "Couldn't log in."));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        Log in to Kaleido
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
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClass}
      />
      <button type="submit" disabled={submitting} className={primaryButtonClass}>
        {submitting ? "Logging in..." : "Log in"}
      </button>
      <p className="text-sm text-zinc-500">
        No account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
