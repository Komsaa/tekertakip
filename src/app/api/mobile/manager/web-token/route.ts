// Mobil yönetici → web panel exchange token
// GET /api/mobile/manager/web-token  (Bearer: managerToken)
// Döner: { token } — 5 dakika geçerli, /api/panel/mobile-session ile kullanılır
import { NextRequest, NextResponse } from "next/server";
import { verifyManagerTokenFull } from "@/lib/manager-token";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const bearerToken = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!bearerToken) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const payload = verifyManagerTokenFull(bearerToken);
  if (!payload) return NextResponse.json({ error: "Geçersiz token" }, { status: 401 });

  const { username, companyId, role } = payload;
  const secret = process.env.NEXTAUTH_SECRET!;

  let id: string;
  let name: string;
  let companyType = "firma";

  if (role === "admin") {
    id = "admin";
    name = username;
  } else {
    const user = await prisma.panelUser.findFirst({
      where: { username: username.toLowerCase() },
      select: { id: true, name: true, company: { select: { type: true } } },
    });
    if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    id = user.id;
    name = user.name;
    companyType = user.company?.type ?? "firma";
  }

  const exchangeToken = await encode({
    token: {
      sub: id,
      id,
      name,
      role,
      companyId: companyId ?? null,
      companyType,
      exp: Math.floor(Date.now() / 1000) + 5 * 60,
    },
    secret,
    maxAge: 5 * 60,
  });

  return NextResponse.json({ token: exchangeToken });
}
