/**
 * Forgiving normalizer for LLM-generated layout JSON.
 *
 * LLMs frequently produce slightly-off output: camelCase keys instead of
 * snake_case, missing required fields, enum values that are near-but-not-
 * exactly what the schema specifies. This normalizer maps common variants,
 * fills defaults, clamps numbers to valid ranges, and produces a clean
 * `{zones, palette}` shape that the renderer accepts — or throws a
 * descriptive error if the input is hopelessly malformed.
 */
import {
  CURATED_FONTS,
  type CurvePreset,
  type FontFamily,
  type Line,
  type Palette,
  type Point,
  type TextEffect,
  type TextSource,
  type Zone,
} from '../types';

const FONT_SET = new Set<string>(CURATED_FONTS);
const TEXT_SOURCES: TextSource[] = [
  'literal',
  'celebrant_name',
  'celebrant_possessive',
  'event_label',
  'event_title',
  'host_name',
  'host_possessive',
  'bride_name',
  'groom_name',
  'names_combined',
  'date_full',
  'date_day_num',
  'date_dow',
  'date_dow_short',
  'date_month',
  'date_month_short',
  'date_year',
  'time',
  'timezone',
  'time_with_tz',
  'venue',
  'rsvp_contact',
  'custom_message',
];
const TEXT_SOURCE_SET = new Set<string>(TEXT_SOURCES);
const EFFECT_SET = new Set<TextEffect>(['none', 'shadow', 'gold', 'outline']);
const CURVE_SET = new Set<CurvePreset>(['flat', 'arc-up', 'arc-down', 'wave', 'circle']);
const ALIGN_SET = new Set<Line['align']>(['left', 'center', 'right']);

export interface NormalizedSuggestion {
  zones: Zone[];
  palette: Palette;
  warnings: string[];
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Pick the first defined value from a list of candidate keys. */
function pick<T = unknown>(obj: Record<string, unknown>, keys: string[], fallback: T): T {
  for (const k of keys) {
    if (k in obj && obj[k] !== null && obj[k] !== undefined) return obj[k] as T;
  }
  return fallback;
}

function asNumber(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

function asString(v: unknown, fallback: string): string {
  if (typeof v === 'string') return v;
  return fallback;
}

function asBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true';
  return fallback;
}

function normalizeFont(raw: unknown, warnings: string[]): FontFamily {
  const candidate = asString(raw, 'Cormorant Garamond');
  if (FONT_SET.has(candidate)) return candidate as FontFamily;
  // Try simple case-insensitive match
  const ci = CURATED_FONTS.find((f) => f.toLowerCase() === candidate.toLowerCase());
  if (ci) return ci;
  warnings.push(`Unknown font "${candidate}" — fell back to Cormorant Garamond`);
  return 'Cormorant Garamond';
}

function normalizeTextSource(raw: unknown, warnings: string[]): TextSource {
  const candidate = asString(raw, 'literal');
  if (TEXT_SOURCE_SET.has(candidate)) return candidate as TextSource;
  // Common alias attempts
  const aliases: Record<string, TextSource> = {
    name: 'celebrant_name',
    celebrant: 'celebrant_name',
    title: 'event_title',
    event: 'event_label',
    host: 'host_name',
    bride: 'bride_name',
    groom: 'groom_name',
    date: 'date_full',
    day: 'date_day_num',
    weekday: 'date_dow',
    month: 'date_month_short',
    year: 'date_year',
    rsvp: 'rsvp_contact',
    message: 'custom_message',
    text: 'literal',
  };
  const aliased = aliases[candidate.toLowerCase()];
  if (aliased) return aliased;
  warnings.push(`Unknown text_source "${candidate}" — fell back to literal`);
  return 'literal';
}

function normalizeEffect(raw: unknown): TextEffect {
  const c = asString(raw, 'shadow');
  return EFFECT_SET.has(c as TextEffect) ? (c as TextEffect) : 'shadow';
}

function normalizeCurve(raw: unknown): CurvePreset {
  const c = asString(raw, 'flat').replace('_', '-');
  return CURVE_SET.has(c as CurvePreset) ? (c as CurvePreset) : 'flat';
}

function normalizeAlign(raw: unknown): Line['align'] {
  const c = asString(raw, 'center');
  return ALIGN_SET.has(c as Line['align']) ? (c as Line['align']) : 'center';
}

function normalizePoint(raw: unknown): Point | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  // Accept {x, y}, [x, y], or {X, Y}
  let x: number, y: number;
  if (Array.isArray(raw)) {
    x = asNumber(raw[0], NaN);
    y = asNumber(raw[1], NaN);
  } else {
    x = asNumber(pick(o, ['x', 'X', 'left', 'cx'], NaN), NaN);
    y = asNumber(pick(o, ['y', 'Y', 'top', 'cy'], NaN), NaN);
  }
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100) };
}

function defaultRect(): Point[] {
  return [
    { x: 10, y: 30 },
    { x: 90, y: 30 },
    { x: 90, y: 60 },
    { x: 10, y: 60 },
  ];
}

