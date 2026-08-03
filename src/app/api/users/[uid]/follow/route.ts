import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  CannotFollowSelfError,
  toggleFollow,
  UserNotFoundError,
} from "@/lib/data/follows";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid: targetUid } = await params;

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

  try {
    const { following } = await toggleFollow(decoded.uid, targetUid);
    return NextResponse.json({ following });
  } catch (err) {
    if (err instanceof CannotFollowSelfError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof UserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update follow status." },
      { status: 500 },
    );
  }
}
