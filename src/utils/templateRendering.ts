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
 * Breaks `text` into 2 lines at the nearest word boundary once length exceeds `limit`.
 * Prefers a space at/before the limit; falls back to the first space after the limit.
 * If no spaces exist at all, returns the text unchanged.
 */
function wrapAfter(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const beforeIdx = text.lastIndexOf(' ', limit);
  const breakIdx = beforeIdx > 0 ? beforeIdx : text.indexOf(' ', limit);
  if (breakIdx <= 0) return text;
  return text.slice(0, breakIdx) + '\n' + text.slice(breakIdx + 1);
}

export function formatFieldValue(
  field: TemplateFieldLayout,
  formData: Record<string, string>
): string {
  // Static text takes priority — no formData lookup.
  if (field.text !== undefined) {
    const out = (field.prefix || '') + field.text + (field.suffix || '');
    return field.wrapAfterChars ? wrapAfter(out, field.wrapAfterChars) : out;
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
  } else if (field.format === 'time12') {
    formatted = formatTime12(raw);
  }
  const out = (field.prefix || '') + formatted + (field.suffix || '');
  return field.wrapAfterChars ? wrapAfter(out, field.wrapAfterChars) : out;
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
