import { NextRequest, NextResponse } from "next/server";
import { getActiveManager } from "@/lib/manager-access";
import { encode } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer "))
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const manager = await getActiveManager(auth.slice(7).trim());
  if (!manager)
    return NextResponse.json(
      { error: "Geçersiz veya süresi dolmuş oturum" },
      { status: 401 },
    );
  const { id, name, role, companyId, companyType } = manager;
  const token = await encode({
    token: { sub: id, id, name, role, companyId, companyType },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 5 * 60,
  });
  return NextResponse.json({ token });
}
