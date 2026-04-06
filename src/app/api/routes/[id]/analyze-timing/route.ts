// Şöförün 5 günlük GPS geçmişini analiz et, her durağa ortalama varış saati bul
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STOP_RADIUS_M = 80; // durak etrafı metre
const MIN_DWELL_SEC = 30; // en az 30sn durulmalı sayılsın

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const route = await prisma.route.findUnique({
    where: { id: params.id },
    include: { stops: { orderBy: { order: "asc" } }, driver: true },
  });
  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stopsWithCoords = route.stops.filter(s => s.lat && s.lng);
  if (stopsWithCoords.length === 0)
    return NextResponse.json({ error: "Duraksız güzergah — önce duraklara koordinat gir", stops: [] }, { status: 400 });

  if (!route.driverId)
    return NextResponse.json({ error: "Güzergaha şöför atanmamış", stops: [] }, { status: 400 });

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 3600 * 1000);
  const history = await prisma.driverLocationHistory.findMany({
    where: { driverId: route.driverId, timestamp: { gte: fiveDaysAgo } },
    orderBy: { timestamp: "asc" },
  });

  if (history.length === 0)
    return NextResponse.json({ message: "Henüz GPS geçmişi yok (5 gün beklenmeli)", stops: stopsWithCoords.map(s => ({ ...s, suggestedTime: s.estimatedTime, confidence: 0 })) });

  // Her durak için: o günlerdeki geçen zamanları topla
  const stopResults = stopsWithCoords.map(stop => {
    const arrivalMinutesByDay: Record<string, number[]> = {};

    let inStop = false;
    let enterTime: Date | null = null;

    for (let i = 0; i < history.length; i++) {
      const pt = history[i];
      const dist = haversineMeters(pt.latitude, pt.longitude, stop.lat!, stop.lng!);
      const dayKey = pt.timestamp.toISOString().slice(0, 10);

      if (dist <= STOP_RADIUS_M) {
        if (!inStop) { inStop = true; enterTime = pt.timestamp; }
      } else {
        if (inStop && enterTime) {
          const dwellMs = pt.timestamp.getTime() - enterTime.getTime();
          if (dwellMs / 1000 >= MIN_DWELL_SEC) {
            const h = enterTime.getHours();
            const m = enterTime.getMinutes();
            if (!arrivalMinutesByDay[dayKey]) arrivalMinutesByDay[dayKey] = [];
            arrivalMinutesByDay[dayKey].push(h * 60 + m);
          }
          inStop = false;
          enterTime = null;
        }
      }
    }

    const allMinutes = Object.values(arrivalMinutesByDay).map(arr => Math.min(...arr));
    if (allMinutes.length === 0)
      return { ...stop, suggestedTime: stop.estimatedTime, confidence: 0, sampleDays: 0 };

    const avg = Math.round(allMinutes.reduce((s, v) => s + v, 0) / allMinutes.length);
    const hh = String(Math.floor(avg / 60)).padStart(2, "0");
    const mm = String(avg % 60).padStart(2, "0");
    return {
      id: stop.id,
      order: stop.order,
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      currentTime: stop.estimatedTime,
      suggestedTime: `${hh}:${mm}`,
      confidence: Math.min(allMinutes.length / 5, 1),
      sampleDays: allMinutes.length,
    };
  });

  return NextResponse.json({ driverName: route.driver?.name, stops: stopResults, historyPoints: history.length });
}
