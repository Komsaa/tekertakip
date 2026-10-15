import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/tenant";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const companyId = getCompanyId(session);
  if (!companyId) return NextResponse.json({ error: "Şirket bulunamadı" }, { status: 400 });
  try {
    const [vehicles, drivers, routes, jobs, fuelEntries, clients, documents, invoices] = await Promise.all([
      prisma.vehicle.count({where:{companyId}}),
      prisma.driver.count({where:{companyId,status:"active"}}),
      prisma.route.count({where:{companyId,active:true,vehicle:{companyId},driver:{companyId},stops:{some:{}}}}),
      prisma.job.count({where:{companyId}}),
      prisma.fuelEntry.count({where:{companyId}}),
      prisma.client.count({where:{companyId}}),
      prisma.vehicle.count({where:{companyId,OR:[{inspectionExpiry:{not:null}},{insuranceExpiry:{not:null}},{routePermitExpiry:{not:null}}]}}),
      prisma.invoice.count({where:{companyId}}),
    ]);
    return NextResponse.json({vehicles,drivers,routes,jobs,fuelEntries,clients,documents,invoices},{headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({error:"Kurulum durumu yüklenemedi"},{status:503});
  }
}
