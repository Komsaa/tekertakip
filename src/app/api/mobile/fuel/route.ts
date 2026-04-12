// Mobil uygulama: yakıt girişi
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriverFromRequest } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  try {
    const driver = await getDriverFromRequest(req);
    if (!driver) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

    const b = await req.json();

    const vehicleId = b.vehicleId || driver.vehicleId;
    if (!vehicleId) {
      return NextResponse.json({ error: "Araç bilgisi eksik" }, { status: 400 });
    }
    if (!b.liters || !b.totalAmount) {
      return NextResponse.json({ error: "Litre ve tutar zorunlu" }, { status: 400 });
    }

    const entry = await prisma.fuelEntry.create({
      data: {
        vehicleId,
        driverId: driver.id,
        date: new Date(b.date || Date.now()),
        liters: parseFloat(b.liters),
        pricePerLiter: b.pricePerLiter ? parseFloat(b.pricePerLiter) : null,
        totalAmount: parseFloat(b.totalAmount),
        odometer: b.odometer ? parseInt(b.odometer) : null,
        station: b.station || null,
        paymentType: b.paymentType || "veresiye",
        receiptPhoto: b.receiptPhoto || null,
        notes: b.notes || null,
        parsedFrom: "mobile",
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
