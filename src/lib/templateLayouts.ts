import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const CURATED_FONTS = [
  'Italiana',
  'Cormorant Garamond',
  'Playfair Display',
  'Bodoni Moda',
  'Cinzel',
  'DM Serif Display',
  'Abril Fatface',
  'Tenor Sans',
  'Inter',
  'Allura',
  'Great Vibes',
  'Sacramento',
] as const;
export type FontFamily = (typeof CURATED_FONTS)[number];

export type TextEffect = 'none' | 'shadow' | 'gold' | 'outline';
export type CurvePreset = 'flat' | 'arc-up' | 'arc-down' | 'wave' | 'circle';

export type TextSource =
  | 'literal'
  | 'celebrant_name'
  | 'celebrant_possessive'
  | 'event_label'
  | 'event_title'
  | 'host_name'
  | 'host_possessive'
  | 'bride_name'
  | 'groom_name'
  | 'names_combined'
  | 'date_full'
  | 'date_day_num'
  | 'date_dow'
  | 'date_dow_short'
  | 'date_month'
  | 'date_month_short'
  | 'date_year'
  | 'time'
  | 'timezone'
  | 'time_with_tz'
  | 'venue'
  | 'rsvp_contact'
  | 'custom_message';

export interface Line {
  text_source: TextSource;
  literal_text?: string;
  font_family: FontFamily;
  font_weight: number;
  italic: boolean;
  letter_spacing: number;
  uppercase?: boolean;
  color?: string;
  size_pct: number;
  align: 'left' | 'center' | 'right';
  effect?: TextEffect;
  curve_preset?: CurvePreset;
  curve_amount?: number;
  max_chars: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Zone {
  id: string;
  /** Polygon vertices in % of image dimensions, clockwise. Min 3, max 24. */
  polygon: Point[];
  lines: Line[];
}

/** Axis-aligned bounding box from polygon points. */
export function polygonBBox(polygon: Point[]): { x: number; y: number; w: number; h: number } {
  if (!polygon.length) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = polygon[0].x;
  let maxX = polygon[0].x;
  let minY = polygon[0].y;
  let maxY = polygon[0].y;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Find the widest horizontal segment inside the polygon at vertical position `y`.
 * Uses the even-odd ray-casting rule: count edge crossings of a horizontal line,
 * sort the intersection x-coords, pair them as (in, out), pick the widest pair.
 * Returns null if the scan line doesn't cross the polygon at all.
 *
 * This is what lets text "fit the shape" — at each line's y, the text gets a
 * width matching the polygon's interior at that height, not the bounding box.
 */
export function polygonHorizontalExtent(
  polygon: Point[],
  y: number
): { left: number; right: number } | null {
  const xs: number[] = [];
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const p0 = polygon[i];
    const p1 = polygon[(i + 1) % n];
    const crosses = (p0.y <= y && p1.y > y) || (p1.y <= y && p0.y > y);
    if (!crosses) continue;
    const t = (y - p0.y) / (p1.y - p0.y);
    xs.push(p0.x + t * (p1.x - p0.x));
  }
  if (xs.length < 2) return null;
  xs.sort((a, b) => a - b);
  // Pair consecutive crossings as (in, out); pick the widest pair (handles concave polys).
  let bestLeft = xs[0];
  let bestRight = xs[1];
  let bestWidth = bestRight - bestLeft;
  for (let i = 2; i + 1 < xs.length; i += 2) {
    const w = xs[i + 1] - xs[i];
    if (w > bestWidth) {
      bestLeft = xs[i];
      bestRight = xs[i + 1];
      bestWidth = w;
    }
  }
  return { left: bestLeft, right: bestRight };
}

/** Build a CSS `clip-path: polygon(...)` value from polygon points relative to bbox. */
export function polygonClipPath(polygon: Point[]): string {
  const bb = polygonBBox(polygon);
  if (bb.w === 0 || bb.h === 0) return 'none';
  const pts = polygon
    .map((p) => {
      const px = ((p.x - bb.x) / bb.w) * 100;
      const py = ((p.y - bb.y) / bb.h) * 100;
      return `${px}% ${py}%`;
    })
    .join(', ');
  return `polygon(${pts})`;
}

export interface Palette {
  text_default: string;
  text_alts: string[];
  scrim: string | null;
}

export interface TemplateLayout {
  template_id: string;
  zones: Zone[];
  palette: Palette;
  updated_at: string | null;
  annotated_by: string | null;
}

type LayoutsMap = Record<string, TemplateLayout>;

let cache: LayoutsMap | null = null;
let inflight: Promise<LayoutsMap> | null = null;

async function fetchLayouts(): Promise<LayoutsMap> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${API_URL}/templates/layouts`);
      if (!res.ok) {
        cache = {};
        return cache;
      }
      const data = await res.json();
      cache = (data?.layouts as LayoutsMap) ?? {};
      return cache;
    } catch {
      cache = {};
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useTemplateLayout(templateId: string | null | undefined) {
  const [layout, setLayout] = useState<TemplateLayout | undefined>(() =>
    templateId && cache ? cache[templateId] : undefined
  );

  useEffect(() => {
    if (!templateId) {
      setLayout(undefined);
      return;
    }
    let cancelled = false;
    fetchLayouts().then((map) => {
      if (!cancelled) setLayout(map[templateId]);
    });
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  return layout;
}

/** Returns the full layouts map. Used by the "designs that fit" picker. */
export function useAllTemplateLayouts(): LayoutsMap {
  const [map, setMap] = useState<LayoutsMap>(() => cache ?? {});
  useEffect(() => {
    let cancelled = false;
    fetchLayouts().then((m) => {
      if (!cancelled) setMap(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return map;
}

export function invalidateTemplateLayouts() {
  cache = null;
  inflight = null;
}
