/** Date helpers working on YYYY-MM-DD strings (interpreted as UTC). */

export function parseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (
    d.getUTCFullYear() !== Number(m[1]) ||
    d.getUTCMonth() !== Number(m[2]) - 1 ||
    d.getUTCDate() !== Number(m[3])
  ) {
    return null;
  }
  return d;
}

export function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function isValidRange(start: string, end: string): boolean {
  const s = parseDate(start);
  const e = parseDate(end);
  return !!s && !!e && s.getTime() <= e.getTime();
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Today as a YYYY-MM-DD string, using the device's local calendar date. */
export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** "June 2026" for a 0-indexed month. */
export function monthLabel(year: number, month: number): string {
  return `${MONTHS_LONG[month]} ${year}`;
}

export type CalendarCell = { iso: string; day: number; inMonth: boolean };

/**
 * A 6-week grid (rows of 7, Sunday-first) covering the given 0-indexed month,
 * padded with trailing/leading days from adjacent months.
 */
export function monthMatrix(year: number, month: number): CalendarCell[][] {
  const first = new Date(Date.UTC(year, month, 1));
  const gridStart = addDays(first, -first.getUTCDay());
  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < 6; w += 1) {
    const row: CalendarCell[] = [];
    for (let d = 0; d < 7; d += 1) {
      const date = addDays(gridStart, w * 7 + d);
      row.push({ iso: formatDate(date), day: date.getUTCDate(), inMonth: date.getUTCMonth() === month });
    }
    weeks.push(row);
  }
  return weeks;
}

/** "2026-08-14" -> "Fri, Aug 14" */
export function prettyDate(s: string): string {
  const d = parseDate(s);
  if (!d) return s;
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** "2026-08-14" + "2026-08-18" -> "Aug 14 – 18, 2026" */
export function prettyRange(start: string, end: string): string {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return `${start} – ${end}`;
  if (s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear()) {
    return `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()} – ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
  }
  return `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()} – ${MONTHS[e.getUTCMonth()]} ${e.getUTCDate()}, ${e.getUTCFullYear()}`;
}
