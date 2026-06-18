// Tek giriş noktası — kullanıcı adı/şifreye göre rol otomatik belirlenir
// Sıra: sürücü → veli → yönetici
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createManagerToken } from "@/lib/manager-token";
import { randomUUID } from "crypto";
import { timingSafeEqual, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { getClientIp } from "@/lib/get-client-ip";

export const dynamic = "force-dynamic";

// Rate limiting
const attempts = new Map<string, { count: number; firstAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

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

    const u = username.trim();
    const p = password.trim();

    // ── 1. Sürücü ────────────────────────────────────────────────────────────
    const driver = await prisma.driver.findFirst({
      where: { status: "active", mobileUsername: { equals: u, mode: "insensitive" } },
      select: {
        id: true, name: true, mobilePin: true,
        vehicles: { include: { vehicle: { select: { id: true, plate: true } } } },
        company: { select: { name: true, active: true } },
      },
    });

    if (driver?.mobilePin) {
      let pinValid = false;
      if (driver.mobilePin.startsWith("$2")) {
        pinValid = await bcrypt.compare(p, driver.mobilePin);
      } else {
        pinValid = driver.mobilePin === p;
        if (pinValid) {
          const hash = await bcrypt.hash(p, 10);
          await prisma.driver.update({ where: { id: driver.id }, data: { mobilePin: hash } });
        }
      }

      if (pinValid) {
        if (driver.company && !driver.company.active) {
          return NextResponse.json({ error: "Bu işletmenin erişimi askıya alınmış" }, { status: 403 });
        }
        const token = randomUUID();
        await prisma.driver.update({
          where: { id: driver.id },
          data: { mobileToken: token, mobileTokenAt: new Date() },
        });
        return NextResponse.json({
          role: "driver",
          token,
          driver: { id: driver.id, name: driver.name, vehicle: driver.vehicles?.[0]?.vehicle ?? null, vehicles: driver.vehicles?.map(dv => dv.vehicle) ?? [], companyName: driver.company?.name ?? null },
        });
      }
    }

    // ── 2. Veli ──────────────────────────────────────────────────────────────
    const passenger = await prisma.routePassenger.findUnique({
      where: { veliUsername: u.toLowerCase() },
      include: {
        stop: { include: { route: { include: { stops: { orderBy: { order: "asc" } } } } } },
      },
    });

    if (passenger?.veliPasswordHash && passenger.active) {
      const valid = await bcrypt.compare(p, passenger.veliPasswordHash);
      if (valid) {
        const route = passenger.stop.route;
        const company = await prisma.company.findUnique({
          where: { id: route.companyId ?? "" },
          select: { active: true, name: true },
        });
        if (company && !company.active) {
          return NextResponse.json({ error: "Bu işletmenin erişimi askıya alınmış" }, { status: 403 });
        }
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        const token = `${randomBytes(24).toString("hex")}|${expiresAt}`;
        await prisma.routePassenger.update({ where: { id: passenger.id }, data: { veliToken: token } });
        return NextResponse.json({
          role: "veli",
          token,
          passenger: { id: passenger.id, name: passenger.name },
          stop: { id: passenger.stop.id, name: passenger.stop.name, order: passenger.stop.order, estimatedTime: passenger.stop.estimatedTime },
          route: { id: route.id, name: route.name, totalStops: route.stops.length },
        });
      }
    }

    // ── 3. Yönetici ──────────────────────────────────────────────────────────
    for (let i = 1; i <= 5; i++) {
      const envUser = process.env[`ADMIN${i}_USERNAME`] ?? "";
      const envPass = process.env[`ADMIN${i}_PASSWORD`] ?? "";
      if (envUser && safeCompare(envUser, u) && safeCompare(envPass, p)) {
        const token = createManagerToken(u);
        return NextResponse.json({ role: "manager", token, username: u });
      }
    }

    return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
