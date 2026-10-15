import { createHmac, timingSafeEqual } from "crypto";

const LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET env var is not set");
  return secret;
}

export function createManagerToken(
  username: string,
  opts?: { companyId?: string | null; role?: string },
): string {
  const companyId = opts?.companyId ?? null;
  const role = opts?.role ?? "admin";
  if (
    !username ||
    !["admin", "firma"].includes(role) ||
    (role !== "admin" && !companyId)
  ) {
    throw new Error("Invalid manager identity");
  }
  const issuedAt = Date.now();
  const payload = Buffer.from(
    JSON.stringify({
      version: 2,
      source: opts ? "panel" : "env",
      username,
      companyId,
      role,
      issuedAt,
      expiresAt: issuedAt + LIFETIME_MS,
    }),
  ).toString("base64url");
  // Sign every claim, including the tenant and role. Legacy signatures are not accepted.
  const signature = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

export function verifyManagerToken(token: string): string | null {
  return verifyManagerTokenFull(token)?.username ?? null;
}

export function verifyManagerTokenFull(
  token: string,
): {
  username: string;
  companyId: string | null;
  role: string;
  source: "panel" | "env";
} | null {
  try {
    if (typeof token !== "string" || token.length > 4096) return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    if (!/^[A-Za-z0-9_-]+$/.test(payload) || !/^[a-f0-9]{64}$/.test(signature))
      return null;
    const expected = createHmac("sha256", getSecret()).update(payload).digest();
    if (!timingSafeEqual(Buffer.from(signature, "hex"), expected)) return null;
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (
      !claims ||
      claims.version !== 2 ||
      typeof claims.username !== "string" ||
      !claims.username
    )
      return null;
    if (!["admin", "firma"].includes(claims.role)) return null;
    if (!["panel", "env"].includes(claims.source)) return null;
    if (
      claims.source === "env" &&
      (claims.role !== "admin" || claims.companyId !== null)
    )
      return null;
    if (
      claims.companyId !== null &&
      (typeof claims.companyId !== "string" || !claims.companyId)
    )
      return null;
    if (claims.role !== "admin" && !claims.companyId) return null;
    const now = Date.now();
    if (
      !Number.isSafeInteger(claims.issuedAt) ||
      !Number.isSafeInteger(claims.expiresAt) ||
      claims.issuedAt > now ||
      claims.expiresAt <= now ||
      claims.expiresAt <= claims.issuedAt ||
      claims.expiresAt - claims.issuedAt > LIFETIME_MS
    )
      return null;
    return {
      username: claims.username,
      companyId: claims.companyId,
      role: claims.role,
      source: claims.source,
    };
  } catch {
    return null;
  }
}
