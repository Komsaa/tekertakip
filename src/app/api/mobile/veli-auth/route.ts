import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { companyAccessError, parseLogin } from "@/lib/access-policy";

export async function POST(req: NextRequest) {
  const credentials = parseLogin(await req.json().catch(() => null));
  if (!credentials) {
    return NextResponse.json({ error: "Kullanıcı adı ve şifre zorunlu" }, { status: 400 });
  }
  const { username, password } = credentials;

  const passenger = await prisma.routePassenger.findUnique({
    where: { veliUsername: username.trim().toLowerCase() },
    include: {
      stop: {
        include: {
          route: {
            include: {
              stops: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!passenger || !passenger.veliPasswordHash) {
    return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
  }

  if (!passenger.active) {
    return NextResponse.json({ error: "Bu hesap pasif durumda" }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, passenger.veliPasswordHash);
  if (!valid) {
    return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
  }

  // Şirket aktiflik kontrolü
  const route = passenger.stop.route;
  const company = await prisma.company.findUnique({
    where: { id: route.companyId ?? "" },
    select: { active: true, name: true, isDemo: true, demoExpiresAt: true },
  });
  if (!route.active || companyAccessError(company)) {
    return NextResponse.json({ error: "Bu işletmenin erişimi askıya alınmış" }, { status: 403 });
  }

  // Her girişte yeni token oluştur — 30 günlük expiry token içine gömülü
  const { randomBytes } = await import("crypto");
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const token = `${randomBytes(24).toString("hex")}|${expiresAt}`;
  await prisma.routePassenger.update({ where: { id: passenger.id }, data: { veliToken: token } });

  return NextResponse.json({
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
    company: { name: company?.name ?? "" },
  });
}
