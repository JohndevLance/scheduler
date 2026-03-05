/**
 * Timezone-aware date/time formatters.
 *
 * All functions accept an IANA timezone string (e.g. "America/New_York").
 * When `tz` is undefined / empty the display falls back to "UTC" so times are
 * at least consistently correct rather than silently using the browser locale.
 */

const resolvedTz = (tz: string | null | undefined) => tz || 'UTC';

/**
 * Returns the short timezone abbreviation for an IANA timezone (e.g. "EST", "EAT", "UTC").
 */
export const tzAbbr = (tz: string | null | undefined): string => {
  const resolved = resolvedTz(tz);
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: resolved,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? resolved;
  } catch {
    return resolved;
  }
};

/**
 * Format just the time portion (e.g. "10:11 AM")
 */
export const fmtTimeInTz = (iso: string, tz?: string | null): string =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: resolvedTz(tz),
  }).format(new Date(iso));

/**
 * Format date + time (e.g. "Thu Mar 5, 10:11 AM")
 */
export const fmtDateTimeInTz = (iso: string, tz?: string | null): string =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: resolvedTz(tz),
  }).format(new Date(iso));

/**
 * Format date only (e.g. "Thu Mar 5")
 */
export const fmtDateInTz = (iso: string, tz?: string | null): string =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: resolvedTz(tz),
  }).format(new Date(iso));

// ─── Shift form helpers ───────────────────────────────────────────────────────

/**
 * Convert a UTC ISO string to a "datetime-local" input value
 * displayed in the given location timezone (e.g. "2026-03-09T09:00").
 *
 * Without this, `iso.slice(0, 16)` shows the UTC wall-clock time which is
 * wrong for any location not in UTC.
 */
export const utcToDatetimeLocal = (iso: string, tz?: string | null): string => {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolvedTz(tz),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? '00';

  const h = get('hour');
  // Intl may return "24" for midnight in some locales
  const normHour = h === '24' ? '00' : h;
  return `${get('year')}-${get('month')}-${get('day')}T${normHour}:${get('minute')}`;
};

/**
 * Convert a "datetime-local" input value to a UTC ISO string,
 * interpreting the wall-clock time as being in the given location timezone.
 *
 * Without this, `new Date(val)` uses the **browser** timezone which will
 * produce wrong UTC times for managers working in a different timezone.
 */
export const datetimeLocalToUTC = (val: string, tz?: string | null): string => {
  const [datePart, timePart = '00:00'] = val.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  const resolvedTimezone = resolvedTz(tz);

  // Start with a UTC approximation that puts us in the right ballpark
  const approx = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // Find out what wall-clock time that UTC moment corresponds to in the target TZ
  const tzParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolvedTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(approx);

  const get = (type: string) =>
    parseInt(tzParts.find((p) => p.type === type)?.value ?? '0');

  const tzHour = get('hour') % 24; // guard against "24"
  const tzMs = Date.UTC(get('year'), get('month') - 1, get('day'), tzHour, get('minute'));

  // Desired wall-clock in ms (treated as UTC for arithmetic)
  const desiredMs = Date.UTC(year, month - 1, day, hour, minute);

  // Shift the approximation by the difference to land on the correct UTC instant
  return new Date(approx.getTime() + (desiredMs - tzMs)).toISOString();
};

