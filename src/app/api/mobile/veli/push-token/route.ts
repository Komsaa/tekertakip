import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const h = await headers();
  const auth = h.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pushToken } = await req.json();
  if (!pushToken) return NextResponse.json({ error: "pushToken zorunlu" }, { status: 400 });

  // Token expiry kontrolü
  const expiresAt = parseInt(token.split("|")[1] ?? "0");
  if (expiresAt && Date.now() > expiresAt) {
    return NextResponse.json({ error: "Oturum süresi doldu" }, { status: 401 });
  }

  await prisma.routePassenger.update({
    where: { veliToken: token },
    data: { parentPushToken: pushToken },
  });

  return NextResponse.json({ success: true });
}
