import { createHmac } from "crypto";

const PERIOD_MS = 1000 * 60 * 60 * 24 * 30; // 30 gün

function getSecret() {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET env var is not set");
  return s;
}

export function createManagerToken(username: string, opts?: { companyId?: string | null; role?: string }): string {
  const period = Math.floor(Date.now() / PERIOD_MS);
  const payload = Buffer.from(JSON.stringify({
    username, period,
    companyId: opts?.companyId ?? null,
    role: opts?.role ?? "admin",
  })).toString("base64url");
  const hash = createHmac("sha256", getSecret()).update(`${username}:${period}`).digest("hex");
  return `${payload}.${hash}`;
}

export function verifyManagerToken(token: string): string | null {
  return verifyManagerTokenFull(token)?.username ?? null;
}

export function verifyManagerTokenFull(token: string): { username: string; companyId: string | null; role: string } | null {
  try {
    const [payloadB64, hash] = token.split(".");
    const { username, period, companyId, role } = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    const currentPeriod = Math.floor(Date.now() / PERIOD_MS);
    if (Math.abs(period - currentPeriod) > 1) return null;
    const expected = createHmac("sha256", getSecret()).update(`${username}:${period}`).digest("hex");
    if (hash !== expected) return null;
    return { username: username as string, companyId: companyId ?? null, role: role ?? "admin" };
  } catch {
    return null;
  }
}
