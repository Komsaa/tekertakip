import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/routes/[id]/attendance?month=6&year=2026
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = parseInt(req.nextUrl.searchParams.get("month") ?? "0");
  const year = parseInt(req.nextUrl.searchParams.get("year") ?? "0");
  if (!month || !year) return NextResponse.json({ error: "month ve year zorunlu" }, { status: 400 });

  // O aya ait tüm yoklama kayıtları
  const prefix = `${year}-${String(month).padStart(2, "0")}`;

  const records = await prisma.tripAttendance.findMany({
    where: {
      routeId: params.id,
      date: { startsWith: prefix },
    },
    select: { passengerId: true, date: true, status: true },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(records);
}
