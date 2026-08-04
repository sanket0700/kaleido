import { getAdminAuth } from "@/lib/firebase/admin";
import { createUserProfile } from "@/lib/data/users";

let counter = 0;

/** Short, unique, lowercase alphanumeric+underscore token - safe to drop
 * into an email local-part or a username (which only allows
 * [a-z0-9_.]{3,30}). */
export function unique(): string {
  counter += 1;
  return `${Date.now()}_${counter}`;
}

/** Just a Firebase Auth user - no Firestore profile. For tests that need
 * to exercise profile *creation* itself (e.g. duplicate-username
 * rejection), which a pre-made profile would short-circuit. */
export async function createAuthUser(): Promise<{ uid: string; suggestedUsername: string }> {
  const suffix = unique();
  const user = await getAdminAuth().createUser({ email: `test_${suffix}@example.com` });
  return { uid: user.uid, suggestedUsername: `user_${suffix}` };
}

/** A real Auth user with a real Firestore profile already created via the
 * same createUserProfile the rest of the app uses - the standard fixture
 * for tests that just need "an existing user", not testing creation
 * itself. */
export async function createTestUser(
  displayName = "Test User",
): Promise<{ uid: string; username: string }> {
  const { uid, suggestedUsername } = await createAuthUser();
  await createUserProfile(uid, suggestedUsername, displayName);
  return { uid, username: suggestedUsername };
}
