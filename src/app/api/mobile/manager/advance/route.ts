import { NextRequest, NextResponse } from "next/server";
import { verifyManagerTokenFull } from "@/lib/manager-token";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getManager(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyManagerTokenFull(auth.slice(7));
}

export async function POST(req: NextRequest) {
  const manager = getManager(req);
  if (!manager) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { driverId, amount, description, date, category } = await req.json();
  if (!driverId || !amount || !date) {
    return NextResponse.json({ error: "driverId, amount ve date zorunlu" }, { status: 400 });
  }

  const companyFilter = manager.companyId ? { companyId: manager.companyId } : {};
  const driver = await prisma.driver.findFirst({
    where: { id: driverId, ...companyFilter },
    select: { id: true, name: true },
  });
  if (!driver) return NextResponse.json({ error: "Sofor bulunamadi" }, { status: 404 });

  const entry = await prisma.financeEntry.create({
    data: {
      type: "expense",
      category: category ?? "avans",
      amount: parseFloat(String(amount)),
      date: new Date(date),
      description: description || null,
      driverId,
      companyId: manager.companyId ?? null,
    },
  });

  return NextResponse.json({ success: true, id: entry.id, driverName: driver.name });
}

export async function GET(req: NextRequest) {
  const manager = getManager(req);
  if (!manager) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const companyFilter = manager.companyId ? { companyId: manager.companyId } : {};

  const entries = await prisma.financeEntry.findMany({
    where: { ...companyFilter, category: { in: ["avans", "maaş", "ikramiye", "diğer"] }, type: "expense", driverId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const driverIds = Array.from(new Set(entries.map((e) => e.driverId).filter(Boolean) as string[]));
  const driverNames = await prisma.driver.findMany({
    where: { id: { in: driverIds } },
    select: { id: true, name: true },
  });
  const nameMap = Object.fromEntries(driverNames.map((d) => [d.id, d.name]));

  return NextResponse.json(entries.map((e) => ({
    id: e.id,
    category: e.category,
    amount: e.amount,
    description: e.description,
    date: e.date,
    driverId: e.driverId,
    driverName: e.driverId ? (nameMap[e.driverId] ?? null) : null,
  })));
}
