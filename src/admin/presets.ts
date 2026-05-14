import type { Line, Point, Zone } from './types';

export interface ZonePreset {
  id: string;
  name: string;
  description: string;
  /** Suggested polygon outline (admin can edit/reshape per template). */
  polygon: Point[];
  lines: Line[];
}

const L = (l: Partial<Line> & { text_source: Line['text_source']; size_pct: number }): Line => ({
  font_family: 'Cormorant Garamond',
  font_weight: 500,
  italic: false,
  letter_spacing: 0.02,
  align: 'center',
  effect: 'shadow',
  curve_preset: 'flat',
  curve_amount: 50,
  max_chars: 40,
  ...l,
});

/** Helper to build a rectangle polygon (4 points clockwise) from x/y/w/h percentages. */
const rect = (x: number, y: number, w: number, h: number): Point[] => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h },
];

/**
 * Six presets inspired by the user's reference images.
 * Polygon is a starting point — admin drags vertices to fit the template's empty space.
 */
export const ZONE_PRESETS: ZonePreset[] = [
  // ── 1. Script Hero Stack ─────────────────────────────────────────
  {
    id: 'script-hero-stack',
    name: 'Script Hero Stack',
    description: 'Big script possessive name + tracked caps event label. Two-line hero.',
    polygon: rect(12, 26, 76, 32),
    lines: [
      L({
        text_source: 'literal',
        literal_text: "You're invited to celebrate",
        font_family: 'Tenor Sans',
        font_weight: 400,
        italic: true,
        letter_spacing: 0.08,
        size_pct: 12,
        max_chars: 40,
      }),
      L({
        text_source: 'celebrant_possessive',
        font_family: 'Allura',
        font_weight: 400,
        letter_spacing: 0.0,
        size_pct: 56,
        max_chars: 18,
      }),
      L({
        text_source: 'event_label',
        font_family: 'Tenor Sans',
        font_weight: 500,
        letter_spacing: 0.4,
        size_pct: 14,
        uppercase: true,
        max_chars: 24,
      }),
    ],
  },
  // ── 2. Date Block Vertical ───────────────────────────────────────
  {
    id: 'date-block-vertical',
    name: 'Date Block Vertical',
    description: 'Month / day / weekday stacked.',
    polygon: rect(6, 66, 22, 24),
    lines: [
      L({
        text_source: 'date_month_short',
        font_family: 'Tenor Sans',
        font_weight: 500,
        letter_spacing: 0.25,
        size_pct: 22,
        uppercase: true,
        max_chars: 6,
      }),
      L({
        text_source: 'date_day_num',
        font_family: 'Bodoni Moda',
        font_weight: 700,
        size_pct: 55,
        max_chars: 4,
      }),
      L({
        text_source: 'date_dow',
        font_family: 'Tenor Sans',
        font_weight: 500,
        letter_spacing: 0.25,
        size_pct: 18,
        uppercase: true,
        max_chars: 10,
      }),
    ],
  },
  // ── 3. Pipe Date Row ─────────────────────────────────────────────
  {
    id: 'pipe-date-row',
    name: 'Pipe Date Row',
    description: 'SAT | AUG 23 | 1:00PM — single tracked row.',
    polygon: rect(10, 72, 80, 6),
    lines: [
      L({
        text_source: 'literal',
        literal_text: '{date_dow_short}  |  {date_month_short} {date_day_num}  |  {time}',
        font_family: 'Tenor Sans',
        font_weight: 500,
        letter_spacing: 0.3,
        size_pct: 70,
        uppercase: true,
        max_chars: 40,
      }),
    ],
  },
  // ── 4. Hero + Script Subtitle ────────────────────────────────────
  {
    id: 'hero-with-script-sub',
    name: 'Hero + Script Subtitle',
    description: 'Massive display word + script accent.',
    polygon: rect(8, 30, 84, 32),
    lines: [
      L({
        text_source: 'event_label',
        font_family: 'DM Serif Display',
        font_weight: 700,
        size_pct: 60,
        uppercase: true,
        letter_spacing: 0.05,
        max_chars: 10,
      }),
      L({
        text_source: 'celebrant_possessive',
        font_family: 'Allura',
        font_weight: 400,
        italic: true,
        size_pct: 35,
        max_chars: 20,
      }),
    ],
  },
  // ── 5. Bold + Script Combo ───────────────────────────────────────
  {
    id: 'bold-script-combo',
    name: 'Bold + Script Combo',
    description: 'Heavy gold caps + flowing script.',
    polygon: rect(10, 25, 80, 40),
    lines: [
      L({
        text_source: 'literal',
        literal_text: 'LOVE',
        font_family: 'DM Serif Display',
        font_weight: 700,
        size_pct: 45,
        uppercase: true,
        effect: 'gold',
        max_chars: 8,
      }),
      L({
        text_source: 'literal',
        literal_text: 'MAKES A',
        font_family: 'Tenor Sans',
        font_weight: 500,
        size_pct: 12,
        uppercase: true,
        letter_spacing: 0.35,
        max_chars: 12,
      }),
      L({
        text_source: 'literal',
        literal_text: 'Family',
        font_family: 'Great Vibes',
        font_weight: 400,
        size_pct: 43,
        max_chars: 12,
      }),
    ],
  },
  // ── 6. Info Stack ────────────────────────────────────────────────
  {
    id: 'info-stack',
    name: 'Info Stack',
    description: 'Time + venue + RSVP, stacked. The "details" block.',
    polygon: rect(12, 78, 76, 16),
    lines: [
      L({
        text_source: 'time_with_tz',
        font_family: 'Tenor Sans',
        font_weight: 500,
        size_pct: 28,
        letter_spacing: 0.18,
        max_chars: 24,
      }),
      L({
        text_source: 'venue',
        font_family: 'Tenor Sans',
        font_weight: 400,
        size_pct: 26,
        uppercase: true,
        letter_spacing: 0.15,
        max_chars: 60,
      }),
      L({
        text_source: 'rsvp_contact',
        font_family: 'Tenor Sans',
        font_weight: 400,
        size_pct: 22,
        letter_spacing: 0.12,
        max_chars: 40,
      }),
    ],
  },
];

export function zoneFromPreset(preset: ZonePreset, idSuffix: number): Zone {
  return {
    id: `${preset.id}-${idSuffix}`,
    polygon: preset.polygon.map((p) => ({ ...p })),
    lines: preset.lines.map((l) => ({ ...l })),
  };
}
