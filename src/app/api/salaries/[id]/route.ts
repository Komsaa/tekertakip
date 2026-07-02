import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const base = b.baseAmount !== undefined ? parseFloat(b.baseAmount) : undefined;
    const bonus = b.bonusAmount !== undefined ? parseFloat(b.bonusAmount) : undefined;
    const advance = b.advanceAmount !== undefined ? parseFloat(b.advanceAmount) : undefined;
    let totalAmount: number | undefined;
    if (base !== undefined || bonus !== undefined) {
      const current = await prisma.salary.findUnique({ where: { id: params.id }, select: { baseAmount: true, bonusAmount: true } });
      if (current) totalAmount = (base ?? current.baseAmount) + (bonus ?? current.bonusAmount);
    }
    const salary = await prisma.salary.update({
      where: { id: params.id },
      data: {
        ...(base !== undefined && { baseAmount: base }),
        ...(bonus !== undefined && { bonusAmount: bonus }),
        ...(advance !== undefined && { advanceAmount: advance }),
        ...(totalAmount !== undefined && { totalAmount }),
        ...(b.paid !== undefined && { paid: b.paid, paidAt: b.paid ? new Date() : null }),
        ...(b.notes !== undefined && { notes: b.notes || null }),
      },
      include: { driver: { select: { id: true, name: true } } },
    });
    return NextResponse.json(salary);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.salary.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
