import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { invoices: true } } },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const client = await prisma.client.create({
      data: {
        name: body.name,
        vkn: body.vkn || null,
        taxOffice: body.taxOffice || null,
        address: body.address || null,
        email: body.email || null,
        phone: body.phone || null,
        unitPrice: parseFloat(body.unitPrice) || 0,
        paymentTermDays: parseInt(body.paymentTermDays) || 30,
        kdvRate: parseFloat(body.kdvRate) ?? 20,
        tevkifatRate: parseFloat(body.tevkifatRate) ?? 50,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
