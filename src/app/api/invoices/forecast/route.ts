import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  // Ödenmemiş faturalar (vadesi geçmiş + bekleyen)
  const pending = await prisma.invoice.findMany({
    where: { status: { in: ["bekliyor", "gecikti"] } },
    include: { client: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
  });

  // Vade geçmişleri güncelle
  const overdueIds = pending.filter(i => i.dueDate < now && i.status === "bekliyor").map(i => i.id);
  if (overdueIds.length > 0) {
    await prisma.invoice.updateMany({ where: { id: { in: overdueIds } }, data: { status: "gecikti" } });
  }

  // Son 6 ay + bu ay: aylık kesilen/tahsil özeti
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const allRecent = await prisma.invoice.findMany({
    where: { issueDate: { gte: sixMonthsAgo } },
    select: { issueDate: true, dueDate: true, payableAmount: true, paidAmount: true, status: true },
  });

  // Grup: kesildiği ay
  const byIssuedMonth: Record<string, { issued: number; collected: number }> = {};
  for (const inv of allRecent) {
    const key = `${inv.issueDate.getFullYear()}-${String(inv.issueDate.getMonth() + 1).padStart(2, "0")}`;
    if (!byIssuedMonth[key]) byIssuedMonth[key] = { issued: 0, collected: 0 };
    byIssuedMonth[key].issued += inv.payableAmount;
    byIssuedMonth[key].collected += inv.paidAmount;
  }

  // Gelecek 3 ay: vadelerine göre beklenen tahsilat
  const threeMonthsLater = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  const upcoming = await prisma.invoice.findMany({
    where: {
      status: { in: ["bekliyor", "gecikti"] },
      dueDate: { lt: threeMonthsLater },
    },
    include: { client: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
  });

  // Grup: vade ayı
  const byDueMonth: Record<string, number> = {};
  for (const inv of upcoming) {
    const key = `${inv.dueDate.getFullYear()}-${String(inv.dueDate.getMonth() + 1).padStart(2, "0")}`;
    byDueMonth[key] = (byDueMonth[key] ?? 0) + (inv.payableAmount - inv.paidAmount);
  }

  const totalPending = pending.reduce((s, i) => s + i.payableAmount - i.paidAmount, 0);
  const totalOverdue = pending
    .filter(i => i.dueDate < now)
    .reduce((s, i) => s + i.payableAmount - i.paidAmount, 0);

  return NextResponse.json({ pending, byIssuedMonth, byDueMonth, totalPending, totalOverdue });
}
