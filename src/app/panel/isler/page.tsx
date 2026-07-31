import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import JobsClient from "./JobsClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCompanyId, tenantWhere } from "@/lib/tenant";
import { redirect } from "next/navigation";

async function getData(companyId: string | null) {
  const tw = tenantWhere(companyId);
  try {
    const [jobs, drivers, vehicles, clients, subcontractors] = await Promise.all([
      prisma.job.findMany({
        where: tw,
        orderBy: [{ date: "desc" }, { startTime: "asc" }],
        include: { driver: true, vehicle: true, subcontractor: true },
        take: 200,
      }).catch(async () => {
        const jobs = await prisma.job.findMany({
          where: tw,
          orderBy: [{ date: "desc" }, { startTime: "asc" }],
          take: 200,
        }).catch(() => []);
        return jobs.map((j) => ({ ...j, driver: null, vehicle: null, subcontractor: null }));
      }),
      prisma.driver.findMany({
        where: { status: "active", ...tw },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }).catch(() => []),
      prisma.vehicle.findMany({
        where: { status: "active", ...tw },
        orderBy: { plate: "asc" },
        select: { id: true, plate: true, brand: true, model: true },
      }).catch(() => []),
      prisma.client.findMany({ where: tw, orderBy: { name: "asc" }, select: { id: true, name: true } }).catch(() => []),
      prisma.subcontractor.findMany({ where: { active: true, ...tw }, orderBy: { name: "asc" }, select: { id: true, name: true } }).catch(() => []),
    ]);
    return { jobs, drivers, vehicles, clients, subcontractors };
  } catch (e) {
    console.error("İşler sayfa hatası:", e);
    return { jobs: [], drivers: [], vehicles: [], clients: [], subcontractors: [] };
  }
}

export default async function JobsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const companyId = getCompanyId(session);
  const data = await getData(companyId);
  return <JobsClient jobs={data.jobs as any} drivers={data.drivers} vehicles={data.vehicles} clients={data.clients} subcontractors={data.subcontractors} />;
}
