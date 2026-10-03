import { timingSafeEqual } from "crypto";

export function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function parseLogin(
  input: unknown,
): { username: string; password: string } | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const { username, password } = input as Record<string, unknown>;
  if (typeof username !== "string" || typeof password !== "string") return null;
  if (
    !username.trim() ||
    !password ||
    username.length > 160 ||
    password.length > 1024
  )
    return null;
  // Password whitespace is significant; match the web login behavior.
  return { username: username.trim(), password };
}

type CompanyAccess = {
  active: boolean;
  isDemo: boolean;
  demoExpiresAt: Date | null;
};
export function companyAccessError(
  company: CompanyAccess | null | undefined,
  now = Date.now(),
): string | null {
  if (!company)
    return "Şirket bilgisi bulunamadı. Lütfen destek ile iletişime geçin.";
  if (!company.active) return "Bu işletmenin erişimi askıya alınmış";
  if (
    company.isDemo &&
    company.demoExpiresAt &&
    company.demoExpiresAt.getTime() <= now
  ) {
    return "Demo süreniz dolmuştur. Abonelik için destek ile iletişime geçin.";
  }
  return null;
}
