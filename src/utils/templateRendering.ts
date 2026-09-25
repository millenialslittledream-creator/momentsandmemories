import type { TemplateFieldLayout } from '@/data/eviteTemplates';

function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLongDateDayFirst(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const rest = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `${weekday}\n${rest}`;
}

function formatLongDateUpper(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  const day = d.getDate();
  const ord = ordinalSuffix(day).toUpperCase();
  return `${weekday}, ${month} ${day}${ord}, ${d.getFullYear()}`;
}

// Day-first single line, Title Case: "Sunday, 15 June 2025".
// Used by the baby-shower concept cards, whose detail blocks read day-first.
function formatLongDateDayMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday}, ${d.getDate()} ${month} ${d.getFullYear()}`;
}

// Day-first single line, CAPS: "SUNDAY, 15 JUNE 2025".
function formatLongDateDayMonthUpper(dateStr: string): string {
  return formatLongDateDayMonth(dateStr).toUpperCase();
}

// Ordinal date on its own, Title Case: "25th May 2025". Pairs with
// formatWeekdayTitle for concepts that print the date and the weekday at
// two DIFFERENT sizes (so they can't share one two-line field).
function formatOrdinalDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  return `${day}${ordinalSuffix(day)} ${month} ${d.getFullYear()}`;
}

// Weekday on its own, Title Case: "Sunday".
function formatWeekdayTitle(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

// Two lines, Title Case: "25th May 2025" / "Sunday".
// The baby-shower concept cards print the ordinal date above the weekday.
function formatOrdinalDateThenWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  return `${day}${ordinalSuffix(day)} ${month} ${d.getFullYear()}
${weekday}`;
}

// Two lines, CAPS: "SUNDAY" / "15 JUNE 2025".
function formatWeekdayThenDayMonthUpper(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  return `${weekday}
${d.getDate()} ${month} ${d.getFullYear()}`;
}

// Date parts, for templates that lay the date out in separate blocks
// (e.g. "SATURDAY" / "22" / "MARCH 2026").
function formatWeekdayUpper(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
}

function formatDayOfMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return String(d.getDate());
}

// "22 JUNE 2025" — day + month + year on one line, no weekday.
function formatDayMonthYearUpper(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  return `${d.getDate()} ${month} ${d.getFullYear()}`;
}

function formatMonthYearUpper(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  const month = d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  return `${month} ${d.getFullYear()}`;
}

// Date parts, for "OCT | 20 | 2026"-style stamps that split the date across
// 3 separately-sized fields (abbreviated month, big day number, year).
function formatMonthAbbrUpper(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function formatYearOnly(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return String(d.getFullYear());
}

// First letter, uppercased — for monogram-style "A | R" initials treatments.
function formatFirstLetterUpper(text: string): string {
  return text.trim().charAt(0).toUpperCase();
}

// First word only — for designs that print a large first name with the
// surname on its own smaller line below (e.g. "Ananya" / "Sharma").
// A single-word name (no surname given) just renders as-is.
function formatFirstWord(text: string): string {
  return text.trim().split(/\s+/)[0] || '';
}

// Everything after the first word — the surname line paired with
// formatFirstWord above. Empty when the name has no surname, so the
// (smaller, decorative) surname line simply doesn't render.
function formatRestOfName(text: string): string {
  const parts = text.trim().split(/\s+/);
  return parts.slice(1).join(' ');
}

function formatTime12(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  const hh = Number(hStr);
  const mm = Number(mStr);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return timeStr;
  const meridian = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${mm.toString().padStart(2, '0')} ${meridian}`;
}

/**
 * Word-wraps `text` into as many lines as needed, each at most `limit`
 * characters, breaking at the nearest space. Long venues/addresses cascade
 * onto line 2, 3, 4… instead of overflowing. A single word longer than the
 * limit is kept on its own line.
 */
