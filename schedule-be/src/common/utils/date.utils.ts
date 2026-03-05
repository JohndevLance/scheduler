/**
 * Shared date/time utilities — all operations in UTC to avoid DST surprises.
 * Shift times are always stored as UTC; these helpers operate in kind.
 */

/** Clone a date and set its time to 00:00:00.000 UTC. */
export function startOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Clone a date and set its time to 23:59:59.999 UTC. */
export function endOfDayUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/** Add (or subtract, if negative) calendar days in UTC. Returns a new Date. */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Return the Sunday that starts the ISO calendar week containing `date`
 * (used by the overtime / week-hours rolling window).
 */
export function getWeekStartSunday(date: Date): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay()); // back to Sunday
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Return the Saturday end-of-day that closes the week starting from
 * `getWeekStartSunday`.
 */
export function getWeekEndSunday(date: Date): Date {
  const d = getWeekStartSunday(date);
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Return the Monday that starts the ISO week containing `date`
 * (used by the schedule / analytics weekly views).
 */
export function getWeekStartMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Return a YYYY-MM-DD string from a UTC Date (no timezone shift). */
export function toUTCDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Convert a Date to total minutes since midnight UTC. */
export function toUTCMinutes(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

/**
 * Convert a Date to minutes since midnight in the given IANA timezone.
 * Uses the built-in Intl API — no external dependency needed.
 */
export function toLocalMinutes(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const h = parseInt(parts.find((p) => p.type === 'hour')!.value, 10);
  const m = parseInt(parts.find((p) => p.type === 'minute')!.value, 10);
  // Intl may return 24 for midnight
  return (h === 24 ? 0 : h) * 60 + m;
}

/**
 * Returns the day-of-week (0=Sun … 6=Sat) in the given IANA timezone.
 */
export function toLocalDayOfWeek(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).formatToParts(date);
  const weekday = parts.find((p) => p.type === 'weekday')!.value;
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
}

/**
 * Returns a YYYY-MM-DD date string in the given IANA timezone.
 */
export function toLocalDateString(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')!.value;
  const mo = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${mo}-${d}`;
}
