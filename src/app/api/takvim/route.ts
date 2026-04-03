import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : null;

  const events = await prisma.paymentCalendar.findMany({
    where: month && year
      ? {
          OR: [
            { recurring: true },
            { recurring: false, specificMonth: month, specificYear: year },
          ],
        }
      : undefined,
    orderBy: { day: "asc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const event = await prisma.paymentCalendar.create({ data: body });
  return NextResponse.json(event);
}
