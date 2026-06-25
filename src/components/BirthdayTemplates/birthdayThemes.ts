import type { InviteTheme } from '../WebsiteTemplates/themes';

export type PartyStyle = 'star' | 'confetti' | 'minimal';

/* BirthdayTheme extends InviteTheme so Countdown / Reveal / etc.
   from inviteParts.tsx accept it directly */
export interface BirthdayTheme extends InviteTheme {
  partyStyle: PartyStyle;
}

export const BIRTHDAY_THEMES: BirthdayTheme[] = [
  {
    id:           'golden-hour',
    name:         'Golden Hour',
    pageBg:       '#1a0e00',
    surface:      '#fffaf0',
    surfaceAlt:   '#f7ecd8',
    ink:          '#3d2400',
    muted:        '#8a6228',
    accent:       '#7a3800',
    accentSoft:   '#f0d0a8',
    gold:         '#d4890f',
    deep:         '#5c2400',
    scriptFont:   'Parisienne',
    headingFont:  'Playfair Display',
    bodyFont:     'Lora',
    labelFont:    'Raleway',
    ornament:     'minimal',
    partyStyle:   'star',
  },
  {
    id:           'midnight-velvet',
    name:         'Midnight Velvet',
    pageBg:       '#05080f',
    surface:      '#f0f2ff',
    surfaceAlt:   '#dde0f8',
    ink:          '#1a1d3d',
    muted:        '#5a60a8',
    accent:       '#1a237e',
    accentSoft:   '#c0c8f0',
    gold:         '#b8a8e8',
    deep:         '#06091a',
    scriptFont:   'Allura',
    headingFont:  'Cormorant Garamond',
    bodyFont:     'EB Garamond',
    labelFont:    'Marcellus',
    ornament:     'minimal',
    partyStyle:   'star',
  },
  {
    id:           'flamingo',
    name:         'Flamingo',
    pageBg:       '#200015',
    surface:      '#fff0fa',
    surfaceAlt:   '#f8d8ef',
    ink:          '#3d0030',
    muted:        '#9b3d78',
    accent:       '#aa0060',
    accentSoft:   '#f0c0de',
    gold:         '#ff5f9e',
    deep:         '#5c0040',
    scriptFont:   'Pinyon Script',
    headingFont:  'Playfair Display',
    bodyFont:     'Lora',
    labelFont:    'Raleway',
    ornament:     'floral',
    partyStyle:   'confetti',
  },
];

export function birthdayThemeById(id: string): BirthdayTheme {
  return BIRTHDAY_THEMES.find((t) => t.id === id) ?? BIRTHDAY_THEMES[0];
}
