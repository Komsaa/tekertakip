export const DRIVER_DATES: Record<string,string> = { license:"licenseExpiry", psychotech:"psychotechExpiry", criminalRecord:"criminalRecordExpiry", healthReport:"healthReportExpiry", residenceDoc:"residenceDocDate" };
export const VEHICLE_DATES: Record<string,string> = { inspection:"inspectionExpiry", insurance:"insuranceExpiry", routePermit:"routePermitExpiry", approval:"approvalExpiry", kasko:"kaskoExpiry" };
export function validDocumentDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value && Number(value.slice(0,4)) >= 1900;
}
export function readDocumentDates(raw: string) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]);
    if (!data || typeof data !== "object") return null;
    return { expiryDate: validDocumentDate(data.expiryDate) ? data.expiryDate : null, issueDate: validDocumentDate(data.issueDate) ? data.issueDate : null };
  } catch { return null; }
}
