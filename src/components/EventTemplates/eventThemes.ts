// Three colour "worlds" per event. Same InviteTheme shape the wedding system
// uses, so all shared primitives (Countdown, Divider, WaxSeal, …) just work.
import type { InviteTheme } from '../WebsiteTemplates/themes';

export type EventKey = 'babyshower' | 'bridetobe' | 'genderreveal' | 'housewarming' | 'custom';

/* ── Baby Shower — tender, soft, pastel ─────────────────────────────────── */
export const BABYSHOWER_THEMES: InviteTheme[] = [
  {
    id: 'powder-sky', name: 'Powder Sky',
    pageBg: '#1b2a3a', surface: '#f4f9ff', surfaceAlt: '#e4f0fb',
    ink: '#33475b', muted: '#7c93a8', accent: '#5b86b0', accentSoft: '#cfe3f4',
    gold: '#9fc0dd', deep: '#2c4258',
    scriptFont: 'Great Vibes', headingFont: 'Cormorant Garamond', bodyFont: 'Lora', labelFont: 'Raleway',
    ornament: 'minimal',
  },
  {
    id: 'rosewater', name: 'Rosewater',
    pageBg: '#3a1f2a', surface: '#fff3f5', surfaceAlt: '#fbe1e8', ink: '#5c3843',
    muted: '#b07f8c', accent: '#c9748c', accentSoft: '#f6d5dd', gold: '#e0a6b4', deep: '#7a3f52',
    scriptFont: 'Pinyon Script', headingFont: 'Playfair Display', bodyFont: 'Lora', labelFont: 'Raleway',
    ornament: 'floral',
  },
  {
    id: 'buttercream', name: 'Buttercream',
    pageBg: '#2c2a1c', surface: '#fdfaef', surfaceAlt: '#f3edd6', ink: '#4a452f',
    muted: '#9a916b', accent: '#b79a4e', accentSoft: '#ece2b8', gold: '#cdb46a', deep: '#5a5232',
    scriptFont: 'Allura', headingFont: 'Marcellus', bodyFont: 'Montserrat', labelFont: 'Montserrat',
    ornament: 'minimal',
  },
];

/* ── Pre-Wedding Party — chic, glam, celebratory ────────────────────────── */
export const BRIDETOBE_THEMES: InviteTheme[] = [
  {
    id: 'blush-bubbly', name: 'Blush & Bubbly',
    pageBg: '#2e1620', surface: '#fdeef0', surfaceAlt: '#f8d9df', ink: '#5b3540',
    muted: '#b07d89', accent: '#c25a74', accentSoft: '#f4cdd5', gold: '#d9a86a', deep: '#7c3a4d',
    scriptFont: 'Pinyon Script', headingFont: 'Playfair Display', bodyFont: 'Lora', labelFont: 'Raleway',
    ornament: 'floral',
  },
  {
    id: 'noir-glam', name: 'Noir Glam',
    pageBg: '#0c0c0f', surface: '#f6f1e7', surfaceAlt: '#e8ddc7', ink: '#2a2620',
    muted: '#8c8375', accent: '#111114', accentSoft: '#d8c9a2', gold: '#caa24a', deep: '#17171b',
    scriptFont: 'Great Vibes', headingFont: 'Cormorant Garamond', bodyFont: 'Montserrat', labelFont: 'Marcellus',
    ornament: 'royal',
  },
  {
    id: 'tropical-sunset', name: 'Tropical Sunset',
    pageBg: '#25121c', surface: '#fff3ea', surfaceAlt: '#ffe0cf', ink: '#5a3a34',
    muted: '#c07d68', accent: '#e0684a', accentSoft: '#ffd2b8', gold: '#e8a24c', deep: '#a13d55',
    scriptFont: 'Allura', headingFont: 'Playfair Display', bodyFont: 'Montserrat', labelFont: 'Raleway',
    ornament: 'floral',
  },
];

