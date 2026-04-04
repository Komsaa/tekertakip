export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const reports = await prisma.vehicleReport.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: {
      driver: { select: { name: true, phone: true } },
      vehicle: { select: { plate: true } },
    },
  });

  return NextResponse.json(reports);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json();
  await prisma.vehicleReport.update({
    where: { id },
    data: { status: "resolved", resolvedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
