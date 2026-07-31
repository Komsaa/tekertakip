import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { s3, BUCKET } from "@/lib/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

// docType → DB expiry field haritası
const DRIVER_EXPIRY: Record<string, string> = {
  license:       "licenseExpiry",
  src:           "srcExpiry",
  psychotech:    "psychotechExpiry",
  criminalRecord: "criminalRecordExpiry",
  healthReport:  "healthReportExpiry",
  residenceDoc:  "residenceDocDate",
};
const VEHICLE_EXPIRY: Record<string, string> = {
  inspection:  "inspectionExpiry",
  insurance:   "insuranceExpiry",
  routePermit: "routePermitExpiry",
  approval:    "approvalExpiry",
  kasko:       "kaskoExpiry",
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ parsed: null, error: "GEMINI_API_KEY eksik" });

  const { storageKey, entityType, docType } = await req.json();
  if (!storageKey) return NextResponse.json({ parsed: null, error: "storageKey zorunlu" });

  try {
    // MinIO'dan dosyayı çek
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: storageKey }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const base64 = buffer.toString("base64");

    const ext = storageKey.split(".").pop()?.toLowerCase() ?? "pdf";
    const mimeType = ext === "pdf" ? "application/pdf"
      : ext === "png" ? "image/png"
      : "image/jpeg";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      `Bu bir Türkçe resmi belge (şöför belgesi, araç muayenesi, sigorta poliçesi vb.).
Belgeden şu bilgileri çıkar ve SADECE JSON döndür, başka hiçbir şey yazma:
{
  "expiryDate": "YYYY-MM-DD" veya null,
  "holderName": string veya null,
  "docTitle": string veya null
}
- expiryDate: belgenin geçerlilik/bitiş/son tarihi (yoksa null)
- holderName: belge sahibinin adı soyadı (yoksa null)
- docTitle: belge adı/türü (örn: "SRC-2 Mesleki Yeterlilik Belgesi", "Zorunlu Trafik Sigortası", "Teknik Muayene Raporu")
Tarih formatları: GG.AA.YYYY veya GG/AA/YYYY → YYYY-MM-DD'ye çevir. Emin olmadığına null yaz.`,
    ]);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ parsed: null });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ parsed });
  } catch (e) {
    console.error("Belge parse hatası:", e);
    return NextResponse.json({ parsed: null });
  }
}
