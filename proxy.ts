import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

export default async function proxy(req: NextRequest) {
  const cookie = req.cookies.get("buddy_session")?.value;
  const session = await decrypt(cookie);

  if (!session?.authenticated) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
