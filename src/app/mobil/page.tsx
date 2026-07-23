import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCompanyId, tenantWhere } from "@/lib/tenant";
import MobilPanel from "./MobilPanel";

export default async function MobilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const companyId = getCompanyId(session);

  const routes = await prisma.route.findMany({
    where: { ...tenantWhere(companyId), active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      stops: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          passengers: {
            where: { active: true },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              parentName: true,
              parentPhone: true,
              monthlyFee: true,
              veliUsername: true,
            },
          },
        },
      },
    },
  });

  const userName = session.user?.name ?? "Yönetici";
  return <MobilPanel routes={routes} userName={userName} />;
}
