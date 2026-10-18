import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyId, requireTenant, tenantWhere } from "@/lib/tenant";
function period(month:number,year:number){return Number.isInteger(month)&&month>=1&&month<=12&&Number.isInteger(year)&&year>=2000&&year<=2100;}
export async function GET(req:NextRequest){
 const session=await getServerSession(authOptions);if(!session)return NextResponse.json({error:"Unauthorized"},{status:401});const denied=requireTenant(session);if(denied)return denied;
 const scope=tenantWhere(getCompanyId(session)),q=req.nextUrl.searchParams,passengerId=q.get("passengerId"),routeId=q.get("routeId"),month=Number(q.get("month")),year=Number(q.get("year"));
 if(!passengerId&&(!routeId||!period(month,year)))return NextResponse.json({error:"Geçerli güzergâh ve dönem gerekli"},{status:400});
 const payments=await prisma.passengerPayment.findMany({where:{...(passengerId?{passengerId}:{month,year}),passenger:{stop:{...(routeId?{routeId}:{}),route:scope}}},orderBy:[{year:"desc"},{month:"desc"}],select:{id:true,passengerId:true,month:true,year:true,amount:true,paid:true,paidAt:true,notes:true}});
 return NextResponse.json(payments);
}
export async function POST(req:NextRequest){
 const session=await getServerSession(authOptions);if(!session)return NextResponse.json({error:"Unauthorized"},{status:401});const denied=requireTenant(session);if(denied)return denied;
 const companyId=getCompanyId(session);const {passengerId,month,year,amount,paid,notes}=await req.json();
 if(typeof passengerId!=="string"||!period(month,year)||typeof amount!=="number"||!Number.isFinite(amount)||amount<0||(paid!==undefined&&typeof paid!=="boolean")||(notes!=null&&typeof notes!=="string"))return NextResponse.json({error:"Ödeme bilgileri geçersiz"},{status:400});
 const passenger=await prisma.routePassenger.findFirst({where:{id:passengerId,stop:{route:tenantWhere(companyId)}},select:{stop:{select:{route:{select:{companyId:true}}}}}});
 if(!passenger)return NextResponse.json({error:"Öğrenci bulunamadı"},{status:404});
 const existing=await prisma.passengerPayment.findUnique({where:{passengerId_month_year:{passengerId,month,year}}});
 const paidAt=paid?(existing?.paid?existing.paidAt??new Date():new Date()):null;
 const payment=await prisma.passengerPayment.upsert({where:{passengerId_month_year:{passengerId,month,year}},update:{amount,paid:paid??false,paidAt,notes:notes??null},create:{passengerId,month,year,amount,paid:paid??false,paidAt,notes:notes??null,companyId:passenger.stop.route.companyId}});
 return NextResponse.json(payment);
}
export async function PATCH(req:NextRequest){
 const session=await getServerSession(authOptions);if(!session)return NextResponse.json({error:"Unauthorized"},{status:401});const denied=requireTenant(session);if(denied)return denied;
 const {id,paid}=await req.json();if(typeof id!=="string"||typeof paid!=="boolean")return NextResponse.json({error:"Geçersiz ödeme"},{status:400});
 const existing=await prisma.passengerPayment.findFirst({where:{id,passenger:{stop:{route:tenantWhere(getCompanyId(session))}}}});if(!existing)return NextResponse.json({error:"Ödeme bulunamadı"},{status:404});
 return NextResponse.json(await prisma.passengerPayment.update({where:{id},data:{paid,paidAt:paid?(existing.paidAt??new Date()):null}}));
}
export async function DELETE(req:NextRequest){
 const session=await getServerSession(authOptions);if(!session)return NextResponse.json({error:"Unauthorized"},{status:401});const denied=requireTenant(session);if(denied)return denied;
 const {id}=await req.json();if(typeof id!=="string")return NextResponse.json({error:"Geçersiz ödeme"},{status:400});
 const result=await prisma.passengerPayment.deleteMany({where:{id,passenger:{stop:{route:tenantWhere(getCompanyId(session))}}}});
 return NextResponse.json({success:result.count>0},{status:result.count?200:404});
}
