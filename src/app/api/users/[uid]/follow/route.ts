import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/lib/auth/requireAuth";
import {
  CannotFollowSelfError,
  followUser,
  unfollowUser,
  UserNotFoundError,
} from "@/lib/data/follows";

// PUT to follow, DELETE to unfollow - same idempotent-verb reasoning as
// the like endpoint.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid: targetUid } = await params;

  let decoded;
  try {
    ({ decoded } = await requireAuth(request));
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  try {
    await followUser(decoded.uid, targetUid);
    return NextResponse.json({ following: true });
  } catch (err) {
    if (err instanceof CannotFollowSelfError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof UserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[PUT /api/users/:uid/follow]", { uid: decoded.uid, targetUid, err });
    return NextResponse.json({ error: "Failed to follow user." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> },
) {
  const { uid: targetUid } = await params;

  let decoded;
  try {
    ({ decoded } = await requireAuth(request));
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  try {
    await unfollowUser(decoded.uid, targetUid);
    return NextResponse.json({ following: false });
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[DELETE /api/users/:uid/follow]", { uid: decoded.uid, targetUid, err });
    return NextResponse.json({ error: "Failed to unfollow user." }, { status: 500 });
  }
}
