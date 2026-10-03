import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { validateDemoRequest } from "@/lib/demo-request";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const result = validateDemoRequest(body);
    if (result.error)
      return NextResponse.json({ error: result.error }, { status: 400 });
    const {
      companyName,
      contactName,
      phone,
      email,
      city,
      vehicleCount,
      serviceType,
    } = result.data;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "DemoRequest" ("id","companyName","contactName","phone","email","city","vehicleCount","serviceType","status","createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',NOW())`,
      randomUUID(),
      companyName,
      contactName,
      phone,
      email,
      city,
      vehicleCount,
      serviceType,
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[kayit]", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
