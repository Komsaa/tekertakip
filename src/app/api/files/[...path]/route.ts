import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDriverFromRequest } from "@/lib/mobile-auth";
import { getPresignedUrl } from "@/lib/storage";

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
    const url = await getPresignedUrl(key);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
  }
}
