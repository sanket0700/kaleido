// No "server-only" guard here on purpose - shared between the server
// (src/lib/data/users.ts) and the client-side availability-check hook.
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

// Route segments this app actually uses under /profile/* and /* - a
// username matching one of these would be ambiguous with a real route
// (Next.js resolves the static route first, so that user's profile would
// simply be unreachable at /profile/<name>).
export const RESERVED_USERNAMES = new Set([
  "edit",
  "new",
  "settings",
  "admin",
  "api",
  "login",
  "signup",
  "logout",
  "feed",
  "people",
  "post",
  "posts",
  "profile",
  "complete-profile",
  "me",
]);

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username) && !RESERVED_USERNAMES.has(username);
}
