// Tek giriş noktası — kullanıcı adı/şifreye göre rol otomatik belirlenir
// Sıra: sürücü → veli → yönetici
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createManagerToken } from "@/lib/manager-token";
import { randomUUID } from "crypto";
import { randomBytes } from "crypto";
import {
  safeCompare,
  parseLogin,
  companyAccessError,
} from "@/lib/access-policy";
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

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Çok fazla deneme. 15 dakika bekleyin." },
        { status: 429 },
      );
    }

    const credentials = parseLogin(await req.json().catch(() => null));
    if (!credentials) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve şifre zorunlu" },
        { status: 400 },
      );
    }

    const u = credentials.username;
    const p = credentials.password;

    // ── 1. Sürücü ────────────────────────────────────────────────────────────
    const driver = await prisma.driver.findFirst({
      where: {
        status: "active",
        mobileUsername: { equals: u, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        mobilePin: true,
        vehicles: {
          include: { vehicle: { select: { id: true, plate: true } } },
        },
        company: {
          select: {
            name: true,
            active: true,
            isDemo: true,
            demoExpiresAt: true,
          },
        },
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
          await prisma.driver.update({
            where: { id: driver.id },
            data: { mobilePin: hash },
          });
        }
      }

      if (pinValid) {
        const accessError = companyAccessError(driver.company);
        if (accessError)
          return NextResponse.json({ error: accessError }, { status: 403 });
        const token = randomUUID();
        await prisma.driver.update({
          where: { id: driver.id },
          data: { mobileToken: token, mobileTokenAt: new Date() },
        });
        return NextResponse.json({
          role: "driver",
          token,
          driver: {
            id: driver.id,
            name: driver.name,
            vehicle: driver.vehicles?.[0]?.vehicle ?? null,
            vehicles: driver.vehicles?.map((dv) => dv.vehicle) ?? [],
            companyName: driver.company?.name ?? null,
          },
        });
      }
    }

    // ── 2. Veli ──────────────────────────────────────────────────────────────
    const passenger = await prisma.routePassenger.findUnique({
      where: { veliUsername: u.toLowerCase() },
      include: {
        stop: {
          include: {
            route: { include: { stops: { orderBy: { order: "asc" } } } },
          },
        },
      },
    });

    if (passenger?.veliPasswordHash && passenger.active) {
      const valid = await bcrypt.compare(p, passenger.veliPasswordHash);
      if (valid) {
        const route = passenger.stop.route;
        if (!route.active) return NextResponse.json({ error: "Güzergah pasif" }, { status: 403 });
        const company = await prisma.company.findUnique({
          where: { id: route.companyId ?? "" },
          select: {
            active: true,
            name: true,
            isDemo: true,
            demoExpiresAt: true,
          },
        });
        const accessError = companyAccessError(company);
        if (accessError)
          return NextResponse.json({ error: accessError }, { status: 403 });
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        const token = `${randomBytes(24).toString("hex")}|${expiresAt}`;
        await prisma.routePassenger.update({
          where: { id: passenger.id },
          data: { veliToken: token },
        });
        return NextResponse.json({
          role: "veli",
          token,
          passenger: { id: passenger.id, name: passenger.name },
          stop: {
            id: passenger.stop.id,
            name: passenger.stop.name,
            order: passenger.stop.order,
            estimatedTime: passenger.stop.estimatedTime,
          },
          route: {
            id: route.id,
            name: route.name,
            totalStops: route.stops.length,
          },
        });
      }
    }

    // ── 3. Yönetici (env) ────────────────────────────────────────────────────
    for (let i = 1; i <= 5; i++) {
      const envUser = process.env[`ADMIN${i}_USERNAME`] ?? "";
      const envPass = process.env[`ADMIN${i}_PASSWORD`] ?? "";
      if (
        envUser &&
        envPass &&
        safeCompare(envUser, u) &&
        safeCompare(envPass, p)
      ) {
        const token = createManagerToken(u);
        return NextResponse.json({ role: "manager", token, username: u });
      }
    }

    // ── 4. Panel kullanıcısı mobil girişi (mobileUsername + mobilePin) ──────
    const panelUserMobile = await prisma.panelUser.findFirst({
      where: { mobileUsername: { equals: u.toLowerCase() }, active: true },
      select: {
        username: true,
        name: true,
        mobilePin: true,
        role: true,
        companyId: true,
      },
    });
    if (panelUserMobile?.mobilePin) {
      const mobileValid = panelUserMobile.mobilePin.startsWith("$2")
        ? await bcrypt.compare(p, panelUserMobile.mobilePin)
        : safeCompare(panelUserMobile.mobilePin, p);
      if (mobileValid) {
        if (panelUserMobile.companyId || panelUserMobile.role !== "admin") {
          const company = panelUserMobile.companyId
            ? await prisma.company.findUnique({
                where: { id: panelUserMobile.companyId },
                select: { active: true, isDemo: true, demoExpiresAt: true },
              })
            : null;
          const accessError = companyAccessError(company);
          if (accessError)
            return NextResponse.json({ error: accessError }, { status: 403 });
        }
        const token = createManagerToken(panelUserMobile.username, {
          companyId: panelUserMobile.companyId,
          role: panelUserMobile.role,
        });
        return NextResponse.json({
          role: "manager",
          token,
          username: panelUserMobile.name,
        });
      }
    }

    // ── 5. Panel kullanıcısı web şifresi ────────────────────────────────────
    const panelUser = await prisma.panelUser.findFirst({
      where: { username: { equals: u.toLowerCase() }, active: true },
      select: {
        username: true,
        name: true,
        passwordHash: true,
        role: true,
        companyId: true,
      },
    });
    if (panelUser) {
      const valid = await bcrypt.compare(p, panelUser.passwordHash);
      if (valid) {
        if (panelUser.companyId || panelUser.role !== "admin") {
          const company = panelUser.companyId
            ? await prisma.company.findUnique({
                where: { id: panelUser.companyId },
                select: { active: true, isDemo: true, demoExpiresAt: true },
              })
            : null;
          const accessError = companyAccessError(company);
          if (accessError)
            return NextResponse.json({ error: accessError }, { status: 403 });
        }
        const token = createManagerToken(panelUser.username, {
          companyId: panelUser.companyId,
          role: panelUser.role,
        });
        return NextResponse.json({
          role: "manager",
          token,
          username: panelUser.name,
        });
      }
    }

    return NextResponse.json(
      { error: "Kullanıcı adı veya şifre hatalı" },
      { status: 401 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
