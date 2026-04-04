// Fiş fotoğrafından litre, tutar, istasyon, tarih çıkar
// POST /api/mobile/parse-receipt  { photoUrl: string }
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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

export async function POST(req: NextRequest) {
  const driver = await getDriverFromToken(req);
  if (!driver) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { photoUrl } = await req.json();
  if (!photoUrl) return NextResponse.json({ error: "photoUrl zorunlu" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI servisi yapılandırılmamış" }, { status: 500 });

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: photoUrl },
            },
            {
              type: "text",
              text: `Bu bir akaryakıt (mazot/benzin) fişi. Fişten şu bilgileri çıkar ve SADECE JSON döndür, başka hiçbir şey yazma:
{
  "liters": number veya null,
  "totalAmount": number veya null,
  "pricePerLiter": number veya null,
  "station": string veya null,
  "date": "YYYY-MM-DD" veya null
}
Türk lirası sembolü (₺, TL, TRY) varsa totalAmount olarak al. Litre miktarı L veya lt olarak yazılmış olabilir. Emin olmadığın alanlara null yaz.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // JSON parse et
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ parsed: null });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ parsed });
  } catch (e) {
    console.error("Fiş parse hatası:", e);
    return NextResponse.json({ parsed: null });
  }
}
