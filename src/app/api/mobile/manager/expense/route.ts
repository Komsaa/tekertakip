import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyManagerTokenFull } from "@/lib/manager-token";
import { uploadToStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("Authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const manager = verifyManagerTokenFull(token);
  if (!manager) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const category = String(formData.get("category") || "diğer");
    const amount = parseFloat(String(formData.get("amount") || "0"));
    const description = String(formData.get("description") || "").trim() || null;
    const date = String(formData.get("date") || new Date().toISOString().slice(0, 10));
    const photo = formData.get("photo") as File | null;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Geçerli bir tutar girin" }, { status: 400 });
    }

    let receiptFile: string | null = null;
    if (photo && photo.size > 0) {
      const ext = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const key = `expense/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const buf = Buffer.from(await photo.arrayBuffer());
      const contentType = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
      await uploadToStorage(key, buf, contentType);
      receiptFile = key;
    }

    const entry = await prisma.financeEntry.create({
      data: {
        type: "expense",
        category,
        amount,
        description,
        date: new Date(date),
        receiptFile,
        companyId: manager.companyId,
      },
    });

    return NextResponse.json({ success: true, id: entry.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = getToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const manager = verifyManagerTokenFull(token);
  if (!manager) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.financeEntry.findMany({
    where: {
      type: "expense",
      ...(manager.companyId ? { companyId: manager.companyId } : {}),
    },
    orderBy: { date: "desc" },
    take: 30,
    select: { id: true, category: true, amount: true, description: true, date: true, receiptFile: true },
  });

  return NextResponse.json(entries);
}
