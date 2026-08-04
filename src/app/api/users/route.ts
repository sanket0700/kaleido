import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/lib/auth/requireAuth";
import {
  createUserProfile,
  MAX_DISPLAY_NAME_LENGTH,
  ProfileExistsError,
  UsernameTakenError,
  isValidUsername,
} from "@/lib/data/users";

// Creates the Firestore profile doc for a just-signed-up Firebase Auth user.
// Firestore rules deny this write from the client entirely - it has to
// happen here so the username-uniqueness check and profile creation run
// inside one transaction (see src/lib/data/users.ts).
export async function POST(request: NextRequest) {
  let decoded;
  try {
    ({ decoded } = await requireAuth(request));
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const body = await request.json().catch(() => null);

  const username = String(body?.username ?? "").trim().toLowerCase();
  if (!isValidUsername(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-30 characters: lowercase letters, numbers, '.', '_'.",
      },
      { status: 400 },
    );
  }

  const displayName = String(body?.displayName ?? "")
    .trim()
    .slice(0, MAX_DISPLAY_NAME_LENGTH);
  if (!displayName) {
    return NextResponse.json(
      { error: "Display name is required." },
      { status: 400 },
    );
  }

  try {
    await createUserProfile(decoded.uid, username, displayName);
  } catch (err) {
    if (err instanceof UsernameTakenError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof ProfileExistsError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[POST /api/users]", { uid: decoded.uid, err });
    return NextResponse.json(
      { error: "Failed to create profile." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
