import { prisma } from "@/lib/prisma";
import FinanceClient from "./FinanceClient";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCompanyId, tenantWhere } from "@/lib/tenant";
import { redirect } from "next/navigation";

async function getData(companyId: string | null) {
  const now = new Date();
  const tw = tenantWhere(companyId);
  try {
    const [entries, fuelEntries, drivers] = await Promise.all([
      prisma.financeEntry.findMany({ where: tw, orderBy: { date: "desc" }, take: 200 }).catch(() => []),
      prisma.fuelEntry.findMany({
        where: tw,
        orderBy: { date: "desc" },
        take: 200,
        include: { vehicle: true },
      }).catch(async () =>
        (await prisma.fuelEntry.findMany({ where: tw, orderBy: { date: "desc" }, take: 200 }).catch(() => []))
          .map((e) => ({ ...e, vehicle: null as any }))
      ),
      prisma.driver.findMany({ where: { status: "active", ...tw }, select: { id: true, name: true }, orderBy: { name: "asc" } }).catch(() => []),
    ]);

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const income = entries.filter((e) => e.type === "income" && new Date(e.date) >= start && new Date(e.date) <= end).reduce((s, e) => s + e.amount, 0);
      const expense = entries.filter((e) => e.type === "expense" && new Date(e.date) >= start && new Date(e.date) <= end).reduce((s, e) => s + e.amount, 0);
      const fuel = fuelEntries.filter((e) => new Date(e.date) >= start && new Date(e.date) <= end).reduce((s, e) => s + e.totalAmount, 0);
      monthlyData.push({
        month: month.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
        income, expense: expense + fuel, fuel,
      });
    }

    return { entries, fuelEntries, drivers, monthlyData };
  } catch (e) {
    console.error("Finans sayfa hatası:", e);
    return { entries: [], fuelEntries: [], drivers: [], monthlyData: [] };
  }
}

export default async function FinancePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const companyId = getCompanyId(session);
  const data = await getData(companyId);
  return <FinanceClient {...data} />;
}
