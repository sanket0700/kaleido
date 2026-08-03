import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import {
  createPost,
  MAX_CAPTION_LENGTH,
  MAX_IMAGES_PER_POST,
} from "@/lib/data/posts";
import { isOwnStorageUrl } from "@/lib/storage/validateStorageUrl";

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

  const imageURLs = Array.isArray(body?.imageURLs) ? body.imageURLs : [];
  if (imageURLs.length === 0 || imageURLs.length > MAX_IMAGES_PER_POST) {
    return NextResponse.json(
      { error: `Post needs 1-${MAX_IMAGES_PER_POST} images.` },
      { status: 400 },
    );
  }
  const validatedURLs: string[] = [];
  for (const url of imageURLs) {
    if (
      typeof url !== "string" ||
      !isOwnStorageUrl(url, "posts", decoded.uid)
    ) {
      return NextResponse.json(
        { error: "Invalid image upload." },
        { status: 400 },
      );
    }
    validatedURLs.push(url);
  }

  const caption = String(body?.caption ?? "").trim().slice(0, MAX_CAPTION_LENGTH);

  try {
    const postId = await createPost(decoded.uid, validatedURLs, caption);
    return NextResponse.json({ ok: true, postId }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create post." },
      { status: 500 },
    );
  }
}
