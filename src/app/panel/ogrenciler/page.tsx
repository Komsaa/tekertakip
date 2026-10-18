import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCompanyId, requireTenant, tenantWhere } from "@/lib/tenant";
import { redirect } from "next/navigation";
import StudentsClient from "./StudentsClient";
export default async function StudentsPage() {
 const session=await getServerSession(authOptions);
 if(!session || requireTenant(session)) redirect("/login");
 const routes=await prisma.route.findMany({where:{...tenantWhere(getCompanyId(session)),type:"okul"},orderBy:{name:"asc"},select:{id:true,name:true,active:true,stops:{orderBy:{order:"asc"},select:{id:true,name:true,passengers:{orderBy:{name:"asc"},select:{id:true,name:true,parentName:true,parentPhone:true,monthlyFee:true,active:true}}}}}});
 return <StudentsClient routes={routes}/>;
}
