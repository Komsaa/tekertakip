import { prisma } from "@/lib/prisma";
import FuelClient from "./FuelClient";
import { startOfMonth, endOfMonth } from "date-fns";

function calcConsumption(entries: { odometer: number | null; liters: number }[]) {
  // odometer'ı olan kayıtları sırala
  const sorted = entries
    .filter((e) => e.odometer && e.odometer > 0)
    .sort((a, b) => a.odometer! - b.odometer!);

  if (sorted.length < 2) return null;

  const segments: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const km = sorted[i].odometer! - sorted[i - 1].odometer!;
    if (km <= 0 || km > 5000) continue; // mantıksız değerleri atla
    const per100 = (sorted[i].liters / km) * 100;
    if (per100 > 3 && per100 < 60) segments.push(per100); // gerçekçi aralık
  }

  if (segments.length === 0) return null;
  const avg = segments.reduce((s, v) => s + v, 0) / segments.length;
  const totalKm = sorted[sorted.length - 1].odometer! - sorted[0].odometer!;
  return { avgPer100: avg, totalKm, fillCount: sorted.length };
}

async function getData() {
  const now = new Date();
  try {
    const [fuelEntries, vehicles, drivers, monthStats] = await Promise.all([
      prisma.fuelEntry.findMany({
        orderBy: { date: "desc" },
        take: 100,
        include: { vehicle: true, driver: true },
      }).catch(async () =>
        (await prisma.fuelEntry.findMany({ orderBy: { date: "desc" }, take: 100 }).catch(() => []))
          .map((e) => ({ ...e, vehicle: null as any, driver: null as any }))
      ),
      prisma.vehicle.findMany({ where: { status: "active" }, orderBy: { plate: "asc" }, select: { id: true, plate: true, brand: true, model: true } }).catch(() => []),
      prisma.driver.findMany({ where: { status: "active" }, orderBy: { name: "asc" }, select: { id: true, name: true } }).catch(() => []),
      prisma.fuelEntry.groupBy({
        by: ["vehicleId"],
        _sum: { totalAmount: true, liters: true },
        where: { date: { gte: startOfMonth(now), lte: endOfMonth(now) } },
      }).catch(() => []),
    ]);

    // Her araç için yakıt ortalaması hesapla
    const allEntries = await prisma.fuelEntry.findMany({
      select: { vehicleId: true, odometer: true, liters: true },
      orderBy: { date: "asc" },
    }).catch(() => []);

    const byVehicle: Record<string, { odometer: number | null; liters: number }[]> = {};
    for (const e of allEntries) {
      if (!byVehicle[e.vehicleId]) byVehicle[e.vehicleId] = [];
      byVehicle[e.vehicleId].push({ odometer: e.odometer, liters: e.liters });
    }

    const consumptionStats: Record<string, { avgPer100: number; totalKm: number; fillCount: number } | null> = {};
    for (const [vid, entries] of Object.entries(byVehicle)) {
      consumptionStats[vid] = calcConsumption(entries);
    }

    return { fuelEntries, vehicles, drivers, monthStats, consumptionStats };
  } catch (e) {
    console.error("Yakıt sayfa hatası:", e);
    return { fuelEntries: [], vehicles: [], drivers: [], monthStats: [], consumptionStats: {} };
  }
}

export default async function FuelPage() {
  const data = await getData();
  return <FuelClient {...data} />;
}
