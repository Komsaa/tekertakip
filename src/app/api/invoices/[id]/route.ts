import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const inv = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.paidAt !== undefined && { paidAt: body.paidAt ? new Date(body.paidAt) : null }),
        ...(body.paidAmount !== undefined && { paidAmount: parseFloat(body.paidAmount) }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
      include: { client: { select: { id: true, name: true } } },
    });
    return NextResponse.json(inv);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.invoice.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
