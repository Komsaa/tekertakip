import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToStorage, s3, BUCKET } from "@/lib/storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const DRIVER_FILE_FIELDS: Record<string, string> = {
  src:           "srcFile",
  psychotech:    "psychotechFile",
  criminalRecord:"criminalRecordFile",
  healthReport:  "healthReportFile",
  license:       "licenseFile",
  residenceDoc:  "residenceDocFile",
};

const VEHICLE_FILE_FIELDS: Record<string, string> = {
  inspection:  "inspectionFile",
  insurance:   "insuranceFile",
  routePermit: "routePermitFile",
  approval:    "approvalFile",
  kasko:       "kaskoFile",
  ruhsat:      "ruhsatFile",
  photo:       "photo",
};

// docType → expiry/date DB alanı
const DRIVER_EXPIRY: Record<string, string> = {
  license:      "licenseExpiry",
  residenceDoc: "residenceDocDate",
};
const VEHICLE_EXPIRY: Record<string, string> = {
  inspection:  "inspectionExpiry",
  insurance:   "insuranceExpiry",
  routePermit: "routePermitExpiry",
  approval:    "approvalExpiry",
  kasko:       "kaskoExpiry",
};

const CONTENT_TYPES: Record<string, string> = {
  pdf:  "application/pdf",
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
};

async function parseDocWithGemini(key: string, ext: string): Promise<{ expiryDate: string | null; holderName: string | null; docTitle: string | null } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    const base64 = Buffer.concat(chunks).toString("base64");
    const mimeType = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      `Bu bir Türkçe resmi belge. Belgeden bilgileri çıkar, SADECE JSON döndür:
{"expiryDate":"YYYY-MM-DD veya null","holderName":"string veya null","docTitle":"string veya null"}
expiryDate: geçerlilik/bitiş tarihi. GG.AA.YYYY → YYYY-MM-DD. Emin değilsen null.`,
    ]);
    const text = result.response.text().trim();
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;
    const docType = formData.get("docType") as string;

    if (!file || !entityType || !entityId || !docType) {
      return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
    }
    if (!["driver", "vehicle", "company"].includes(entityType)) {
      return NextResponse.json({ error: "Geçersiz tip" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
    if (!["pdf", "jpg", "jpeg", "png"].includes(ext)) {
      return NextResponse.json({ error: "Sadece PDF, JPG, PNG yüklenebilir" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    const key = `${entityType}/${entityId}/${docType}.${ext}`;

    await uploadToStorage(key, buffer, contentType);
    const fileUrl = `/api/files/${key}`;

    // Dosya alanını DB'ye kaydet
    if (entityType === "driver") {
      const field = DRIVER_FILE_FIELDS[docType];
      if (field) await prisma.driver.update({ where: { id: entityId }, data: { [field]: fileUrl } });
    } else if (entityType === "vehicle") {
      const field = VEHICLE_FILE_FIELDS[docType];
      if (field) await prisma.vehicle.update({ where: { id: entityId }, data: { [field]: fileUrl } });
    }

    // Fotoğraf ve foto gerektirmeyen tipler için parse yapma
    const skipParse = ["photo", "ruhsat", "criminalRecord"];
    let parsed = null;
    if (!skipParse.includes(docType)) {
      parsed = await parseDocWithGemini(key, ext);
      if (parsed?.expiryDate) {
        const expiryVal = new Date(parsed.expiryDate);
        if (!isNaN(expiryVal.getTime())) {
          if (entityType === "driver") {
            const expiryField = DRIVER_EXPIRY[docType];
            if (expiryField) {
              await prisma.driver.update({ where: { id: entityId }, data: { [expiryField]: expiryVal } });
            }
          } else if (entityType === "vehicle") {
            const expiryField = VEHICLE_EXPIRY[docType];
            if (expiryField) {
              await prisma.vehicle.update({ where: { id: entityId }, data: { [expiryField]: expiryVal } });
            }
          }
        }
      }
    }

    return NextResponse.json({ url: fileUrl, parsed });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Sunucu hatası: " + (e instanceof Error ? e.message : "bilinmiyor") }, { status: 500 });
  }
}
