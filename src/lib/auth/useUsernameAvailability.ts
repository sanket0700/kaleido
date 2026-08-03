"use client";

import { useEffect, useState } from "react";
import { isValidUsername } from "@/lib/data/usernamePattern";

export type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

/**
 * @param currentUsername - pass the signed-in user's existing username on
 * the edit-profile form so leaving the field unchanged doesn't show up as
 * "taken" (it's reserved by their own usernames/{username} doc).
 */
export function useUsernameAvailability(
  username: string,
  currentUsername?: string,
): UsernameStatus {
  const normalized = username.trim().toLowerCase();
  const isValidFormat = isValidUsername(normalized);
  const isUnchanged =
    currentUsername !== undefined &&
    normalized === currentUsername.trim().toLowerCase();

  const [result, setResult] = useState<{
    username: string;
    available: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isValidFormat || isUnchanged) return;

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
  }, [normalized, isValidFormat, isUnchanged]);

  if (!normalized) return "idle";
  if (!isValidFormat) return "invalid";
  if (isUnchanged) return "available";
  if (result?.username !== normalized) return "checking";
  return result.available ? "available" : "taken";
}
