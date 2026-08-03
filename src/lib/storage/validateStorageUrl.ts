import "server-only";

const PROD_HOST = "firebasestorage.googleapis.com";

/**
 * Checks that a Firebase Storage download URL actually points at
 * <pathPrefix>/<uid>/... in this project's own bucket, before a Route
 * Handler trusts a client-supplied URL and persists it to Firestore.
 * storage.rules already stops a bad upload from landing in the bucket at
 * all (owner-scoped path); this stops a bad *URL* - pointing at someone
 * else's object, or an arbitrary external URL - from landing in Firestore.
 */
export function isOwnStorageUrl(
  url: string,
  pathPrefix: string,
  uid: string,
): boolean {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const allowedHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST
    ? process.env.FIREBASE_STORAGE_EMULATOR_HOST.split(":")[0]
    : PROD_HOST;
  if (parsed.hostname !== allowedHost) return false;

  const objectPathPrefix = `/v0/b/${bucket}/o/`;
  if (!parsed.pathname.startsWith(objectPathPrefix)) return false;

  const objectPath = decodeURIComponent(
    parsed.pathname.slice(objectPathPrefix.length),
  );
  return objectPath.startsWith(`${pathPrefix}/${uid}/`);
}
