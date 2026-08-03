import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isUsernameAvailable, isValidUsername } from "@/lib/data/users";

// Unauthenticated on purpose: signup needs to check this before a Firebase
// Auth account exists yet, and username availability isn't sensitive info.
export async function GET(request: NextRequest) {
  const username = (request.nextUrl.searchParams.get("u") ?? "")
    .trim()
    .toLowerCase();

  if (!isValidUsername(username)) {
    return NextResponse.json({ available: false });
  }

  const available = await isUsernameAvailable(username);
  return NextResponse.json({ available });
}
