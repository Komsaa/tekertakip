// Mobil → web panel oturum köprüsü
// GET /api/panel/mobile-session?t=EXCHANGE_TOKEN
// Exchange token'ı NextAuth session cookie'ye çevirir, /panel'e yönlendirir
import { NextRequest, NextResponse } from "next/server";
import { decode, encode } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const t = searchParams.get("t");
  if (!t) return NextResponse.redirect(new URL("/login", req.url));

  const secret = process.env.NEXTAUTH_SECRET!;

  try {
    const token = await decode({ token: t, secret });
    if (!token || !token.exp || Date.now() / 1000 > (token.exp as number)) {
      return NextResponse.redirect(new URL("/login?error=SessionExpired", req.url));
    }

    const sessionToken = await encode({
      token: {
        sub: token.sub,
        id: token.id,
        name: token.name,
        role: token.role,
        companyId: (token as any).companyId ?? null,
        companyType: (token as any).companyType ?? "firma",
      },
      secret,
      maxAge: 30 * 24 * 60 * 60,
    });

    const response = NextResponse.redirect(new URL("/mobil", req.url));
    const isProd = process.env.NODE_ENV === "production";
    const cookieName = isProd
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/login?error=InvalidToken", req.url));
  }
}
