import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth, UnauthenticatedError } from "@/lib/auth/requireAuth";
import { addComment, MAX_COMMENT_LENGTH, PostNotFoundError } from "@/lib/data/posts";

export async function POST(
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

  const body = await request.json().catch(() => null);
  const text = String(body?.text ?? "").trim().slice(0, MAX_COMMENT_LENGTH);
  if (!text) {
    return NextResponse.json(
      { error: "Comment can't be empty." },
      { status: 400 },
    );
  }

  try {
    const commentId = await addComment(postId, decoded.uid, text);
    return NextResponse.json({ ok: true, commentId }, { status: 201 });
  } catch (err) {
    if (err instanceof PostNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[POST /api/posts/:postId/comments]", { uid: decoded.uid, postId, err });
    return NextResponse.json(
      { error: "Failed to post comment." },
      { status: 500 },
    );
  }
}
