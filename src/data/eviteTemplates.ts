import type { EventType } from './eventFields';

export interface TemplateFieldLayout {
  formKey?: string;
  text?: string;
  prefix?: string;
  suffix?: string;
  format?: 'longDate' | 'longDateUpper' | 'time' | 'time12' | 'raw';
  iconBefore?: string;
  iconSize?: number;
  iconGap?: number;
  iconColor?: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number;
  color: string;
  align: 'left' | 'center' | 'right';
  lineHeight?: number;
  maxWidth?: number;
  /** If set, wrap text onto a 2nd line at the nearest word boundary once length exceeds this many chars. */
  wrapAfterChars?: number;
  /** CSS text-transform applied at render time. */
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
}

export interface TemplateLayout {
  naturalWidth: number;
  naturalHeight: number;
  fields: TemplateFieldLayout[];
}

export interface EviteTemplate {
  id: string;
  eventType: EventType;
  name: string;
  style: string;
  previewImage: string;
  accent: string;
  layout?: TemplateLayout;
}

export const eviteTemplates: EviteTemplate[] = [
  // ── Birthday (1 template) ───────────────────────────────────────────────
  {
    id: 'bday-floral',
    eventType: 'birthday',
    name: 'Floral Celebration',
    style: 'Elegant & Floral',
    previewImage: '/templates/birthday/birthday1.png',
    accent: '#A8893D',
    layout: {
      // Coordinate system matches the customization spec (1024 x 1536).
      // The renderer scales these to fit the actual template image.
      naturalWidth: 1024,
      naturalHeight: 1536,
      fields: [
        // Celebrant name
        { formKey: 'celebrantName', suffix: "’s", x: 500, y: 420, fontFamily: 'Great Vibes', fontSize: 150, color: '#A8893D', align: 'center', maxWidth: 760 },

        // Date
        { formKey: 'eventDate', format: 'longDateUpper', x: 360, y: 815, fontFamily: 'Montserrat', fontWeight: '500', fontSize: 28, letterSpacing: 1.2, color: '#2F302A', align: 'left', maxWidth: 620, textTransform: 'uppercase' },

        // Time
        { formKey: 'eventTime', format: 'time12', x: 360, y: 855, fontFamily: 'Montserrat', fontWeight: '500', fontSize: 28, color: '#2F302A', align: 'left', maxWidth: 620, textTransform: 'uppercase' },

        // Venue / Location — wraps to 2nd line after ~21 chars at a word boundary
        { formKey: 'venue', x: 360, y: 960, fontFamily: 'Montserrat', fontWeight: '500', fontSize: 28, letterSpacing: 1.2, color: '#2F302A', align: 'left', maxWidth: 660, lineHeight: 36, wrapAfterChars: 21, textTransform: 'uppercase' },
      ],
    },
  },

  // ── Wedding (7 templates) ───────────────────────────────────────────────
  { id: 'wed-1', eventType: 'marriage', name: 'Classic Romance',  style: 'Timeless & Elegant',    previewImage: '/templates/wedding/1.jpg', accent: '#c4a882' },
  { id: 'wed-2', eventType: 'marriage', name: 'Botanical Dream',  style: 'Lush & Natural',         previewImage: '/templates/wedding/2.jpg', accent: '#7d9b76' },
  { id: 'wed-3', eventType: 'marriage', name: 'Modern Luxe',      style: 'Sleek & Sophisticated',  previewImage: '/templates/wedding/3.jpg', accent: '#1a1a2e' },
  { id: 'wed-4', eventType: 'marriage', name: 'Rustic Charm',     style: 'Warm & Earthy',          previewImage: '/templates/wedding/4.jpg', accent: '#b5651d' },
  { id: 'wed-5', eventType: 'marriage', name: 'Indian Heritage',  style: 'Traditional & Vibrant',  previewImage: '/templates/wedding/5.jpg', accent: '#e67e22' },
  { id: 'wed-6', eventType: 'marriage', name: 'Mehendi Magic',    style: 'Bohemian & Festive',     previewImage: '/templates/wedding/6.jpg', accent: '#c4a882' },
  { id: 'wed-7', eventType: 'marriage', name: 'Golden Mandap',    style: 'Regal & Traditional',    previewImage: '/templates/wedding/7.jpg', accent: '#c9b037' },

  // ── Baby Shower (7 templates) ───────────────────────────────────────────
  { id: 'baby-1', eventType: 'babyshower', name: 'Soft Clouds',   style: 'Dreamy & Pastel',    previewImage: '/templates/baby shower/1.jpg', accent: '#b5d8eb' },
  { id: 'baby-2', eventType: 'babyshower', name: 'Little Safari', style: 'Playful & Fun',       previewImage: '/templates/baby shower/2.jpg', accent: '#f0c987' },
  { id: 'baby-3', eventType: 'babyshower', name: 'Bloom & Grow',  style: 'Floral & Soft',       previewImage: '/templates/baby shower/3.jpg', accent: '#e8b4b8' },
  { id: 'baby-4', eventType: 'babyshower', name: 'Storybook',     style: 'Whimsical & Sweet',   previewImage: '/templates/baby shower/4.jpg', accent: '#d4c5a9' },
  { id: 'baby-5', eventType: 'babyshower', name: 'Starlight',     style: 'Celestial & Soft',    previewImage: '/templates/baby shower/5.jpg', accent: '#b5c7e3' },
  { id: 'baby-6', eventType: 'babyshower', name: 'Garden Baby',   style: 'Fresh & Natural',     previewImage: '/templates/baby shower/6.jpg', accent: '#a8d5ba' },
  { id: 'baby-7', eventType: 'babyshower', name: 'Classic Charm', style: 'Timeless & Elegant',  previewImage: '/templates/baby shower/7.jpg', accent: '#c4b5a0' },

  // ── Bride to Be (7 templates) ───────────────────────────────────────────
  { id: 'bride-1', eventType: 'bridetobe', name: 'Blush & Gold',    style: 'Glam & Feminine',       previewImage: '/templates/bride to be/1.jpg', accent: '#d4a5a5' },
  { id: 'bride-2', eventType: 'bridetobe', name: 'Champagne Toast', style: 'Bubbly & Chic',          previewImage: '/templates/bride to be/2.jpg', accent: '#c9b037' },
  { id: 'bride-3', eventType: 'bridetobe', name: 'Boho Bride',      style: 'Free-spirited & Natural', previewImage: '/templates/bride to be/3.jpg', accent: '#c4a882' },
  { id: 'bride-4', eventType: 'bridetobe', name: 'Rose Garden',     style: 'Romantic & Soft',         previewImage: '/templates/bride to be/4.jpg', accent: '#e8b4b8' },
  { id: 'bride-5', eventType: 'bridetobe', name: 'Garden Brunch',   style: 'Fresh & Feminine',        previewImage: '/templates/bride to be/5.jpg', accent: '#a8d5ba' },
  { id: 'bride-6', eventType: 'bridetobe', name: 'Luxe Soirée',     style: 'Elegant & Glamorous',     previewImage: '/templates/bride to be/6.jpg', accent: '#c9b037' },
  { id: 'bride-7', eventType: 'bridetobe', name: 'Bachelorette',    style: 'Bold & Fun',              previewImage: '/templates/bride to be/7.jpg', accent: '#ff6b6b' },

  // ── Housewarming (2 templates) ─────────────────────────────────────────
  {
    id: 'house-blessings',
    eventType: 'housewarming',
    name: 'Blessings of Ganesha',
    style: 'Traditional & Floral',
    previewImage: '/templates/housewarming/housewarming2.jpeg',
    accent: '#B8860B',
    layout: {
      // Natural image is 1024 x 1536. Coordinates are in image pixels.
      // To move a field on this template, edit only the `x` (left→right)
      // and `y` (top→bottom) on the matching line below.
      //   • increase x → moves RIGHT
      //   • decrease x → moves LEFT
      //   • increase y → moves DOWN
      //   • decrease y → moves UP
      naturalWidth: 1024,
      naturalHeight: 1536,
      fields: [
        // Date — sits on the dotted line next to the "Date:" label.
        // To nudge: change x / y below.
        { formKey: 'eventDate', format: 'longDate', x: 420, y: 810, fontFamily: 'Cormorant Garamond', fontSize: 36, fontStyle: 'italic', color: '#3A2E25', align: 'left', maxWidth: 540 },

        // Time — sits on the dotted line next to the "Time:" label.
        { formKey: 'eventTime', format: 'time12', x: 420, y: 925, fontFamily: 'Cormorant Garamond', fontSize: 36, fontStyle: 'italic', color: '#3A2E25', align: 'left', maxWidth: 540 },

        // Venue — sits on the dotted line next to the "Venue:" label.
        // Single-line: smaller font + wider maxWidth so the full address fits.
        // If you ever want it to wrap again, add back `wrapAfterChars: 28`.
        { formKey: 'venue', x: 420, y: 1045, fontFamily: 'Cormorant Garamond', fontSize: 26, fontStyle: 'italic', color: '#3A2E25', align: 'left', maxWidth: 580 },
      ],
    },
  },

  {
    id: 'house-gruhapravesam',
    eventType: 'housewarming',
    name: 'Gruhapravesam',
    style: 'Traditional & Sacred',
    previewImage: '/templates/housewarming/gruhapravesam.png',
    accent: '#A62D58',
    layout: {
      // 2:3 layout (408x612 logical units) calibrated to the cleaned template
      // image. The image (1024x1536) scales proportionally to fill the renderer.
      naturalWidth: 408,
      naturalHeight: 612,
      fields: [
        // Names
        { formKey: 'homeownerName', x: 190, y: 208, fontFamily: 'Great Vibes', fontSize: 34, color: '#A62D58', align: 'center' },

        // Date — to the right of the calendar icon
        { formKey: 'eventDate', format: 'longDateUpper', x: 135, y: 325, fontFamily: 'Montserrat', fontSize: 10, fontWeight: '700', color: '#4A3728', align: 'left' },

        // Time — to the right of the clock icon
        { formKey: 'eventTime', format: 'time12', prefix: 'MUHURTHAM: ', x: 135, y: 354, fontFamily: 'Montserrat', fontSize: 10, fontWeight: '700', color: '#4A3728', align: 'left' },

        // Venue (multi-line via \n)
        { formKey: 'venue', x: 135, y: 382, fontFamily: 'Cormorant Garamond', fontSize: 13, lineHeight: 20, color: '#3E2D23', align: 'left' },
      ],
    },
  },

  // ── Gender Reveal (8 templates) ────────────────────────────────────────
  { id: 'gender-1', eventType: 'genderreveal', name: 'Pink or Blue',    style: 'Classic & Fun',      previewImage: '/templates/gender reveal/1.jpg', accent: '#b5c7e3' },
  { id: 'gender-2', eventType: 'genderreveal', name: 'Twinkle Stars',   style: 'Celestial & Dreamy', previewImage: '/templates/gender reveal/2.jpg', accent: '#2c3e50' },
  { id: 'gender-3', eventType: 'genderreveal', name: 'He or She',       style: 'Playful & Bold',     previewImage: '/templates/gender reveal/3.jpg', accent: '#9b59b6' },
  { id: 'gender-4', eventType: 'genderreveal', name: 'Little Peanut',   style: 'Cute & Cozy',        previewImage: '/templates/gender reveal/4.jpg', accent: '#f0c987' },
  { id: 'gender-5', eventType: 'genderreveal', name: 'Confetti Cloud',  style: 'Whimsical & Bright', previewImage: '/templates/gender reveal/5.jpg', accent: '#e8b4b8' },
  { id: 'gender-6', eventType: 'genderreveal', name: 'Balloon Burst',   style: 'Festive & Joyful',   previewImage: '/templates/gender reveal/6.jpg', accent: '#ff6b6b' },
  { id: 'gender-7', eventType: 'genderreveal', name: 'Sweet Surprise',  style: 'Soft & Dreamy',      previewImage: '/templates/gender reveal/7.jpg', accent: '#d4a5a5' },
  { id: 'gender-8', eventType: 'genderreveal', name: 'Adventure Awaits',style: 'Bold & Modern',      previewImage: '/templates/gender reveal/8.jpg', accent: '#3498db' },
];
