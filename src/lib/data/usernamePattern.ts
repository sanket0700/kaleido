// No "server-only" guard here on purpose - shared between the server
// (src/lib/data/users.ts) and the client-side availability-check hook.
export const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;
