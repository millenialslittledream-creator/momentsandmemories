export type SectionType =
  | 'hero'
  | 'our_story'
  | 'schedule'
  | 'gallery'
  | 'rsvp'
  | 'map'
  | 'faq'
  | 'custom_text';

export interface ScheduleItem {
  name: string;
  time: string;
  location: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SectionContent {
  heading?: string;
  subtitle?: string;
  body?: string;
  date?: string;
  coverImageUrl?: string;
  address?: string;
  mapEmbedUrl?: string;
  items?: ScheduleItem[] | FaqItem[];
  photos?: string[];
}

export interface WebsiteSection {
  id: string;
  type: SectionType;
  content: SectionContent;
}

export type ThemeBorderStyle = 'none' | 'hairline' | 'double';

export interface WebsiteTheme {
  /** @deprecated use accentColor — kept so existing saved websites keep working */
  primaryColor: string;
  /** @deprecated use headingFont — kept so existing saved websites keep working */
  fontFamily: string;
  accentColor?: string;
  backgroundColor?: string;
  headingFont?: string;
  bodyFont?: string;
  borderStyle?: ThemeBorderStyle;
}

export const DEFAULT_THEME: WebsiteTheme = {
  primaryColor: '#9cb092',
  fontFamily: 'Cormorant Garamond',
  accentColor: '#9cb092',
  backgroundColor: '#fbf9f4',
  headingFont: 'Cormorant Garamond',
  bodyFont: 'Cormorant Garamond',
  borderStyle: 'hairline',
};

// Resolves new theme fields with fallback to the legacy two-field shape, so themes saved
// before this change (just primaryColor/fontFamily) still render with sensible values.
export function resolveTheme(theme: WebsiteTheme) {
  return {
    accentColor: theme.accentColor ?? theme.primaryColor ?? DEFAULT_THEME.primaryColor,
    backgroundColor: theme.backgroundColor ?? DEFAULT_THEME.backgroundColor!,
    headingFont: theme.headingFont ?? theme.fontFamily ?? DEFAULT_THEME.fontFamily,
    bodyFont: theme.bodyFont ?? theme.fontFamily ?? DEFAULT_THEME.fontFamily,
    borderStyle: theme.borderStyle ?? 'hairline',
  };
}

export interface ThemePreset {
  name: string;
  description: string;
  theme: WebsiteTheme;
}

// Three premade visual identities, each pairing one accent from the existing dark-editorial
// palette with a serif/script heading + clean body font, per the editorial wedding-stationery brief.
export const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Sage Garden',
    description: 'Soft sage accent, ivory ground, hairline dividers.',
    theme: {
      primaryColor: '#9cb092',
      fontFamily: 'Cormorant Garamond',
      accentColor: '#9cb092',
      backgroundColor: '#fbf9f4',
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Lora',
      borderStyle: 'hairline',
    },
  },
  {
    name: 'Ivory Classic',
    description: 'Gold-ochre accent, bright ivory ground, double-line dividers.',
    theme: {
      primaryColor: '#a8893d',
      fontFamily: 'Playfair Display',
      accentColor: '#a8893d',
      backgroundColor: '#fffdf8',
      headingFont: 'Playfair Display',
      bodyFont: 'EB Garamond',
      borderStyle: 'double',
    },
  },
  {
    name: 'Terracotta Bloom',
    description: 'Warm terracotta accent, soft cream ground, hairline dividers.',
    theme: {
      primaryColor: '#c47a55',
      fontFamily: 'Marcellus',
      accentColor: '#c47a55',
      backgroundColor: '#fbf6ef',
      headingFont: 'Marcellus',
      bodyFont: 'Raleway',
      borderStyle: 'hairline',
    },
  },
];

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero / Cover',
  our_story: 'Our Story',
  schedule: 'Schedule',
  gallery: 'Photo Gallery',
  rsvp: 'RSVP',
  map: 'Venue / Map',
  faq: 'FAQ',
  custom_text: 'Custom Text',
};

let counter = 0;
export function nextSectionId(): string {
  counter += 1;
  return `section-${Date.now()}-${counter}`;
}

export function defaultContentFor(type: SectionType): SectionContent {
  switch (type) {
    case 'hero':
      return { heading: "Let's Celebrate", subtitle: '', date: '', coverImageUrl: '' };
    case 'our_story':
      return { heading: 'Our Story', body: '', photos: [] };
    case 'schedule':
      return { heading: 'Schedule', items: [] as ScheduleItem[] };
    case 'gallery':
      return { heading: 'Photo Gallery' };
    case 'rsvp':
      return { heading: 'RSVP', body: 'Check your invitation email or text message for your personal RSVP link.' };
    case 'map':
      return { heading: 'Venue', address: '', mapEmbedUrl: '' };
    case 'faq':
      return { heading: 'Frequently Asked Questions', items: [] as FaqItem[] };
    case 'custom_text':
      return { heading: '', body: '' };
  }
}
