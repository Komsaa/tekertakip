import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCompanyId, tenantWhere } from "@/lib/tenant";
import TakvimClient from "./TakvimClient";

export default async function TakvimPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const companyId = getCompanyId(session);

  const events = await prisma.paymentCalendar.findMany({
    where: tenantWhere(companyId),
    orderBy: { day: "asc" },
  });

  return <TakvimClient initialEvents={events} />;
}
