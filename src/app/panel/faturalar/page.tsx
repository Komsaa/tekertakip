import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";
import FaturalarClient from "./FaturalarClient";

export default async function FaturalarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const companyId = getCompanyId(session);

  const [clients, invoices, routes] = await Promise.all([
    prisma.client.findMany({ where: tenantWhere(companyId), orderBy: { name: "asc" } }).catch(() => []),
    prisma.invoice.findMany({
      where: tenantWhere(companyId),
      orderBy: { issueDate: "desc" },
      take: 100,
      include: {
        client: { select: { id: true, name: true } },
        route: { select: { id: true, name: true } },
      },
    }).catch(() => []),
    prisma.route.findMany({
      where: { active: true, ...tenantWhere(companyId) },
      orderBy: { name: "asc" },
      select: { id: true, name: true, driver: { select: { name: true } } },
    }).catch(() => []),
  ]);

  return <FaturalarClient
    clients={JSON.parse(JSON.stringify(clients))}
    invoices={JSON.parse(JSON.stringify(invoices))}
    routes={JSON.parse(JSON.stringify(routes))}
  />;
}
