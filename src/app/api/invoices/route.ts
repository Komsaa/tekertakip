import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere, tenantData } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);

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

  // Vadesi geçmiş "bekliyor" faturaları otomatik gecikti yap
  await prisma.invoice.updateMany({
    where: { ...tenantWhere(companyId), status: "bekliyor", dueDate: { lt: new Date() } },
    data: { status: "gecikti" },
  });

  const invoices = await prisma.invoice.findMany({
    where: { ...tenantWhere(companyId), ...(status ? { status } : {}), ...dateFilter },
    include: {
      client: { select: { id: true, name: true } },
      route: { select: { id: true, name: true } },
    },
    orderBy: { issueDate: "desc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  try {
    const body = await req.json();
    // Allow pre-calculated amounts from PDF upload (Gemini extraction)
    const subtotal = body._subtotal ?? (body.tripCount * body.unitPrice);
    const kdvAmount = body._kdvAmount ?? (subtotal * (body.kdvRate / 100));
    const tevkifatAmount = body._tevkifatAmount ?? (kdvAmount * (body.tevkifatRate / 100));
    const totalAmount = body._totalAmount ?? (subtotal + kdvAmount);
    const payableAmount = body._payableAmount ?? (totalAmount - tevkifatAmount);

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
        routeId: body.routeId || null,
        pdfUrl: body.pdfUrl || null,
        ...tenantData(companyId),
      },
      include: {
        client: { select: { id: true, name: true } },
        route: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch (e: unknown) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
