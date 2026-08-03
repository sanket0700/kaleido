"use client";

import { useEffect, useState } from "react";
import { USERNAME_PATTERN } from "@/lib/data/usernamePattern";

export type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

export function useUsernameAvailability(username: string): UsernameStatus {
  const normalized = username.trim().toLowerCase();
  const isValidFormat = USERNAME_PATTERN.test(normalized);

  const [result, setResult] = useState<{
    username: string;
    available: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isValidFormat) return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/users/username-available?u=${encodeURIComponent(normalized)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setResult({ username: normalized, available: data.available });
      } catch {
        // aborted (user kept typing) or a network blip - next keystroke
        // triggers another check, nothing to reconcile here
      }
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [normalized, isValidFormat]);

  if (!normalized) return "idle";
  if (!isValidFormat) return "invalid";
  if (result?.username !== normalized) return "checking";
  return result.available ? "available" : "taken";
}
