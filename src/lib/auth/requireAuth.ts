import "server-only";

import type { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "@/lib/firebase/admin";

export class UnauthenticatedError extends Error {
  constructor(message = "Missing or invalid authorization.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export interface AuthResult {
  decoded: DecodedIdToken;
  /** The raw token string - only /api/auth/session needs this (to mint a
   * session cookie, which requires the original JWT, not just its claims)
   * but it's returned alongside decoded rather than making that one
   * caller re-parse the header itself and trust it matches what was just
   * validated here. */
  idToken: string;
}

/**
 * Reads the bearer token from the Authorization header and verifies it.
 * Every mutating Route Handler calls this first - the single place that
 * defines what "authenticated" means for the API, instead of the same
 * parse-token/verify/401 block copied into each route (which had already
 * drifted: one route returned 400 for a missing token, the other six
 * returned 401).
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) throw new UnauthenticatedError("Missing bearer token.");

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return { decoded, idToken };
  } catch {
    throw new UnauthenticatedError("Invalid or expired token.");
  }
}
