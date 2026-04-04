// Fiş fotoğrafından litre, tutar, istasyon, tarih çıkar
// POST /api/mobile/parse-receipt  { photoUrl: string }
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getDriverFromToken(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return prisma.driver.findUnique({
    where: { mobileToken: auth.slice(7) },
    select: { id: true },
  });
}

async function urlToBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const bytes = Buffer.from(buffer);
  return {
    data: bytes.toString("base64"),
    mimeType: res.headers.get("content-type") || "image/jpeg",
  };
}

export async function POST(req: NextRequest) {
  const driver = await getDriverFromToken(req);
  if (!driver) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { photoUrl } = await req.json();
  if (!photoUrl) return NextResponse.json({ error: "photoUrl zorunlu" }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ parsed: null, error: "AI anahtarı eksik" });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { data, mimeType } = await urlToBase64(photoUrl);

    const result = await model.generateContent([
      {
        inlineData: { data, mimeType },
      },
      `Bu bir akaryakıt (mazot/benzin) pompası fişi. Fişten bilgileri çıkar ve SADECE JSON döndür, başka hiçbir şey yazma:
{
  "liters": number veya null,
  "totalAmount": number veya null,
  "pricePerLiter": number veya null,
  "station": string veya null,
  "date": "YYYY-MM-DD" veya null
}
Türk lirası (₺, TL, TRY) toplam tutarı totalAmount. Litre miktarı L/lt/LT olabilir. Emin olmadığına null yaz.`,
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ parsed: null });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ parsed });
  } catch (e) {
    console.error("Fiş parse hatası:", e);
    return NextResponse.json({ parsed: null });
  }
}
