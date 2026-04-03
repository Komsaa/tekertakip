// Mobil uygulama: şöför listesi (PIN girmeden önce kim olduğunu seçmek için)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const drivers = await prisma.driver.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      vehicle: { select: { id: true, plate: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(drivers);
}
