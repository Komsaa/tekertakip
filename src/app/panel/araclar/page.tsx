import { prisma } from "@/lib/prisma";
import { getDocStatus, formatDate } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCompanyId, tenantWhere } from "@/lib/tenant";
import { redirect } from "next/navigation";
import FleetWorkspace from "./FleetWorkspace";

export default async function VehiclesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const records = await prisma.vehicle.findMany({
    where: { ...tenantWhere(getCompanyId(session)), NOT: { status: "deleted" } },
    orderBy: { plate: "asc" },
    include: {
      assignedDrivers: { include: { driver: { select: { name: true } } } },
      _count: { select: { jobs: true, fuelEntries: true } },
    },
  });
  const vehicles = records.map(vehicle => {
    const states = [vehicle.inspectionExpiry, vehicle.insuranceExpiry, vehicle.routePermitExpiry, vehicle.approvalExpiry].map(getDocStatus);
    const documentState = states.some(s => ["expired", "critical", "warning"].includes(s)) ? "attention" : states.includes("missing") ? "missing" : "valid";
    return {
      id: vehicle.id, plate: vehicle.plate, description: [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" · "),
      capacity: vehicle.capacity, status: vehicle.status, drivers: vehicle.assignedDrivers.map(d => d.driver.name).join(", "),
      inspection: formatDate(vehicle.inspectionExpiry), documentState: documentState as "attention" | "missing" | "valid",
      jobs: vehicle._count.jobs, fuelEntries: vehicle._count.fuelEntries,
    };
  });
  return <FleetWorkspace vehicles={vehicles} />;
}
