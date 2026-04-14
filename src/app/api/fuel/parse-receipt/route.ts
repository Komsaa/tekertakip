import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { s3, BUCKET } from "@/lib/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ parsed: null, error: "GEMINI_API_KEY eksik" });

  const { fileUrl } = await req.json();
  if (!fileUrl) return NextResponse.json({ parsed: null, error: "fileUrl zorunlu" });

  try {
    // /api/files/fuel/filename → MinIO key: fuel/filename
    const key = fileUrl.replace(/^\/api\/files\//, "");

    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    const base64 = Buffer.concat(chunks).toString("base64");

    const ext = key.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      `Bu bir akaryakıt (mazot/benzin) pompası fişi. Fişten bilgileri çıkar ve SADECE JSON döndür, başka hiçbir şey yazma:
{
  "liters": number veya null,
  "totalAmount": number veya null,
  "pricePerLiter": number veya null,
  "station": string veya null,
  "date": "YYYY-MM-DD" veya null
}
Türk lirası (₺, TL, TRY) toplam tutarı totalAmount. Litre miktarı L/lt/LT olabilir. Nokta binlik ayraç, virgül ondalık ayraçtır (3.400,38 → 3400.38). Emin olmadığına null yaz.`,
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
