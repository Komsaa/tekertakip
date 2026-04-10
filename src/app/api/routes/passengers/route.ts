import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stopId = req.nextUrl.searchParams.get("stopId");
  if (!stopId) return NextResponse.json({ error: "stopId zorunlu" }, { status: 400 });
  const passengers = await prisma.routePassenger.findMany({
    where: { stopId },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(passengers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { stopId, name, phone, parentPhone } = await req.json();
  if (!stopId || !name) return NextResponse.json({ error: "stopId ve name zorunlu" }, { status: 400 });
  const count = await prisma.routePassenger.count({ where: { stopId } });
  const passenger = await prisma.routePassenger.create({
    data: { stopId, name: name.trim(), phone: phone?.trim() || null, parentPhone: parentPhone?.trim() || null, order: count },
  });
  return NextResponse.json(passenger, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id zorunlu" }, { status: 400 });
  await prisma.routePassenger.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
