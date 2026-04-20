import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type DocCategory = "arac" | "sofor" | "firma" | "bilinmiyor";

export type BulkAnalyzeResult = {
  fileName: string;
  category: DocCategory;
  docType: string | null;
  docTitle: string | null;
  holderIdentifier: string | null; // Plaka veya ad soyad
  expiryDate: string | null; // YYYY-MM-DD
  entityMatch: {
    id: string;
    label: string;
    type: "driver" | "vehicle";
    url: string;
  } | null;
  error?: string;
};

const GEMINI_PROMPT = `Bu bir Türk servis firmasına ait resmi belge fotoğrafı veya taraması.
Belgeyi incele ve SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir şey yazma:

{
  "category": "arac | sofor | firma | bilinmiyor",
  "docType": "insurance | kasko | inspection | ruhsat | routePermit | approval | license | src | psychotech | healthReport | criminalRecord | other | null",
  "docTitle": "belgenin tam adı (Türkçe) veya null",
  "holderIdentifier": "araç plakası (örn: 45 J 1234) veya kişi adı soyadı veya null",
  "expiryDate": "YYYY-MM-DD formatında son geçerlilik tarihi veya null"
}

docType referansı:
- insurance: Zorunlu trafik sigortası / ZMSS
- kasko: Kasko poliçesi
- inspection: Fenni muayene / TÜVTÜRK belgesi
- ruhsat: Araç tescil belgesi / ruhsat
- routePermit: Güzergah izin belgesi / taşıt kartı
- approval: Okul servisi uygunluk belgesi / J plaka onayı
- license: Sürücü belgesi / ehliyet
- src: SRC belgesi (SRC2/SRC4/SRC5)
- psychotech: Psikoteknik belgesi
- healthReport: Sağlık raporu / sürücü sağlık belgesi
- criminalRecord: Adli sicil kaydı / sabıka kaydı
- other: diğer tanımlı belge türleri`;

async function analyzeWithGemini(
  base64: string,
  mimeType: string
): Promise<Omit<BulkAnalyzeResult, "fileName" | "entityMatch"> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      GEMINI_PROMPT,
    ]);
    const text = result.response.text().trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return {
      category: parsed.category ?? "bilinmiyor",
      docType: parsed.docType ?? null,
      docTitle: parsed.docTitle ?? null,
      holderIdentifier: parsed.holderIdentifier ?? null,
      expiryDate: parsed.expiryDate ?? null,
    };
  } catch {
    return null;
  }
}

async function findEntityMatch(
  category: DocCategory,
  holderIdentifier: string | null,
  companyId: string | null
): Promise<BulkAnalyzeResult["entityMatch"]> {
  if (!holderIdentifier) return null;
  const identifier = holderIdentifier.trim();

  if (category === "arac") {
    // Plaka araması — boşluksuz normalize ederek de dene
    const normalized = identifier.replace(/\s+/g, " ").toUpperCase();
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        ...(companyId ? { companyId } : {}),
        OR: [
          { plate: { equals: normalized, mode: "insensitive" } },
          { plate: { contains: identifier.replace(/\s+/g, ""), mode: "insensitive" } },
        ],
      },
      select: { id: true, plate: true, brand: true, model: true },
    });
    if (vehicle) {
      return {
        id: vehicle.id,
        label: `${vehicle.plate}${vehicle.brand ? ` — ${vehicle.brand} ${vehicle.model ?? ""}` : ""}`.trim(),
        type: "vehicle",
        url: `/panel/araclar/${vehicle.id}`,
      };
    }
  }

  if (category === "sofor") {
    const nameParts = identifier.split(" ").filter(Boolean);
    const driver = await prisma.driver.findFirst({
      where: {
        ...(companyId ? { companyId } : {}),
        AND: nameParts.map((part) => ({
          name: { contains: part, mode: "insensitive" },
        })),
      },
      select: { id: true, name: true },
    });
    if (driver) {
      return {
        id: driver.id,
        label: driver.name,
        type: "driver",
        url: `/panel/soforler/${driver.id}`,
      };
    }
  }

  return null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  console.log("[bulk-analyze] dosya sayısı:", files.length, "GEMINI_API_KEY:", !!process.env.GEMINI_API_KEY);

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "Dosya seçilmedi" }, { status: 400 });
  }
  if (files.length > 20) {
    return NextResponse.json({ error: "En fazla 20 dosya yüklenebilir" }, { status: 400 });
  }

  const companyId = (session.user as { companyId?: string | null })?.companyId ?? null;

  const results: BulkAnalyzeResult[] = await Promise.all(
    files.map(async (file): Promise<BulkAnalyzeResult> => {
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const allowed = ["pdf", "jpg", "jpeg", "png"];
      if (!allowed.includes(ext)) {
        return {
          fileName: file.name,
          category: "bilinmiyor",
          docType: null,
          docTitle: null,
          holderIdentifier: null,
          expiryDate: null,
          entityMatch: null,
          error: "Desteklenmeyen format (sadece PDF, JPG, PNG)",
        };
      }

      const mimeType =
        ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";

      try {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const analysis = await analyzeWithGemini(base64, mimeType);

        if (!analysis) {
          return {
            fileName: file.name,
            category: "bilinmiyor",
            docType: null,
            docTitle: null,
            holderIdentifier: null,
            expiryDate: null,
            entityMatch: null,
            error: "AI analizi başarısız",
          };
        }

        const entityMatch = await findEntityMatch(
          analysis.category,
          analysis.holderIdentifier,
          companyId
        );

        return {
          fileName: file.name,
          ...analysis,
          entityMatch,
        };
      } catch (e) {
        return {
          fileName: file.name,
          category: "bilinmiyor",
          docType: null,
          docTitle: null,
          holderIdentifier: null,
          expiryDate: null,
          entityMatch: null,
          error: e instanceof Error ? e.message : "Hata",
        };
      }
    })
  );

  return NextResponse.json({ results });
}
