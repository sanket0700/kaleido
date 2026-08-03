import type { UsernameStatus } from "@/lib/auth/useUsernameAvailability";

const LABEL: Record<UsernameStatus, string> = {
  idle: "",
  checking: "Checking...",
  available: "Available",
  taken: "Already taken",
  invalid: "3-30 characters: lowercase letters, numbers, . or _",
};

const COLOR: Record<UsernameStatus, string> = {
  idle: "",
  checking: "text-zinc-500",
  available: "text-green-600",
  taken: "text-red-600",
  invalid: "text-zinc-500",
};

export function UsernameStatusHint({ status }: { status: UsernameStatus }) {
  if (status === "idle") return null;
  return <p className={`text-xs ${COLOR[status]}`}>{LABEL[status]}</p>;
}
