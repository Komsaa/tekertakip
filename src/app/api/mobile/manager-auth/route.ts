// Yönetici / muhasebeci mobil girişi
// POST /api/mobile/manager-auth  { username, password }
import { NextRequest, NextResponse } from "next/server";
import { createManagerToken } from "@/lib/manager-token";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Kullanıcı adı ve şifre zorunlu" }, { status: 400 });
    }

    // ENV'deki admin kullanıcılarını kontrol et (ADMIN1_USERNAME / ADMIN1_PASSWORD ... ADMIN5)
    let matched = false;
    for (let i = 1; i <= 5; i++) {
      const envUser = process.env[`ADMIN${i}_USERNAME`];
      const envPass = process.env[`ADMIN${i}_PASSWORD`];
      if (envUser && envPass && envUser === username && envPass === password) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
    }

    const token = createManagerToken(username);
    return NextResponse.json({ token, username, role: "manager" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
