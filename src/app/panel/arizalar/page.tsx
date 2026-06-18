export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompanyId } from "@/lib/tenant";
import ArizalarClient from "./ArizalarClient";

export default async function ArizalarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const companyId = getCompanyId(session);

  const reports = await prisma.vehicleReport.findMany({
    where: {
      ...(companyId ? { driver: { companyId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      driver: { select: { id: true, name: true, phone: true } },
      vehicle: { select: { id: true, plate: true } },
    },
  });

  return <ArizalarClient reports={reports} />;
}
