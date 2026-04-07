import { Session } from "next-auth";

export function getCompanyId(session: Session): string | null {
  return (session.user as { companyId?: string }).companyId ?? null;
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
