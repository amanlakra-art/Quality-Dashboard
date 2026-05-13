export interface Highlight {
  id: string;
  text: string;
  weekStart: string; // ISO date of Monday, e.g. "2026-05-11"
  createdAt: string; // ISO timestamp
}

/** Returns YYYY-MM-DD for the Monday of the week containing d (local date, Mon–Sun). */
export function getWeekStart(d: Date = new Date()): string {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay(); // 0=Sun .. 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

/** "May 11 – May 17, 2026" */
export function formatWeekRange(weekStart: string): string {
  const mon = new Date(weekStart + 'T00:00:00Z');
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const year = sun.getUTCFullYear();
  return `${fmt(mon)} – ${fmt(sun)}, ${year}`;
}
