import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.subcontractor.findUnique({
    where: { id: params.id },
    include: {
      jobs: {
        include: { client: { select: { name: true } } },
        orderBy: { date: "desc" },
      },
    },
  });
  if (!sub) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json(sub);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone, taxNo, address, bankIban, notes, active } = body;

  const sub = await prisma.subcontractor.update({
    where: { id: params.id },
    data: { name, phone, taxNo, address, bankIban, notes, active },
  });
  return NextResponse.json(sub);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Bağlı iş varsa silme, pasife al
  const jobCount = await prisma.job.count({ where: { subcontractorId: params.id } });
  if (jobCount > 0) {
    await prisma.subcontractor.update({ where: { id: params.id }, data: { active: false } });
    return NextResponse.json({ message: "Taşerona bağlı iş var, pasife alındı" });
  }

  await prisma.subcontractor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
