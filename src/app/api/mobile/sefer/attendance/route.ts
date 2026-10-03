import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriverFromRequest } from "@/lib/mobile-auth";

async function sendPushNotifications(tokens: string[], title: string, body: string) {
  const messages = tokens.map((to) => ({ to, title, body, sound: "default" }));
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
  } catch { /* bildirim hatası seferi engellemesin */ }
}

// Bir duraktaki tüm yolcuların yoklamasını kaydet
// nextStopId varsa o durağın velilerine bildirim gönderir
export async function POST(req: NextRequest) {
  const driver = await getDriverFromRequest(req);
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { routeId, date, attendances, nextStopId, isFirst } = await req.json().catch(() => ({}));
  // attendances: [{ passengerId, status }]

  if (typeof routeId !== "string" || !routeId || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || !Array.isArray(attendances) || attendances.length > 500 || attendances.some(a => !a || typeof a.passengerId !== "string" || !["boarded", "absent"].includes(a.status)) || (nextStopId != null && typeof nextStopId !== "string") || (isFirst != null && typeof isFirst !== "boolean")) {
    return NextResponse.json({ error: "routeId, date, attendances zorunlu" }, { status: 400 });
  }

  const allowedRoute = await prisma.route.findFirst({
    where: { id: routeId, driverId: driver.id, companyId: driver.companyId, active: true },
    include: { stops: { include: { passengers: { where: { active: true }, select: { id: true } } } } },
  });
  if (!allowedRoute) return NextResponse.json({ error: "Güzergah bulunamadı" }, { status: 404 });
  const allowedPassengers = new Set(allowedRoute.stops.flatMap(s => s.passengers.map(p => p.id)));
  if (attendances.some(a => !allowedPassengers.has(a.passengerId)) || new Set(attendances.map(a => a.passengerId)).size !== attendances.length || (nextStopId && !allowedRoute.stops.some(s => s.id === nextStopId))) {
    return NextResponse.json({ error: "Yolcu veya durak bu güzergaha ait değil" }, { status: 400 });
  }
  await prisma.$transaction(attendances.map(a => prisma.tripAttendance.upsert({
      where: { passengerId_routeId_date: { passengerId: a.passengerId, routeId, date } },
      create: { passengerId: a.passengerId, routeId, driverId: driver.id, date, status: a.status },
      update: { status: a.status },
    })));

  // Sefer ilk kez başlıyorsa tüm velilere bildirim
  if (isFirst) {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: { stops: { include: { passengers: { where: { active: true, parentPushToken: { not: null } } } } } },
    });
    if (route) {
      const allTokens = route.stops
        .flatMap((s) => s.passengers)
        .map((p) => p.parentPushToken!)
        .filter(Boolean);
      if (allTokens.length > 0) {
        await sendPushNotifications(allTokens, "🚌 Servis Hareket Etti", `${route.name} seferiniz başladı`);
      }
    }
  }

  // "Bindi" işaretlenen yolcuların velilerine bildirim
  const boardedIds = attendances.filter((a: { passengerId: string; status: string }) => a.status === "boarded").map((a: { passengerId: string }) => a.passengerId);
  if (boardedIds.length > 0) {
    const boardedPassengers = await prisma.routePassenger.findMany({
      where: { id: { in: boardedIds }, parentPushToken: { not: null } },
    });
    for (const p of boardedPassengers) {
      await sendPushNotifications(
        [p.parentPushToken!],
        "✅ Servise Bindi",
        `${p.name} servise bindi`
      );
    }
  }

  // "Gelmedi" işaretlenen yolcuların velilerine bildirim
  const absentIds = attendances.filter((a: { passengerId: string; status: string }) => a.status === "absent").map((a: { passengerId: string }) => a.passengerId);
  if (absentIds.length > 0) {
    const absentPassengers = await prisma.routePassenger.findMany({
      where: { id: { in: absentIds }, parentPushToken: { not: null } },
    });
    for (const p of absentPassengers) {
      await sendPushNotifications(
        [p.parentPushToken!],
        "⚠️ Servise Binmedi",
        `${p.name} bugün durağında servise binmedi`
      );
    }
  }

  // Sıradaki durağın velilerine bildirim
  if (nextStopId) {
    const nextStop = await prisma.routeStop.findUnique({
      where: { id: nextStopId },
      include: {
        passengers: { where: { active: true, parentPushToken: { not: null } } },
        route: true,
      },
    });
    if (nextStop) {
      const tokens = nextStop.passengers.map((p) => p.parentPushToken!).filter(Boolean);
      if (tokens.length > 0) {
        await sendPushNotifications(
          tokens,
          "⏱ Servis Yaklaşıyor",
          `${nextStop.route.name} — Servis birkaç dakika içinde ${nextStop.name} durağında`
        );
      }
    }
  }

  return NextResponse.json({ success: true });
}
