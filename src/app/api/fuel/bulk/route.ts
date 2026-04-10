import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantData } from "@/lib/tenant";

type BulkEntry = {
  vehicleId: string;
  driverId?: string;
  date: string;
  liters: number;
  totalAmount: number;
  pricePerLiter?: number;
  odometer?: number;
  station?: string;
  paymentType: string;
  receiptPhoto?: string;
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

  try {
    const { entries } = await req.json() as { entries: BulkEntry[] };
    if (!entries?.length) return NextResponse.json({ error: "Giriş yok" }, { status: 400 });

    const created = await prisma.fuelEntry.createMany({
      data: entries.map((e) => ({
        vehicleId: e.vehicleId,
        driverId: e.driverId || null,
        date: new Date(e.date),
        liters: e.liters,
        totalAmount: e.totalAmount,
        pricePerLiter: e.pricePerLiter || null,
        odometer: e.odometer || null,
        station: e.station || null,
        paymentType: e.paymentType || "nakit",
        receiptPhoto: e.receiptPhoto || null,
        parsedFrom: "bulk",
        ...tenantData(companyId),
      })),
    });

    return NextResponse.json({ count: created.count });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
