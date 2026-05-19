import { NextRequest } from "next/server";

/**
 * Gerçek client IP'sini döner.
 * Cloudflare arkasında CF-Connecting-IP header'ı kullanır,
 * yoksa x-forwarded-for'a düşer.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
