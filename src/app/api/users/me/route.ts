import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  getUserProfile,
  isValidUsername,
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  ProfileNotFoundError,
  updateUserProfile,
  UsernameTakenError,
} from "@/lib/data/users";
import { isOwnStorageUrl } from "@/lib/storage/validateStorageUrl";

export async function PATCH(request: NextRequest) {
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

  const bio = String(body?.bio ?? "").trim().slice(0, MAX_BIO_LENGTH);

  const currentProfile = await getUserProfile(decoded.uid);
  if (!currentProfile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  // photoURL is only present in the body when a new avatar was just
  // uploaded - otherwise keep whatever's already on the profile so a plain
  // "edit my bio" save doesn't wipe the avatar.
  let photoURL = currentProfile.photoURL;
  if (typeof body?.photoURL === "string") {
    if (!isOwnStorageUrl(body.photoURL, "avatars", decoded.uid)) {
      return NextResponse.json(
        { error: "Invalid avatar upload." },
        { status: 400 },
      );
    }
    photoURL = body.photoURL;
  }

  try {
    await updateUserProfile(decoded.uid, {
      username,
      displayName,
      bio,
      photoURL,
    });
  } catch (err) {
    if (err instanceof UsernameTakenError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof ProfileNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