function normalizeLine(raw: unknown, idx: number, warnings: string[]): Line {
  const o = (raw ?? {}) as Record<string, unknown>;
  const text_source = normalizeTextSource(
    pick(o, ['text_source', 'textSource', 'source', 'type'], 'literal'),
    warnings
  );
  const literal_text =
    text_source === 'literal'
      ? asString(pick(o, ['literal_text', 'literalText', 'text', 'value'], `Line ${idx + 1}`), '')
      : undefined;
  return {
    text_source,
    literal_text: literal_text === undefined ? undefined : literal_text,
    font_family: normalizeFont(
      pick(o, ['font_family', 'fontFamily', 'font'], 'Cormorant Garamond'),
      warnings
    ),
    font_weight: clamp(
      asNumber(pick(o, ['font_weight', 'fontWeight', 'weight'], 500), 500),
      100,
      900
    ),
    italic: asBool(pick(o, ['italic', 'isItalic'], false), false),
    letter_spacing: asNumber(
      pick(o, ['letter_spacing', 'letterSpacing', 'tracking'], 0.02),
      0.02
    ),
    uppercase: asBool(pick(o, ['uppercase', 'upperCase', 'allCaps'], false), false),
    color: (() => {
      const c = pick<unknown>(o, ['color', 'colour'], null);
      return typeof c === 'string' ? c : undefined;
    })(),
    size_pct: clamp(
      asNumber(pick(o, ['size_pct', 'sizePct', 'size', 'height_pct', 'heightPct'], 30), 30),
      5,
      200
    ),
    align: normalizeAlign(pick(o, ['align', 'alignment', 'textAlign'], 'center')),
    effect: normalizeEffect(pick(o, ['effect', 'textEffect'], 'shadow')),
    curve_preset: normalizeCurve(pick(o, ['curve_preset', 'curvePreset', 'curve'], 'flat')),
    curve_amount: clamp(
      asNumber(pick(o, ['curve_amount', 'curveAmount'], 50), 50),
      0,
      100
    ),
    max_chars: clamp(
      asNumber(pick(o, ['max_chars', 'maxChars', 'max_length'], 60), 60),
      1,
      500
    ),
  };
}

function normalizeZone(raw: unknown, idx: number, warnings: string[]): Zone {
  const o = (raw ?? {}) as Record<string, unknown>;
  const rawPolygon = pick<unknown>(o, ['polygon', 'points', 'shape', 'vertices'], []);
  const polygon = (Array.isArray(rawPolygon) ? rawPolygon : [])
    .map(normalizePoint)
    .filter((p): p is Point => p !== null);
  let finalPolygon = polygon;
  if (finalPolygon.length < 3) {
    warnings.push(`Zone ${idx + 1}: polygon had <3 valid points, using default rectangle`);
    finalPolygon = defaultRect();
  } else if (finalPolygon.length > 24) {
    finalPolygon = finalPolygon.slice(0, 24);
  }

  const rawLines = pick<unknown>(o, ['lines', 'text', 'rows'], []);
  const lines = (Array.isArray(rawLines) ? rawLines : []).map((l, i) =>
    normalizeLine(l, i, warnings)
  );
  if (lines.length === 0) {
    warnings.push(`Zone ${idx + 1}: no lines provided, leaving empty`);
  }

  return {
    id: asString(pick(o, ['id', 'name', 'key'], `zone-${idx + 1}`), `zone-${idx + 1}`),
    polygon: finalPolygon,
    lines,
  };
}

function normalizePalette(raw: unknown, warnings: string[]): Palette {
  const o = (raw ?? {}) as Record<string, unknown>;
  const text_default = asString(
    pick(o, ['text_default', 'textDefault', 'color', 'primary'], '#1a1a1a'),
    '#1a1a1a'
  );
  const altsRaw = pick<unknown>(o, ['text_alts', 'textAlts', 'alts', 'colors'], []);
  const text_alts = (Array.isArray(altsRaw) ? altsRaw : [])
    .map((v) => (typeof v === 'string' ? v : null))
    .filter((v): v is string => v !== null);
  const scrim = (() => {
    const s = pick<unknown>(o, ['scrim', 'overlay'], null);
    return typeof s === 'string' ? s : null;
  })();
  if (!text_alts.includes(text_default)) text_alts.unshift(text_default);
  if (!/^#[0-9a-fA-F]{3,8}$/.test(text_default)) {
    warnings.push(`palette.text_default "${text_default}" is not a valid hex — keeping anyway`);
  }
  return { text_default, text_alts, scrim };
}

/**
 * Parse LLM output and produce a clean suggestion. Handles markdown fences,
 * preamble text, and common schema deviations.
 *
 * Throws if the input cannot be coerced into any usable shape.
 */
export function normalizeSuggestion(rawText: string): NormalizedSuggestion {
  let txt = rawText.trim();
  if (txt.startsWith('```')) {
    txt = txt.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }
  if (!txt.startsWith('{') && !txt.startsWith('[')) {
    const m = txt.match(/\{[\s\S]*\}/);
    if (m) txt = m[0];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(txt);
  } catch (e) {
    throw new Error(
      `Could not parse JSON: ${e instanceof Error ? e.message : String(e)}\n` +
        `First 200 chars: ${txt.slice(0, 200)}`
    );
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Expected a JSON object at the top level.');
  }
  const root = parsed as Record<string, unknown>;
  // Some models wrap output in {"layout": {...}} or {"suggestion": {...}}.
  const container = (root.layout ?? root.suggestion ?? root.data ?? root) as Record<
    string,
    unknown
  >;

  const warnings: string[] = [];
  const zonesRaw = pick<unknown>(container, ['zones', 'regions', 'areas'], []);
  if (!Array.isArray(zonesRaw)) {
    throw new Error('`zones` must be an array.');
  }
  if (zonesRaw.length === 0) {
    throw new Error('No zones provided in suggestion.');
  }
  const zones = zonesRaw.map((z, i) => normalizeZone(z, i, warnings));
  const palette = normalizePalette(pick(container, ['palette', 'colors'], {}), warnings);

  return { zones, palette, warnings };
}