function wrapAfter(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const lines: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    let breakIdx = rest.lastIndexOf(' ', limit);
    if (breakIdx <= 0) {
      breakIdx = rest.indexOf(' ', limit);
      if (breakIdx <= 0) {
        lines.push(rest);
        return lines.join('\n');
      }
    }
    lines.push(rest.slice(0, breakIdx));
    rest = rest.slice(breakIdx + 1).trimStart();
  }
  if (rest) lines.push(rest);
  return lines.join('\n');
}

/**
 * Wraps at `limit`, but never onto more than `maxLines` lines: if the greedy
 * wrap spills, the limit is widened a character at a time until it fits.
 *
 * Concept cards position every value at a fixed y, so a block that grows
 * downwards runs into whatever the artwork puts below it. For the cards whose
 * venue sits directly above the closing note, a longer-than-sample address has
 * to get WIDER rather than taller — this keeps the designer's own line breaks
 * for normal-length values and only widens once there's no room left.
 */
function wrapWithin(text: string, limit: number, maxLines: number): string {
  let out = wrapAfter(text, limit);
  let lim = limit;
  while (out.split('\n').length > maxLines && lim < text.length) {
    lim += 1;
    out = wrapAfter(text, lim);
  }
  return out;
}

function wrapField(field: TemplateFieldLayout, text: string): string {
  if (!field.wrapAfterChars) return text;
  return field.maxLines
    ? wrapWithin(text, field.wrapAfterChars, field.maxLines)
    : wrapAfter(text, field.wrapAfterChars);
}

export function formatFieldValue(
  field: TemplateFieldLayout,
  formData: Record<string, string>
): string {
  // Static text takes priority — no formData lookup.
  if (field.text !== undefined) {
    const out = (field.prefix || '') + field.text + (field.suffix || '');
    return wrapField(field, out);
  }

  if (!field.formKey) return '';
  const raw = formData[field.formKey];
  if (!raw) return '';

  let formatted = raw;
  if (field.format === 'longDate') {
    formatted = formatLongDate(raw);
  } else if (field.format === 'longDateDayFirst') {
    formatted = formatLongDateDayFirst(raw);
  } else if (field.format === 'longDateUpper') {
    formatted = formatLongDateUpper(raw);
  } else if (field.format === 'longDateDayMonth') {
    formatted = formatLongDateDayMonth(raw);
  } else if (field.format === 'longDateDayMonthUpper') {
    formatted = formatLongDateDayMonthUpper(raw);
  } else if (field.format === 'ordinalDateThenWeekday') {
    formatted = formatOrdinalDateThenWeekday(raw);
  } else if (field.format === 'ordinalDate') {
    formatted = formatOrdinalDate(raw);
  } else if (field.format === 'weekdayTitle') {
    formatted = formatWeekdayTitle(raw);
  } else if (field.format === 'weekdayThenDayMonthUpper') {
    formatted = formatWeekdayThenDayMonthUpper(raw);
  } else if (field.format === 'weekdayUpper') {
    formatted = formatWeekdayUpper(raw);
  } else if (field.format === 'dayOfMonth') {
    formatted = formatDayOfMonth(raw);
  } else if (field.format === 'monthYearUpper') {
    formatted = formatMonthYearUpper(raw);
  } else if (field.format === 'dayMonthYearUpper') {
    formatted = formatDayMonthYearUpper(raw);
  } else if (field.format === 'monthAbbrUpper') {
    formatted = formatMonthAbbrUpper(raw);
  } else if (field.format === 'yearOnly') {
    formatted = formatYearOnly(raw);
  } else if (field.format === 'time12') {
    formatted = formatTime12(raw);
  } else if (field.format === 'firstLetterUpper') {
    formatted = formatFirstLetterUpper(raw);
  } else if (field.format === 'firstWord') {
    formatted = formatFirstWord(raw);
  } else if (field.format === 'restOfName') {
    formatted = formatRestOfName(raw);
  }
  const out = (field.prefix || '') + formatted + (field.suffix || '');
  return wrapField(field, out);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
