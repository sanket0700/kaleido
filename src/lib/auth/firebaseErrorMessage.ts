import { FirebaseError } from "firebase/app";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password.",
  "auth/wrong-password": "Invalid email or password.",
  "auth/user-not-found": "Invalid email or password.",
  "auth/email-already-in-use": "That email is already registered.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/invalid-email": "That doesn't look like a valid email address.",
  "auth/too-many-requests": "Too many attempts. Try again in a bit.",
};

export function firebaseErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof FirebaseError) {
    return MESSAGES[err.code] ?? fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
