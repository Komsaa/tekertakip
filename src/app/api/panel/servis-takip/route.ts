export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const companyId = getCompanyId(session);

  const today = new Date().toISOString().slice(0, 10);

  // Tüm aktif güzergahlar + şöför konumu + yoklama
  const routes = await prisma.route.findMany({
    where: { active: true, ...tenantWhere(companyId) },
    orderBy: { name: "asc" },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          phone: true,
          latitude: true,
          longitude: true,
          lastLocationAt: true,
          isTracking: true,
        },
      },
      vehicle: {
        select: { id: true, plate: true, brand: true, model: true },
      },
      stops: {
        orderBy: { order: "asc" },
        include: {
          passengers: {
            where: { active: true },
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              parentName: true,
              parentPhone: true,
            },
          },
        },
      },
    },
  });

  // Bugünkü yoklama kayıtları
  const allPassengerIds = routes.flatMap(r =>
    r.stops.flatMap(s => s.passengers.map(p => p.id))
  );

  const attendances = allPassengerIds.length > 0
    ? await prisma.tripAttendance.findMany({
        where: { passengerId: { in: allPassengerIds }, date: today },
        select: { passengerId: true, status: true, routeId: true },
      })
    : [];

  const attendanceMap: Record<string, string> = {};
  for (const a of attendances) {
    attendanceMap[`${a.passengerId}-${a.routeId}`] = a.status;
  }

  const result = routes.map(route => {
    const stops = route.stops.map(stop => {
      const passengers = stop.passengers.map(p => {
        const key = `${p.id}-${route.id}`;
        const status = attendanceMap[key] ?? null; // "boarded" | "absent" | null
        return { ...p, status };
      });
      const total = passengers.length;
      const boarded = passengers.filter(p => p.status === "boarded").length;
      const absent = passengers.filter(p => p.status === "absent").length;
      return {
        id: stop.id,
        name: stop.name,
        estimatedTime: stop.estimatedTime,
        lat: stop.lat,
        lng: stop.lng,
        passengers,
        total,
        boarded,
        absent,
      };
    });

    const totalPassengers = stops.reduce((s, st) => s + st.total, 0);
    const totalBoarded = stops.reduce((s, st) => s + st.boarded, 0);
    const totalAbsent = stops.reduce((s, st) => s + st.absent, 0);
    const totalUnknown = totalPassengers - totalBoarded - totalAbsent;

    const driverActive =
      route.driver?.isTracking &&
      route.driver.lastLocationAt &&
      Date.now() - new Date(route.driver.lastLocationAt).getTime() < 5 * 60 * 1000;

    return {
      id: route.id,
      name: route.name,
      type: route.type,
      weekdaysOnly: route.weekdaysOnly,
      driver: route.driver
        ? {
            ...route.driver,
            lastLocationAt: route.driver.lastLocationAt?.toISOString() ?? null,
            active: driverActive,
          }
        : null,
      vehicle: route.vehicle,
      stops,
      stats: {
        total: totalPassengers,
        boarded: totalBoarded,
        absent: totalAbsent,
        unknown: totalUnknown,
      },
    };
  });

  return NextResponse.json({ routes: result, today });
}
