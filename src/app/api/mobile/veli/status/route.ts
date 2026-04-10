import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

async function getPassengerFromToken() {
  const h = await headers();
  const auth = h.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  return prisma.routePassenger.findUnique({
    where: { veliToken: token },
    include: {
      stop: {
        include: {
          route: {
            include: {
              driver: true,
              stops: {
                orderBy: { order: "asc" },
                include: {
                  passengers: { where: { active: true }, select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function GET() {
  const passenger = await getPassengerFromToken();
  if (!passenger) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const route = passenger.stop.route;
  const today = new Date().toISOString().slice(0, 10);

  // Bugünkü yoklamadan mevcut durumu bul
  // Son kaydedilen durak = en son attendance'ın durağı
  const lastAttendance = await prisma.tripAttendance.findFirst({
    where: { routeId: route.id, date: today },
    orderBy: { createdAt: "desc" },
    include: {
      passenger: {
        include: { stop: true },
      },
    },
  });

  // Şöförün GPS konumu
  const driver = route.driver;
  const driverLocation = driver
    ? { lat: driver.latitude, lng: driver.longitude, lastAt: driver.lastLocationAt, isTracking: driver.isTracking }
    : null;

  // Sefer başladı mı?
  const seferStarted = !!lastAttendance;

  // Mevcut durak indexi
  let currentStopIndex = 0;
  if (lastAttendance) {
    const stopOrder = lastAttendance.passenger.stop.order;
    currentStopIndex = route.stops.findIndex((s) => s.order === stopOrder);
    if (currentStopIndex < 0) currentStopIndex = 0;
  }

  // Çocuğun durağı
  const myStopIndex = route.stops.findIndex((s) => s.id === passenger.stop.id);
  const myStop = route.stops[myStopIndex];

  // Durum mesajı
  let statusMessage = "Araç henüz hareket etmedi";
  let statusType: "waiting" | "enroute" | "passed" | "arrived" = "waiting";

  if (seferStarted) {
    if (currentStopIndex < myStopIndex) {
      statusType = "enroute";
      const stopsAway = myStopIndex - currentStopIndex;
      statusMessage = `Araç ${stopsAway} durak uzakta`;
    } else if (currentStopIndex === myStopIndex) {
      statusType = "arrived";
      statusMessage = "Araç durağınızda!";
    } else {
      statusType = "passed";
      statusMessage = "Araç durağınızı geçti";
    }
  }

  return NextResponse.json({
    passenger: { id: passenger.id, name: passenger.name },
    myStop: { id: myStop?.id, name: myStop?.name, estimatedTime: myStop?.estimatedTime, order: myStopIndex + 1 },
    route: { id: route.id, name: route.name, totalStops: route.stops.length },
    currentStopIndex,
    currentStop: route.stops[currentStopIndex] ? {
      name: route.stops[currentStopIndex].name,
      estimatedTime: route.stops[currentStopIndex].estimatedTime,
    } : null,
    driverLocation,
    seferStarted,
    statusMessage,
    statusType,
  });
}
