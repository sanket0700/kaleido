import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/lib/auth/requireAuth";
import {
  createSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
} from "@/lib/auth/session";

// Shared by both login and signup: the client authenticates with Firebase
// Auth directly (createUserWithEmailAndPassword / signInWithEmailAndPassword),
// then hands the resulting ID token here (as a Bearer header, verified by
// requireAuth) to be exchanged for an httpOnly session cookie. Verifying
// the token before minting a cookie stops a forged/expired token from
// ever producing a valid session.
export async function POST(request: NextRequest) {
  let idToken: string;
  try {
    ({ idToken } = await requireAuth(request));
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const sessionCookie = await createSessionCookie(idToken);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: SESSION_MAX_AGE_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
