import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const authHandler = NextAuth(authOptions);

export async function POST(req: NextRequest, ctx: any) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(`auth:${ip}`, 20, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many authentication attempts. Please try again later." },
      { status: 429 }
    );
  }
  return authHandler(req, ctx);
}

export { authHandler as GET };
