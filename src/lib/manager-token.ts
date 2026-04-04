import { createHmac } from "crypto";

const PERIOD_MS = 1000 * 60 * 60 * 24 * 30; // 30 gün

function getSecret() {
  return process.env.NEXTAUTH_SECRET || "tekertakip-secret";
}

export function createManagerToken(username: string): string {
  const period = Math.floor(Date.now() / PERIOD_MS);
  const payload = Buffer.from(JSON.stringify({ username, period })).toString("base64url");
  const hash = createHmac("sha256", getSecret()).update(`${username}:${period}`).digest("hex");
  return `${payload}.${hash}`;
}

export function verifyManagerToken(token: string): string | null {
  try {
    const [payloadB64, hash] = token.split(".");
    const { username, period } = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    const currentPeriod = Math.floor(Date.now() / PERIOD_MS);
    if (Math.abs(period - currentPeriod) > 1) return null; // en fazla 1 period tolerans
    const expected = createHmac("sha256", getSecret()).update(`${username}:${period}`).digest("hex");
    if (hash !== expected) return null;
    return username as string;
  } catch {
    return null;
  }
}
