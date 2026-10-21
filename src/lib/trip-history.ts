// Turkey has used UTC+03:00 throughout this application's recording period.
export function historyDay(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < "2017-01-01") return null;
  const midnight = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(midnight.getTime()) || midnight.toISOString().slice(0, 10) !== date) return null;
  const start = new Date(`${date}T00:00:00+03:00`);
  return { gte: start, lt: new Date(start.getTime() + 86400000) };
}
