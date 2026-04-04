export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Haversine mesafe (metre)
function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// "07:30" → dakika cinsinden
function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  // Aktif takip eden şöförler
  const drivers = await prisma.driver.findMany({
    where: { isTracking: true, latitude: { not: null }, longitude: { not: null } },
    select: {
      id: true,
      name: true,
      phone: true,
      latitude: true,
      longitude: true,
      lastLocationAt: true,
      vehicle: {
        select: {
          plate: true,
          routes: {
            where: { active: true },
            select: {
              id: true,
              name: true,
              stops: { orderBy: { order: "asc" } },
            },
            take: 1,
          },
        },
      },
    },
  });

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const alerts: any[] = [];

  for (const driver of drivers) {
    const route = driver.vehicle?.routes?.[0];
    if (!route || route.stops.length === 0) continue;

    for (const stop of route.stops) {
      if (!stop.estimatedTime) continue;

      const stopMinutes = timeToMinutes(stop.estimatedTime);
      const diffMinutes = nowMinutes - stopMinutes;

      // Sadece 0-30 dakika geçmiş durakları kontrol et
      if (diffMinutes < 0 || diffMinutes > 30) continue;

      // Eğer durağın lat/lng'si varsa mesafeye bak
      if (stop.lat && stop.lng) {
        const dist = distance(
          driver.latitude!,
          driver.longitude!,
          stop.lat,
          stop.lng
        );
        // 300m içindeyse geçmiş sayılır
        if (dist < 300) continue;
      }

      // 3+ dk geçse uyarı, 5+ dk geçse alarm
      if (diffMinutes >= 3) {
        alerts.push({
          driverId: driver.id,
          driverName: driver.name,
          driverPhone: driver.phone,
          plate: driver.vehicle?.plate,
          routeName: route.name,
          stopName: stop.name,
          scheduledTime: stop.estimatedTime,
          minutesLate: diffMinutes,
          level: diffMinutes >= 5 ? "alarm" : "warning", // alarm=kırmızı, warning=sarı
        });
        break; // şöför başına en acil tek uyarı
      }
    }
  }

  // En acil önce
  alerts.sort((a, b) => b.minutesLate - a.minutesLate);

  return NextResponse.json(alerts);
}
