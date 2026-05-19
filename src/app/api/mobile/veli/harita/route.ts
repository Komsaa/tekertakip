import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function getPassenger() {
  const h = await headers();
  const token = (h.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (!token) return null;
  const expiresAt = parseInt(token.split("|")[1] ?? "0");
  if (expiresAt && Date.now() > expiresAt) return null;
  return prisma.routePassenger.findUnique({
    where: { veliToken: token },
    include: {
      stop: {
        include: {
          route: {
            include: {
              driver: { select: { latitude: true, longitude: true, isTracking: true, lastLocationAt: true } },
              stops: { orderBy: { order: "asc" }, select: { id: true, name: true, lat: true, lng: true, order: true, estimatedTime: true } },
            },
          },
        },
      },
    },
  });
}

export async function GET() {
  const passenger = await getPassenger();
  if (!passenger) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const route = passenger.stop.route;
  const driver = route.driver;

  return NextResponse.json({
    driverLocation: driver
      ? { lat: driver.latitude, lng: driver.longitude, isTracking: driver.isTracking, lastAt: driver.lastLocationAt }
      : null,
    myStopId: passenger.stop.id,
    stops: route.stops.map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      order: s.order,
      estimatedTime: s.estimatedTime,
    })),
    routeName: route.name,
  });
}
