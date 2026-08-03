import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { addComment, MAX_COMMENT_LENGTH, PostNotFoundError } from "@/lib/data/posts";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;

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
    console.error(err);
    return NextResponse.json(
      { error: "Failed to post comment." },
      { status: 500 },
    );
  }
}
