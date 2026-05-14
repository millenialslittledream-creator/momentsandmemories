/**
 * Compute a template's per-source character capacity from its saved layout.
 * Returns null when no layout is saved (no enforcement possible).
 */
import type { TemplateLayout, TextSource } from '@/lib/templateLayouts';

export type CapacityMap = Partial<Record<TextSource, number>>;

export function layoutCapacity(layout: TemplateLayout | undefined): CapacityMap {
  if (!layout) return {};
  const cap: CapacityMap = {};
  for (const zone of layout.zones) {
    for (const line of zone.lines) {
      const cur = cap[line.text_source];
      if (cur === undefined || line.max_chars > cur) {
        cap[line.text_source] = line.max_chars;
      }
    }
  }
  return cap;
}

/** Capacity for a specific source, defaulting to a generous fallback. */
export function capacityFor(
  layout: TemplateLayout | undefined,
  source: TextSource,
  fallback = 200
): number {
  if (!layout) return fallback;
  const map = layoutCapacity(layout);
  return map[source] ?? fallback;
}
