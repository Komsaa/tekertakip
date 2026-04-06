import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);

  const jobs = await prisma.job.findMany({
    where: {
      date: { gte: periodStart, lte: periodEnd },
      status: { not: "cancelled" },
      OR: [
        { clientId: params.id },
        { clientName: { equals: client.name, mode: "insensitive" } },
      ],
    },
    select: { id: true, date: true, title: true, status: true, startLocation: true, endLocation: true },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ tripCount: jobs.length, jobs, periodStart, periodEnd });
}
