import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriverFromHeaders } from "@/lib/mobile-auth";

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
  const driver = await getDriverFromHeaders();
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { routeId, date, attendances, nextStopId, isFirst } = await req.json();
  // attendances: [{ passengerId, status }]

  if (!routeId || !date || !Array.isArray(attendances)) {
    return NextResponse.json({ error: "routeId, date, attendances zorunlu" }, { status: 400 });
  }

  for (const a of attendances) {
    await prisma.tripAttendance.upsert({
      where: { passengerId_routeId_date: { passengerId: a.passengerId, routeId, date } },
      create: { passengerId: a.passengerId, routeId, driverId: driver.id, date, status: a.status },
      update: { status: a.status },
    });
  }

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
