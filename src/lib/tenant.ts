import { Session } from "next-auth";
import { NextResponse } from "next/server";

export function getCompanyId(session: Session): string | null {
  return (session.user as { companyId?: string }).companyId ?? null;
}

export function getRole(session: Session): string {
  return (session.user as { role?: string }).role ?? "firma";
}

// companyId null ise superadmin — filtre yok
// companyId varsa sadece o şirketi göster
export function tenantWhere(companyId: string | null) {
  if (!companyId) return {};
  return { companyId };
}

export function tenantData(companyId: string | null) {
  if (!companyId) return {};
  return { companyId };
}

// Yalnızca admin rolü gerekiyorsa — 403 döner
export function requireAdmin(session: Session): NextResponse | null {
  if (getRole(session) !== "admin") {
    return NextResponse.json({ error: "Yetkisiz: yalnızca admin erişebilir" }, { status: 403 });
  }
  return null;
}
