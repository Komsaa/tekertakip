import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { historyDay } from "@/lib/trip-history";
import { matchGpsTrips } from "@/lib/gps-trip-matching";
import { historyRouteShape } from "@/lib/history-route-shapes";
export const historyReply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const reply = historyReply;
export async function tripHistoryResponse(req: NextRequest, companyId: string) {
    const driverId = req.nextUrl.searchParams.get("driverId");
    if (!driverId) {
      const drivers = await prisma.driver.findMany({
        where: { companyId }, orderBy: { name: "asc" }, take: 1001,
        select: { id: true, name: true },
      });
      return reply({ drivers: drivers.slice(0, 1000), truncated: drivers.length > 1000 });
    }
    const date = req.nextUrl.searchParams.get("date") ?? "";
    const range = historyDay(date);
    if (!range || driverId.length > 128) return reply({ error: "Geçerli tarih (YYYY-AA-GG, 2017 sonrası) ve şoför seçin." }, 400);
    const driver = await prisma.driver.findFirst({ where: { id: driverId, companyId }, select: { id: true, name: true } });
    if (!driver) return reply({ error: "Şoför bulunamadı." }, 404);
    // Attendance.routeId is a scalar, not a foreign key. Validate both its route
    // and the passenger's current route independently against the manager's tenant.
    const routes = await prisma.route.findMany({ where: { companyId }, select: { id: true, name: true, driverId: true, stops: { orderBy: { order: "asc" }, select: { id: true, name: true, lat: true, lng: true } } } });
    const routeNames = new Map(routes.map(r => [r.id, r.name]));
    const routeId = req.nextUrl.searchParams.get("routeId");
    if (routeId && !routeNames.has(routeId)) return reply({ error: "Güzergâh bulunamadı." }, 404);
    const [points, records] = await Promise.all([
      routeId ? Promise.resolve([]) : prisma.driverLocationHistory.findMany({
        where: { driverId, driver: { companyId }, timestamp: range },
        select: { latitude: true, longitude: true, timestamp: true },
        orderBy: [{ timestamp: "asc" }, { id: "asc" }], take: 5001,
      }),
      prisma.tripAttendance.findMany({
        where: { driverId, date, routeId: { in: routeId ? [routeId] : routes.map(r => r.id) }, passenger: { stop: { route: { companyId } } } },
        select: { id: true, routeId: true, status: true, createdAt: true,
          passenger: { select: { name: true, stop: { select: { name: true, routeId: true } } } } },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 2001,
      }),
    ]);
    const validPoints = points.slice(0, 5000).filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180);
    let matching;
    if (req.nextUrl.searchParams.get("mode") === "matches") {
      const historicalRoutes = new Set(records.map(r => r.routeId));
      const eligible = routes.filter(r => r.driverId === driverId || historicalRoutes.has(r.id));
      const shapes = [];
      // Bound external provider concurrency and total matching work.
      for (let i = 0; i < Math.min(eligible.length, 40); i += 10) shapes.push(...await Promise.all(eligible.slice(i, Math.min(i + 10, 40)).map(historyRouteShape)));
      matching = { ...matchGpsTrips(validPoints.map(p => ({ ...p, timestamp: p.timestamp.toISOString() })), shapes), routes: shapes.map(r => ({ id: r.id, name: r.name, geometry: r.geometry, missingCoordinates: r.missingCoordinates, stopCount: r.stops.length, usable: r.path.length >= 2 })), routesTruncated: eligible.length > 40 };
    }
    return reply({ date, driver, timezone: "Europe/Istanbul", points: validPoints, routes: routes.map(r => ({ id: r.id, name: r.name })), routeId, matching,
      invalidPointCount: Math.min(points.length, 5000) - validPoints.length,
      truncated: points.length > 5000 || records.length > 2000,
      attendances: records.slice(0, 2000).map(a => ({ id: a.id, routeId: a.routeId, status: a.status, createdAt: a.createdAt,
        routeName: routeNames.get(a.routeId), passengerName: a.passenger.name,
        // A moved passenger no longer has a provable historical stop.
        stopName: a.passenger.stop.routeId === a.routeId ? a.passenger.stop.name : null,
      })),
    });
}
