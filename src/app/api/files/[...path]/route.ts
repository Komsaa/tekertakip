import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDriverFromRequest } from "@/lib/mobile-auth";
import { s3, BUCKET } from "@/lib/storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    const driver = await getDriverFromRequest(request);
    if (!driver) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Güvenlik: path traversal engelle
  const segments = params.path.map((s) => s.replace(/\.\./g, "").replace(/[/\\]/g, ""));
  const key = segments.join("/");

  try {
    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const chunks: Uint8Array[] = [];
    for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const contentType = obj.ContentType ?? "application/octet-stream";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
  }
}
