import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.job.findMany({ orderBy: [{ date: "desc" }, { startTime: "asc" }], include: { driver: true, vehicle: true } }));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();

    const baseData = {
      title: b.title,
      type: b.type || "okul",
      clientName: b.clientName || null,
      startTime: b.startTime,
      endTime: b.endTime || null,
      driverId: b.driverId || null,
      vehicleId: b.vehicleId || null,
      startLocation: b.startLocation || null,
      endLocation: b.endLocation || null,
      route: b.route || null,
      revenue: b.revenue ? parseFloat(b.revenue) : null,
      status: "planned",
      notes: b.notes || null,
    };

    const repeatDays = parseInt(b.repeatDays) || 0;

    if (repeatDays > 0) {
      const startDate = new Date(b.date);
      const weekdaysOnly = b.weekdaysOnly === true;
      const creates = [];
      for (let i = 0; i < repeatDays; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dow = d.getDay(); // 0=Pazar, 6=Cumartesi
        if (weekdaysOnly && (dow === 0 || dow === 6)) continue;
        creates.push({ ...baseData, date: d });
      }
      await prisma.job.createMany({ data: creates });
      return NextResponse.json({ created: creates.length }, { status: 201 });
    }

    const job = await prisma.job.create({ data: { ...baseData, date: new Date(b.date) } });
    return NextResponse.json(job, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
