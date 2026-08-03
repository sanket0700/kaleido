import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  createUserProfile,
  ProfileExistsError,
  UsernameTakenError,
  USERNAME_PATTERN,
} from "@/lib/data/users";

// Creates the Firestore profile doc for a just-signed-up Firebase Auth user.
// Firestore rules deny this write from the client entirely - it has to
// happen here so the username-uniqueness check and profile creation run
// inside one transaction (see src/lib/data/users.ts).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const idToken = body?.idToken;
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }

  const username = String(body?.username ?? "").trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-30 characters: lowercase letters, numbers, '.', '_'.",
      },
      { status: 400 },
    );
  }

  const displayName = String(body?.displayName ?? "").trim().slice(0, 60);
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
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create profile." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
