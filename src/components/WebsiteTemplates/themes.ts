// Themed invitation system — themes define the full visual identity (palette,
// fonts, ornament style) that a design paints the same content with. The three
// themes are deliberately different colour WORLDS (warm gold / rose / emerald)
// with different type personalities so switching theme feels like a real change.

export type OrnamentStyle = 'royal' | 'floral' | 'minimal';

export interface InviteTheme {
  id: string;
  name: string;
  pageBg: string;     // deep letterbox behind the invite
  surface: string;    // the invitation "paper"
  surfaceAlt: string; // alternating band
  ink: string;        // body text
  muted: string;      // secondary text
  accent: string;     // names / headings
  accentSoft: string; // washes / soft borders
  gold: string;       // metallic line / dividers
  deep: string;       // footer / bands / seal
  scriptFont: string;
  headingFont: string;
  bodyFont: string;
  labelFont: string;
  ornament: OrnamentStyle;
}

export const WEDDING_THEMES: InviteTheme[] = [
  {
    id: 'crimson-royale',
    name: 'Crimson Royale',
    pageBg: '#2c0a10',
    surface: '#fcf4e6',
    surfaceAlt: '#f5e6cf',
    ink: '#43302a',
    muted: '#9a7c5e',
    accent: '#7a1f2b',
    accentSoft: '#e7c9a8',
    gold: '#c19a4b',
    deep: '#591521',
    scriptFont: 'Great Vibes',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'EB Garamond',
    labelFont: 'Marcellus',
    ornament: 'royal',
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    pageBg: '#321b24',
    surface: '#f9eaee',
    surfaceAlt: '#f2d6dd',
    ink: '#5a3a44',
    muted: '#a9737f',
    accent: '#9d4b63',
    accentSoft: '#edcdd2',
    gold: '#c98a6a',
    deep: '#7a3f50',
    scriptFont: 'Pinyon Script',
    headingFont: 'Playfair Display',
    bodyFont: 'Lora',
    labelFont: 'Raleway',
    ornament: 'floral',
  },
  {
    id: 'emerald-ivory',
    name: 'Emerald Ivory',
    pageBg: '#0e211c',
    surface: '#eef2e9',
    surfaceAlt: '#dde6d6',
    ink: '#2c3a30',
    muted: '#6d8273',
    accent: '#2f5d4f',
    accentSoft: '#cdddc9',
    gold: '#b08d57',
    deep: '#21413a',
    scriptFont: 'Allura',
    headingFont: 'Marcellus',
    bodyFont: 'Montserrat',
    labelFont: 'Montserrat',
    ornament: 'minimal',
  },
];

export function themeById(id: string): InviteTheme {
  return WEDDING_THEMES.find((t) => t.id === id) ?? WEDDING_THEMES[0];
}
