import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, requireTenant, tenantWhere } from "@/lib/tenant";
import { DRIVER_DATES, VEHICLE_DATES, validDocumentDate } from "@/lib/document-dates";
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({error:"Unauthorized"},{status:401});
  const denied = requireTenant(session); if (denied) return denied;
  let b; try { b = await request.json(); } catch { return NextResponse.json({error:"Geçersiz veri"},{status:400}); }
  if (!b || typeof b.entityId !== "string" || typeof b.docType !== "string" || !["driver","vehicle"].includes(b.entityType) || !validDocumentDate(b.date)) return NextResponse.json({error:"Geçersiz tarih veya belge"},{status:400});
  const map = b.entityType === "driver" ? DRIVER_DATES : VEHICLE_DATES;
  const field = Object.hasOwn(map,b.docType) ? map[b.docType] : undefined;
  if (!field) return NextResponse.json({error:"Bu belge için tarih takibi yok"},{status:400});
  const where = {id:b.entityId,...tenantWhere(getCompanyId(session))};
  try {
    const data = {[field]:new Date(b.date+"T00:00:00.000Z")};
    const result = b.entityType === "driver" ? await prisma.driver.updateMany({where,data}) : await prisma.vehicle.updateMany({where,data});
    if (!result.count) return NextResponse.json({error:"Kayıt bulunamadı"},{status:404});
    return NextResponse.json({ok:true});
  } catch { return NextResponse.json({error:"Tarih kaydedilemedi"},{status:500}); }
}