/* ── Gender Reveal — playful suspense, blue vs pink ─────────────────────── */
export const GENDERREVEAL_THEMES: InviteTheme[] = [
  {
    id: 'he-or-she', name: 'He or She',
    pageBg: '#181b2e', surface: '#f6f4fb', surfaceAlt: '#e7e4f4', ink: '#3a3a52',
    muted: '#8a88a6', accent: '#6d6fb0', accentSoft: '#dcd9f2', gold: '#c9a6d8', deep: '#2c2d4a',
    scriptFont: 'Great Vibes', headingFont: 'Cormorant Garamond', bodyFont: 'Montserrat', labelFont: 'Raleway',
    ornament: 'minimal',
  },
  {
    id: 'team-blue', name: 'Team Blue',
    pageBg: '#0f2438', surface: '#eef6fd', surfaceAlt: '#d6e8f6', ink: '#28425a',
    muted: '#6d8ba5', accent: '#2f74b0', accentSoft: '#c3ddf1', gold: '#79b0dc', deep: '#1c3d59',
    scriptFont: 'Allura', headingFont: 'Marcellus', bodyFont: 'Montserrat', labelFont: 'Montserrat',
    ornament: 'minimal',
  },
  {
    id: 'team-pink', name: 'Team Pink',
    pageBg: '#37162a', surface: '#fff0f6', surfaceAlt: '#fbdcea', ink: '#5c3548',
    muted: '#bb7d97', accent: '#d15c8b', accentSoft: '#f7cfe0', gold: '#eaa0c0', deep: '#7e3559',
    scriptFont: 'Pinyon Script', headingFont: 'Playfair Display', bodyFont: 'Lora', labelFont: 'Raleway',
    ornament: 'floral',
  },
];

/* ── Housewarming — warm, cozy, grounded ────────────────────────────────── */
export const HOUSEWARMING_THEMES: InviteTheme[] = [
  {
    id: 'terracotta', name: 'Terracotta',
    pageBg: '#2a160f', surface: '#fbf1e8', surfaceAlt: '#f0dcc9', ink: '#4d352a',
    muted: '#a37e66', accent: '#bf6a43', accentSoft: '#eccdb6', gold: '#cf9a5c', deep: '#743f2a',
    scriptFont: 'Allura', headingFont: 'Cormorant Garamond', bodyFont: 'Lora', labelFont: 'Marcellus',
    ornament: 'minimal',
  },
  {
    id: 'sage-oak', name: 'Sage & Oak',
    pageBg: '#18241b', surface: '#f2f5ec', surfaceAlt: '#e0e8d5', ink: '#39432f',
    muted: '#7d8a6c', accent: '#5c7148', accentSoft: '#d3dec5', gold: '#a98f56', deep: '#2f3d28',
    scriptFont: 'Great Vibes', headingFont: 'Marcellus', bodyFont: 'Montserrat', labelFont: 'Montserrat',
    ornament: 'minimal',
  },
  {
    id: 'midnight-brass', name: 'Midnight Brass',
    pageBg: '#111418', surface: '#f3efe6', surfaceAlt: '#e2dccb', ink: '#2c2e2b',
    muted: '#89877c', accent: '#1f2833', accentSoft: '#d3cdb8', gold: '#c2a25a', deep: '#1a1f26',
    scriptFont: 'Great Vibes', headingFont: 'Cormorant Garamond', bodyFont: 'Montserrat', labelFont: 'Marcellus',
    ornament: 'royal',
  },
];

/* ── Others / Custom — versatile, elegant ───────────────────────────────── */
export const CUSTOM_THEMES: InviteTheme[] = [
  {
    id: 'golden-hour', name: 'Golden Hour',
    pageBg: '#26190c', surface: '#fdf6ea', surfaceAlt: '#f3e6cd', ink: '#493a26',
    muted: '#9c8564', accent: '#b6863b', accentSoft: '#ecd9b3', gold: '#d0a852', deep: '#5e441f',
    scriptFont: 'Great Vibes', headingFont: 'Cormorant Garamond', bodyFont: 'EB Garamond', labelFont: 'Marcellus',
    ornament: 'royal',
  },
  {
    id: 'ink-pearl', name: 'Ink & Pearl',
    pageBg: '#101216', surface: '#f5f5f2', surfaceAlt: '#e5e5df', ink: '#2b2d31',
    muted: '#84868c', accent: '#23262c', accentSoft: '#d6d6cf', gold: '#9aa0a6', deep: '#181a1f',
    scriptFont: 'Allura', headingFont: 'Playfair Display', bodyFont: 'Montserrat', labelFont: 'Montserrat',
    ornament: 'minimal',
  },
  {
    id: 'botanical', name: 'Botanical',
    pageBg: '#132119', surface: '#f0f4ea', surfaceAlt: '#dde7d4', ink: '#2e3b2f',
    muted: '#6f8471', accent: '#3f6b4c', accentSoft: '#cbddc7', gold: '#b39152', deep: '#243a2b',
    scriptFont: 'Pinyon Script', headingFont: 'Marcellus', bodyFont: 'Lora', labelFont: 'Raleway',
    ornament: 'floral',
  },
];

export const EVENT_THEMES: Record<EventKey, InviteTheme[]> = {
  babyshower: BABYSHOWER_THEMES,
  bridetobe: BRIDETOBE_THEMES,
  genderreveal: GENDERREVEAL_THEMES,
  housewarming: HOUSEWARMING_THEMES,
  custom: CUSTOM_THEMES,
};
