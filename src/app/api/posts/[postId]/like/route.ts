import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/lib/auth/requireAuth";
import { likePost, PostNotFoundError, unlikePost } from "@/lib/data/posts";

// PUT to like, DELETE to unlike - both idempotent, unlike the single
// toggling POST this used to be. A toggle isn't safe to retry (a
// double-click or a retried request flips state twice), and a request log
// showing POST .../like tells you nothing about which direction it went;
// PUT vs DELETE does, for free, from infra-level access logs alone.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;

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
    const { liked, likeCount } = await likePost(postId, decoded.uid);
    return NextResponse.json({ liked, likeCount });
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[PUT /api/posts/:postId/like]", { uid: decoded.uid, postId, err });
    return NextResponse.json({ error: "Failed to like post." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;

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
    const { liked, likeCount } = await unlikePost(postId, decoded.uid);
    return NextResponse.json({ liked, likeCount });
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[DELETE /api/posts/:postId/like]", { uid: decoded.uid, postId, err });
    return NextResponse.json({ error: "Failed to unlike post." }, { status: 500 });
  }
}
