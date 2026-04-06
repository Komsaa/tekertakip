import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  let dateFilter = {};
  if (year && month) {
    dateFilter = {
      issueDate: {
        gte: new Date(parseInt(year), parseInt(month) - 1, 1),
        lt: new Date(parseInt(year), parseInt(month), 1),
      },
    };
  } else if (year) {
    dateFilter = {
      issueDate: {
        gte: new Date(parseInt(year), 0, 1),
        lt: new Date(parseInt(year) + 1, 0, 1),
      },
    };
  }

  const invoices = await prisma.invoice.findMany({
    where: { ...(status ? { status } : {}), ...dateFilter },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { issueDate: "desc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const subtotal = body.tripCount * body.unitPrice;
    const kdvAmount = subtotal * (body.kdvRate / 100);
    const tevkifatAmount = kdvAmount * (body.tevkifatRate / 100);
    const totalAmount = subtotal + kdvAmount;
    const payableAmount = totalAmount - tevkifatAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: body.invoiceNo,
        clientId: body.clientId,
        issueDate: new Date(body.issueDate),
        dueDate: new Date(body.dueDate),
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        tripCount: body.tripCount,
        unitPrice: body.unitPrice,
        subtotal,
        kdvRate: body.kdvRate,
        kdvAmount,
        tevkifatRate: body.tevkifatRate,
        tevkifatAmount,
        totalAmount,
        payableAmount,
        notes: body.notes || null,
      },
      include: { client: { select: { id: true, name: true } } },
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
