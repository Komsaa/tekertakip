import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getToken, encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getRole } from "@/lib/tenant";

const isSecure = process.env.NEXTAUTH_URL?.startsWith("https://");
const SESSION_COOKIE = isSecure
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";
const ORIG_COOKIE = "tt_orig";
const SECRET = process.env.NEXTAUTH_SECRET!;
const MAX_AGE = 30 * 24 * 60 * 60;

// POST /api/admin/impersonate — bir şirketin oturumuna gir
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || getRole(session) !== "admin") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { companyId } = await req.json();
  if (!companyId) {
    return NextResponse.json({ error: "companyId gerekli" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, type: true },
  });
  if (!company) {
    return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 404 });
  }

  const token = await getToken({ req, secret: SECRET });
  if (!token) {
    return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
  }

  if (token.impersonating) {
    return NextResponse.json(
      { error: "Zaten bir şirket görünümündesiniz. Önce çıkış yapın." },
      { status: 400 }
    );
  }

  // Orijinal tokeni sakla
  const originalEncoded = await encode({ token, secret: SECRET, maxAge: MAX_AGE });

  // İmpersonation tokeni oluştur
  const impToken = {
    ...token,
    companyId,
    companyType: company.type ?? "firma",
    impersonating: true,
    impersonatedCompanyName: company.name,
  };
  const impEncoded = await encode({ token: impToken, secret: SECRET, maxAge: MAX_AGE });

  const res = NextResponse.json({ ok: true, companyName: company.name });
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: !!isSecure,
  };
  res.cookies.set(ORIG_COOKIE, originalEncoded, cookieOpts);
  res.cookies.set(SESSION_COOKIE, impEncoded, { ...cookieOpts, maxAge: MAX_AGE });
  return res;
}

// DELETE /api/admin/impersonate — orijinal admin oturumuna dön
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || getRole(session) !== "admin") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const origEncoded = req.cookies.get(ORIG_COOKIE)?.value;
  if (!origEncoded) {
    return NextResponse.json({ error: "Orijinal oturum bulunamadı" }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: !!isSecure,
  };
  res.cookies.set(SESSION_COOKIE, origEncoded, { ...cookieOpts, maxAge: MAX_AGE });
  res.cookies.delete(ORIG_COOKIE);
  return res;
}
