import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompanyId, tenantWhere } from "@/lib/tenant";
import KrediKartlariClient from "./KrediKartlariClient";

export default async function KrediKartlariPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const companyId = getCompanyId(session);
    const cards = await prisma.creditCard.findMany({
      where: { active: true, ...tenantWhere(companyId) },
      include: {
        expenses: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }).catch(() => []);

    return <KrediKartlariClient cards={cards} currentMonth={month} currentYear={year} />;
  } catch (e) {
    console.error("KrediKartlari sayfa hatası:", e);
    const now = new Date();
    return <KrediKartlariClient cards={[]} currentMonth={now.getMonth() + 1} currentYear={now.getFullYear()} />;
  }
}
