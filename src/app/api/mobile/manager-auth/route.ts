// Yönetici / muhasebeci mobil girişi
// POST /api/mobile/manager-auth  { username, password }
import { NextRequest, NextResponse } from "next/server";
import { createManagerToken } from "@/lib/manager-token";
import { timingSafeEqual } from "crypto";
import { getClientIp } from "@/lib/get-client-ip";

export const dynamic = "force-dynamic";

// Basit in-memory rate limiter (process restart'ta sıfırlanır — yeterli koruma)
const attempts = new Map<string, { count: number; firstAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 dakika

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAt: now });
    return false;
  }
  if (entry.count >= MAX_ATTEMPTS) return true;
  entry.count++;
  return false;
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Çok fazla deneme. 15 dakika bekleyin." }, { status: 429 });
    }

    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Kullanıcı adı ve şifre zorunlu" }, { status: 400 });
    }

    // ENV'deki admin kullanıcılarını kontrol et (ADMIN1_USERNAME / ADMIN1_PASSWORD ... ADMIN5)
    let matched = false;
    for (let i = 1; i <= 5; i++) {
      const envUser = process.env[`ADMIN${i}_USERNAME`] ?? "";
      const envPass = process.env[`ADMIN${i}_PASSWORD`] ?? "";
      if (envUser && safeCompare(envUser, username) && safeCompare(envPass, password)) {
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
