import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDriverFromRequest } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  const driver = await getDriverFromRequest(req);
  if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, stops, notes } = await req.json();

    if (!stops || !Array.isArray(stops) || stops.length < 2) {
      return NextResponse.json({ error: "En az 2 durak gerekli" }, { status: 400 });
    }

    const proposal = await prisma.routeProposal.create({
      data: {
        driverId: driver.id,
        companyId: driver.companyId ?? null,
        name: name?.trim() || null,
        stops,
        notes: notes?.trim() || null,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true, id: proposal.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
