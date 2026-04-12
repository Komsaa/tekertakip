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

// "07:30" gibi saat stringini bugünün Date'ine çevirir
function parseStopTime(timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export async function GET() {
  const passenger = await getPassengerFromToken();
  if (!passenger) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const route = passenger.stop.route;
  const today = new Date().toISOString().slice(0, 10);

  // Bugünkü son yoklama kaydı (sefer ilerlemesini belirler)
  const lastAttendance = await prisma.tripAttendance.findFirst({
    where: { routeId: route.id, date: today },
    orderBy: { createdAt: "desc" },
    include: {
      passenger: {
        include: { stop: true },
      },
    },
  });

  // Bu çocuğun bugünkü yoklaması
  const myAttendance = await prisma.tripAttendance.findUnique({
    where: {
      passengerId_routeId_date: {
        passengerId: passenger.id,
        routeId: route.id,
        date: today,
      },
    },
  });

  const driver = route.driver;
  const seferStarted = !!lastAttendance;

  // Mevcut durak indexi (şöförün bulunduğu yer)
  let currentStopIndex = 0;
  if (lastAttendance) {
    const stopOrder = lastAttendance.passenger.stop.order;
    const idx = route.stops.findIndex((s) => s.order === stopOrder);
    if (idx >= 0) currentStopIndex = idx;
  }

  // Çocuğun durağı
  const myStopIndex = route.stops.findIndex((s) => s.id === passenger.stop.id);
  const myStop = route.stops[myStopIndex];

  // ±20 dakika penceresi kontrolü
  const now = new Date();
  let isInWindow = false;
  let minutesToPickup: number | null = null;
  if (myStop?.estimatedTime) {
    const stopTime = parseStopTime(myStop.estimatedTime);
    const diffMs = now.getTime() - stopTime.getTime();
    const diffMins = diffMs / 60000; // pozitif = geçti, negatif = henüz gelmedi
    minutesToPickup = Math.round(-diffMins); // kaç dakika kaldı (negatifse geçmiş)
    isInWindow = Math.abs(diffMins) <= 20;
  }

  // Sefer başladıysa pencereyi aç (araç hareket etmişse göster)
  const showLocation = isInWindow || seferStarted;

  // Şöför konumu — yalnızca pencere veya sefer aktifse
  const driverLocation = (showLocation && driver)
    ? { lat: driver.latitude, lng: driver.longitude, lastAt: driver.lastLocationAt, isTracking: driver.isTracking }
    : null;

  // Servise binmedi uyarısı:
  // Sefer başladı VE araç bu çocuğun durağını geçti VE çocuk "absent" ya da hiç kaydedilmedi
  const stopPassed = seferStarted && currentStopIndex > myStopIndex;
  const missedBoarding = stopPassed && (!myAttendance || myAttendance.status === "absent");

  // Durum mesajı
  let statusMessage = "Servis henüz hareket etmedi";
  let statusType: "waiting" | "enroute" | "passed" | "arrived" | "missed" = "waiting";

  if (missedBoarding) {
    statusType = "missed";
    statusMessage = "Öğrenciniz servise binmedi";
  } else if (seferStarted) {
    if (currentStopIndex < myStopIndex) {
      statusType = "enroute";
      const stopsAway = myStopIndex - currentStopIndex;
      statusMessage = `Araç ${stopsAway} durak uzakta`;
    } else if (currentStopIndex === myStopIndex) {
      statusType = "arrived";
      statusMessage = "Araç durağınızda!";
    } else {
      statusType = "passed";
      statusMessage = myAttendance?.status === "boarded"
        ? "Öğrenciniz servise bindi ✓"
        : "Araç durağınızı geçti";
    }
  }

  return NextResponse.json({
    passenger: { id: passenger.id, name: passenger.name },
    myStop: {
      id: myStop?.id,
      name: myStop?.name,
      estimatedTime: myStop?.estimatedTime,
      order: myStopIndex + 1,
    },
    route: { id: route.id, name: route.name, totalStops: route.stops.length },
    currentStopIndex,
    currentStop: route.stops[currentStopIndex]
      ? {
          name: route.stops[currentStopIndex].name,
          estimatedTime: route.stops[currentStopIndex].estimatedTime,
        }
      : null,
    driverLocation,
    seferStarted,
    showLocation,
    isInWindow,
    minutesToPickup,         // kaç dakika kaldı (negatifse geçmiş, null ise bilinmiyor)
    myAttendanceStatus: myAttendance?.status ?? null,  // "boarded" | "absent" | null
    missedBoarding,
    statusMessage,
    statusType,
  });
}
