import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { getActiveParent } from "@/lib/parent-auth";

export async function POST(req: NextRequest) {
  const h = await headers();
  const auth = h.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  const passenger = await getActiveParent(auth);
  if (!passenger) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pushToken } = await req.json().catch(() => ({}));
  if (typeof pushToken !== "string" || !/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/.test(pushToken) || pushToken.length > 256)
    return NextResponse.json({ error: "Geçerli pushToken zorunlu" }, { status: 400 });

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
