import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { month, year, issueDate } = await req.json();
  if (!month || !year) return NextResponse.json({ error: "month ve year zorunlu" }, { status: 400 });

  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59);
  const issueDateParsed = issueDate ? new Date(issueDate) : new Date();

  // Tüm aktif firmaları çek
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });

  const results: { clientName: string; status: "created" | "skipped_no_trips" | "skipped_exists" | "error"; invoiceNo?: string; tripCount?: number }[] = [];

  for (const client of clients) {
    try {
      // Bu dönem için zaten fatura var mı?
      const existing = await prisma.invoice.findFirst({
        where: {
          clientId: client.id,
          periodStart: { gte: periodStart },
          periodEnd: { lte: new Date(year, month, 0, 23, 59, 59) },
        },
      });
      if (existing) {
        results.push({ clientName: client.name, status: "skipped_exists", invoiceNo: existing.invoiceNo });
        continue;
      }

      // Sefer sayısını hesapla
      const tripCount = await prisma.job.count({
        where: {
          date: { gte: periodStart, lte: periodEnd },
          OR: [
            { clientId: client.id },
            { clientName: { equals: client.name, mode: "insensitive" } },
          ],
        },
      });

      if (tripCount === 0) {
        results.push({ clientName: client.name, status: "skipped_no_trips", tripCount: 0 });
        continue;
      }

      // Sıradaki fatura no
      const lastInvoice = await prisma.invoice.findFirst({ orderBy: { invoiceNo: "desc" } });
      let seq = 1;
      if (lastInvoice) {
        const match = lastInvoice.invoiceNo.match(/(\d+)$/);
        if (match) seq = parseInt(match[1]) + 1;
      }
      const invoiceNo = `KOM${year}${String(seq).padStart(9, "0")}`;

      const subtotal = tripCount * client.unitPrice;
      const kdvAmount = subtotal * (client.kdvRate / 100);
      const tevkifatAmount = kdvAmount * (client.tevkifatRate / 100);
      const totalAmount = subtotal + kdvAmount;
      const payableAmount = totalAmount - tevkifatAmount;
      const dueDate = new Date(issueDateParsed.getTime() + client.paymentTermDays * 86400000);

      await prisma.invoice.create({
        data: {
          invoiceNo,
          clientId: client.id,
          issueDate: issueDateParsed,
          dueDate,
          periodStart,
          periodEnd,
          tripCount,
          unitPrice: client.unitPrice,
          subtotal,
          kdvRate: client.kdvRate,
          kdvAmount,
          tevkifatRate: client.tevkifatRate,
          tevkifatAmount,
          totalAmount,
          payableAmount,
        },
      });

      results.push({ clientName: client.name, status: "created", invoiceNo, tripCount });
    } catch {
      results.push({ clientName: client.name, status: "error" });
    }
  }

  const created = results.filter(r => r.status === "created").length;
  const skippedNoTrips = results.filter(r => r.status === "skipped_no_trips").length;
  const skippedExists = results.filter(r => r.status === "skipped_exists").length;

  return NextResponse.json({ results, created, skippedNoTrips, skippedExists });
}
