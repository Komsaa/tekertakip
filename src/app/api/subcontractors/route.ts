import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = (session.user as any).companyId;

  const subs = await prisma.subcontractor.findMany({
    where: { companyId },
    include: {
      jobs: {
        select: {
          id: true,
          subcontractorAmount: true,
          subcontractorPaid: true,
          date: true,
          title: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Bakiye hesapla
  const result = subs.map((s) => {
    const total = s.jobs.reduce((sum, j) => sum + (j.subcontractorAmount ?? 0), 0);
    const paid  = s.jobs.filter((j) => j.subcontractorPaid).reduce((sum, j) => sum + (j.subcontractorAmount ?? 0), 0);
    return { ...s, totalAmount: total, paidAmount: paid, pendingAmount: total - paid };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = (session.user as any).companyId;

  const body = await req.json();
  const { name, phone, taxNo, address, bankIban, notes } = body;
  if (!name) return NextResponse.json({ error: "Ad zorunlu" }, { status: 400 });

  const sub = await prisma.subcontractor.create({
    data: { name, phone, taxNo, address, bankIban, notes, companyId },
  });
  return NextResponse.json(sub, { status: 201 });
}
