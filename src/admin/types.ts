export type {
  Line,
  Point,
  Zone,
  Palette,
  TemplateLayout,
  TextSource,
  FontFamily,
  TextEffect,
  CurvePreset,
} from '@/lib/templateLayouts';
import type { FontFamily, TextEffect, CurvePreset, TextSource } from '@/lib/templateLayouts';
export {
  CURATED_FONTS,
  polygonBBox,
  polygonClipPath,
  polygonHorizontalExtent,
} from '@/lib/templateLayouts';

export const FONT_LABELS: Record<FontFamily, string> = {
  Italiana: 'Italiana',
  'Cormorant Garamond': 'Cormorant',
  'Playfair Display': 'Playfair',
  'Bodoni Moda': 'Bodoni',
  Cinzel: 'Cinzel',
  'DM Serif Display': 'DM Serif',
  'Abril Fatface': 'Abril',
  'Tenor Sans': 'Tenor',
  Inter: 'Inter',
  Allura: 'Allura',
  'Great Vibes': 'Great Vibes',
  Sacramento: 'Sacramento',
};

export const FONT_GROUPS: { group: string; fonts: FontFamily[] }[] = [
  {
    group: 'Display Serif',
    fonts: [
      'Italiana',
      'Cormorant Garamond',
      'Playfair Display',
      'Bodoni Moda',
      'Cinzel',
      'DM Serif Display',
      'Abril Fatface',
    ],
  },
  { group: 'Sans', fonts: ['Tenor Sans', 'Inter'] },
  { group: 'Script', fonts: ['Allura', 'Great Vibes', 'Sacramento'] },
];

export const TEXT_SOURCES: { id: TextSource; label: string; example: string }[] = [
  { id: 'literal', label: 'Custom text', example: 'IS TURNING' },
  { id: 'celebrant_name', label: "Celebrant's name", example: 'Alex' },
  { id: 'celebrant_possessive', label: 'Celebrant possessive', example: "Alex's" },
  { id: 'event_label', label: 'Event type', example: 'Birthday' },
  { id: 'event_title', label: 'Event title', example: "Alex's Birthday" },
  { id: 'host_name', label: 'Host name', example: 'Sam' },
  { id: 'host_possessive', label: 'Host possessive', example: "Sam's" },
  { id: 'bride_name', label: 'Bride name', example: 'Riley' },
  { id: 'groom_name', label: 'Groom name', example: 'Jordan' },
  { id: 'names_combined', label: 'Bride & Groom', example: 'Riley & Jordan' },
  { id: 'date_full', label: 'Date (full)', example: 'Thursday, May 28, 2026' },
  { id: 'date_day_num', label: 'Day (28)', example: '28' },
  { id: 'date_dow', label: 'Weekday', example: 'Thursday' },
  { id: 'date_dow_short', label: 'Weekday (THU)', example: 'THU' },
  { id: 'date_month', label: 'Month', example: 'May' },
  { id: 'date_month_short', label: 'Month (MAY)', example: 'MAY' },
  { id: 'date_year', label: 'Year', example: '2026' },
  { id: 'time', label: 'Time', example: '6:30 PM' },
  { id: 'timezone', label: 'Timezone', example: 'ET' },
  { id: 'time_with_tz', label: 'Time + TZ', example: '6:30 PM · ET' },
  { id: 'venue', label: 'Venue', example: '1990 Smokey quartz Rd.' },
  { id: 'rsvp_contact', label: 'RSVP contact', example: '555-1234' },
  { id: 'custom_message', label: 'Custom message', example: 'Cake & celebration await' },
];

export const EFFECTS: TextEffect[] = ['none', 'shadow', 'gold', 'outline'];
export const CURVE_PRESETS: CurvePreset[] = ['flat', 'arc-up', 'arc-down', 'wave', 'circle'];
export const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800];

export const DEFAULT_PALETTE = {
  text_default: '#1a1a1a',
  text_alts: ['#1a1a1a', '#ffffff', '#9cb092', '#c9b037'],
  scrim: null,
};
