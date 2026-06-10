import type { EventType } from './eventFields';

export interface TemplateFieldLayout {
  formKey?: string;
  text?: string;
  prefix?: string;
  suffix?: string;
  format?: 'longDate' | 'longDateDayFirst' | 'longDateUpper' | 'time' | 'time12' | 'raw';
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

/**
 * Style block for a single sub-event column (name / dateTime / venue).
 * Owns horizontal placement + font styling only — the Y position is
 * provided per-row by the EventsListRow entry so each row can place
 * the same column at a different height.
 */
export interface EventsListColumnStyle {
  x: number;
  fontFamily: string;
  fontSize: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number;
  color: string;
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
  lineHeight?: number;
  wrapAfterChars?: number;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
}

/**
 * One physical box on the template. Each piece of text inside the box
 * has its OWN y position so you can tune them independently — bump the
 * event name down 5px without touching the venue, etc.
 */
export interface EventsListRow {
  /** Y of the event name line. */
  nameY: number;
  /** Y of the date · time line (date on line 1, time/tz on line 2). */
  dateTimeY: number;
  /** Y of the venue line. */
  venueY: number;
}

export interface EventsListLayout {
  /** Explicit list of row Y positions — one entry per box drawn on the
   * template image (top → bottom). Number of rows here = max events
   * rendered. Box-by-box tuning happens by editing each entry's `y`. */
  rows: EventsListRow[];
  /** Display name used for row 0 (the main event, sourced from the main
   * form's eventDate / eventTime / timezone / venue). Defaults to a
   * sensible value like "Wedding" if not set. */
  mainEventName?: string;
  /** Left-column event name. Same style applied to every box. */
  name: EventsListColumnStyle;
  /** Left-column date/time line ("MM/DD/YYYY · HH:MM AM TZ"). */
  dateTime: EventsListColumnStyle;
  /** Right-column venue. */
  venue: EventsListColumnStyle;
}

export interface TemplateLayout {
  naturalWidth: number;
  naturalHeight: number;
  fields: TemplateFieldLayout[];
  /** Optional dynamic sub-events list, for templates with a built-in
   * multi-event area baked into the image (e.g. wedding cards that show
   * Mehendi / Sangeet / Wedding / Reception on one card). */
  eventsList?: EventsListLayout;
}

export interface EviteTemplate {
  id: string;
  eventType: EventType;
  name: string;
  style: string;
  previewImage: string;
  /** Full-resolution template background. When set, TemplateRenderer uses
   * this as the canvas background while the gallery carousel keeps showing
   * previewImage as the thumbnail. */
  realImage?: string;
  accent: string;
  layout?: TemplateLayout;
  /**
   * Groups a family of templates that are the same design but built for
   * different event counts (2-event, 3-event, 4-event, 5-event variants).
   * When the Multiple Events toggle is ON, the editor carousel navigates
   * within this group instead of across the full gallery.
   */
  variantGroup?: string;
  /** How many event boxes this specific variant is designed for. */
  variantEventCount?: number;
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

  // ── Wedding (8 templates) ───────────────────────────────────────────────
  {
    id: 'wed-multi-event',
    eventType: 'marriage',
    name: 'Save the Date · Multi-Event',
    style: 'Tropical & Festive',
    previewImage: '/templates/wedding/wedmulti.png',
    accent: '#7a1018',
    variantGroup: 'wed-multi',
    variantEventCount: 4,
    layout: {
      // Natural image is 1030 x 1526. All numbers below are image pixels.
      //
      // To move a piece, edit the matching x / y. Same rules as the other
      // templates:
      //   • bigger x → moves RIGHT
      //   • bigger y → moves DOWN
      //   • smaller x → moves LEFT
      //   • smaller y → moves UP
      //
      // The "Save the date and celebrate with us" line is baked into the
      // image — we DO NOT render it as overlay text.
      //
      // Couple names sit in the empty area between the static "Save the
      // date" text and the events list. The "&" is its own field so the
      // gold/amber color matches the design.
      naturalWidth: 1030,
      naturalHeight: 1526,
      fields: [
        // Groom name — top of the couple block
        { formKey: 'groomName', x: 525, y: 450, fontFamily: 'Great Vibes', fontSize: 90, color: '#7a1018', align: 'center', maxWidth: 760 },

        // Ampersand (static, so the cursive & stays no matter what)
        { text: '&', x: 525, y: 560, fontFamily: 'Great Vibes', fontSize: 60, color: '#7a1018', align: 'center' },

        // Bride name — below the &
        { formKey: 'brideName', x: 525, y: 620, fontFamily: 'Great Vibes', fontSize: 90, color: '#7a1018', align: 'center', maxWidth: 760 },
      ],
      // Dynamic event rows. Row 0 = the MAIN event (date/time/venue the
      // host entered in the main form, labelled "Wedding" by default).
      // Rows 1-3 = sub-events (Mehendi / Sangeet / Reception / ...) the
      // host added via the Multiple Events toggle.
      //
      // FOUR explicit rows below — one per box drawn on the template.
      // Tune each box's vertical position by editing its `y`. Horizontal
      // text placement and font styling are shared (see name / dateTime /
      // venue blocks at the bottom) so the 4 boxes stay visually consistent.
      eventsList: {
        mainEventName: 'Wedding',

        // 4 boxes — top → bottom. Each box has 3 independent Y values:
        //   nameY      → vertical position of the event name
        //   dateTimeY  → vertical position of the date line (2nd line for time)
        //   venueY     → vertical position of the venue (right cell)
        rows: [
          { nameY: 835, dateTimeY: 820, venueY: 820 },   // Box 1 (top)    — Wedding / main event
          { nameY: 980, dateTimeY: 970, venueY: 970 }, // Box 2          — usually Mehendi
          { nameY: 1125, dateTimeY: 1115, venueY: 1115 }, // Box 3          — usually Sangeet
          { nameY: 1275, dateTimeY: 1265, venueY: 1265 }, // Box 4 (bottom) — usually Reception
        ],

        // Event name — Playfair Display, bold + uppercase, centre-aligned;
        // wraps to next line after 12 chars so long names stay inside the box.
        name: { x: 260, fontFamily: 'Playfair Display', fontSize: 22, fontWeight: '700', color: '#641018', align: 'center', maxWidth: 250, textTransform: 'uppercase', letterSpacing: 1, wrapAfterChars: 12 },

        // Date · time — Cormorant Garamond, regular weight. Matches the
        // high-contrast serif numerals in the reference photo
        // ("06/21/2025" / "05:00 PM EST"). Line spacing tightened so the
        // two lines feel like a single stacked stamp.
        dateTime: { x: 460, fontFamily: 'Montserrat', fontSize: 17, fontWeight: '400', color: '#1f2d20', align: 'left', maxWidth: 250, lineHeight: 26 },

        // Venue — Playfair Display. wrapAfterChars: 16 → each line caps
        // at 16 chars; long addresses cascade onto a 3rd / 4th line.
        venue: { x: 680, fontFamily: 'Playfair Display', fontSize: 19, color: '#1f2d20', align: 'left', maxWidth: 360, lineHeight: 26, wrapAfterChars: 16 },
      },
    },
  },

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

  // ── Pre-Wedding Party / Bride to Be (7 templates) ─────────────────────
  // previewImage → carousel thumbnail. realImage → full-res background for the renderer.
  // naturalWidth/Height match each image's actual pixel dimensions (no cropping).
  // timezone sits on the same line as eventTime; maxWidth on time keeps them from overlapping.
  {
    id: 'pw-one',
    eventType: 'bridetobe',
    name: 'The Journey Begins',
    style: 'Gold & Elegant',
    previewImage: '/templates/pre wedding/onepreview.jpeg',
    realImage: '/templates/pre wedding/onereal.png',
    accent: '#B98A3C',
    layout: {
      naturalWidth: 1024,  // actual: 1023×1537 — negligible 1px diff
      naturalHeight: 1536,
      fields: [
        { formKey: 'celebrantName', x: 512, y: 820, fontFamily: 'Great Vibes', fontSize: 130, color: '#B98A3C', align: 'center', maxWidth: 700 },
        { formKey: 'eventDate', format: 'longDate', x: 380, y: 1030, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#6D5646', align: 'left', maxWidth: 500 },
        { formKey: 'eventTime', format: 'time12', x: 382, y: 1060, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#6D5646', align: 'left', maxWidth: 200 },
        { formKey: 'timezone',                     x: 470, y: 1060, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#6D5646', align: 'left', maxWidth: 130 },
        { formKey: 'venue', x: 382, y: 1130, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#6D5646', align: 'left', maxWidth: 500, lineHeight: 38, wrapAfterChars: 24 },
      ],
    },
  },
  {
    id: 'pw-two',
    eventType: 'bridetobe',
    name: 'Sunshine & New Beginnings',
    style: 'Bright & Tropical',
    previewImage: '/templates/pre wedding/twopreview.jpeg',
    realImage: '/templates/pre wedding/tworeal.png',
    accent: '#D96545',
    layout: {
      naturalWidth: 1024,  // actual: 1023×1537
      naturalHeight: 1536,
      fields: [
        { formKey: 'celebrantName', x: 512, y: 840, fontFamily: 'Great Vibes', fontSize: 100, color: '#D96545', align: 'center', maxWidth: 700 },
        { formKey: 'eventDate', format: 'longDate', x: 430, y: 1040, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#1F456E', align: 'left', maxWidth: 500 },
        { formKey: 'eventTime', format: 'time12', x: 432, y: 1080, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#1F456E', align: 'left', maxWidth: 200 },
        { formKey: 'timezone',                     x: 520, y: 1080, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#1F456E', align: 'left', maxWidth: 130 },
        { formKey: 'venue', x: 430, y: 1150, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#1F456E', align: 'left', maxWidth: 500, lineHeight: 38, wrapAfterChars: 24 },
      ],
    },
  },
  {
    id: 'pw-three',
    eventType: 'bridetobe',
    name: 'Before The Wedding Bells',
    style: 'Romantic & Rose',
    previewImage: '/templates/pre wedding/threepreview.jpeg',
    realImage: '/templates/pre wedding/threereal.png',
    accent: '#B85F6D',
    layout: {
      naturalWidth: 941,   // actual: 941×1672 — taller/narrower, all coords scaled
      naturalHeight: 1672,
      fields: [
        { formKey: 'celebrantName', x: 471, y: 750, fontFamily: 'Great Vibes', fontSize: 120, color: '#B85F6D', align: 'center', maxWidth: 643 },
        { formKey: 'eventDate', format: 'longDate', x: 410, y: 940, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#5A3726', align: 'left', maxWidth: 460 },
        { formKey: 'eventTime', format: 'time12', x: 412, y: 975, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#5A3726', align: 'left', maxWidth: 184 },
        { formKey: 'timezone',                     x: 505, y: 975, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#5A3726', align: 'left', maxWidth: 120 },
        { formKey: 'venue', x: 410, y: 1035, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#5A3726', align: 'left', maxWidth: 460, lineHeight: 41, wrapAfterChars: 24 },
      ],
    },
  },
  {
    id: 'pw-four',
    eventType: 'bridetobe',
    name: 'Pink Floral Celebration',
    style: 'Soft & Botanical',
    previewImage: '/templates/pre wedding/fourpreview.jpeg',
    realImage: '/templates/pre wedding/fourreal.png',
    accent: '#D67A98',
    layout: {
      naturalWidth: 941,   // actual: 941×1672
      naturalHeight: 1672,
      fields: [
        { formKey: 'celebrantName', x: 471, y: 975, fontFamily: 'Great Vibes', fontSize: 120, color: '#D67A98', align: 'center', maxWidth: 643 },
        { formKey: 'eventDate', format: 'longDate', x: 340, y: 1190, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#657D4A', align: 'left', maxWidth: 460 },
        { formKey: 'eventTime', format: 'time12', x: 342, y: 1230, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#657D4A', align: 'left', maxWidth: 184 },
        { formKey: 'timezone',                     x: 430, y: 1230, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#657D4A', align: 'left', maxWidth: 120 },
        { formKey: 'venue', x: 340, y: 1300, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#657D4A', align: 'left', maxWidth: 460, lineHeight: 41, wrapAfterChars: 24 },
      ],
    },
  },
  {
    id: 'pw-five',
    eventType: 'bridetobe',
    name: 'Celebration & Joy',
    style: 'Warm & Festive',
    previewImage: '/templates/pre wedding/fivepreview.jpeg',
    realImage: '/templates/pre wedding/fivereal.png',
    accent: '#B96A70',
    layout: {
      naturalWidth: 941,   // actual: 941×1672
      naturalHeight: 1672,
      fields: [
        { formKey: 'celebrantName', x: 471, y: 865, fontFamily: 'Great Vibes', fontSize: 70, color: '#B96A70', align: 'center', maxWidth: 643 },
        { formKey: 'eventDate', format: 'longDateDayFirst', x: 440, y: 1025, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#4F3529', align: 'left', maxWidth: 460, lineHeight: 34 },
        { formKey: 'eventTime', format: 'time12', x: 440, y: 1090, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#4F3529', align: 'left', maxWidth: 184 },
        { formKey: 'timezone',                     x: 525, y: 1090, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#4F3529', align: 'left', maxWidth: 120 },
        { formKey: 'venue', x: 440, y: 1140, fontFamily: 'Cormorant Garamond', fontSize: 24, color: '#4F3529', align: 'left', maxWidth: 460, lineHeight: 41, wrapAfterChars: 24 },
      ],
    },
  },
  {
    id: 'pw-six',
    eventType: 'bridetobe',
    name: 'Garden Soirée',
    style: 'Fresh & Floral',
    previewImage: '/templates/pre wedding/sixpreview.jpeg',
    realImage: '/templates/pre wedding/sixreal.png',
    accent: '#D986A0',
    layout: {
      naturalWidth: 953,   // actual: 953×1650
      naturalHeight: 1650,
      fields: [
        { formKey: 'celebrantName', x: 460, y: 1000, fontFamily: 'Great Vibes', fontSize: 120, color: '#D986A0', align: 'center', maxWidth: 652 },
        { formKey: 'eventDate', format: 'longDate', x: 400, y: 1180, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#4A352C', align: 'left', maxWidth: 465 },
        { formKey: 'eventTime', format: 'time12', x: 402, y: 1220, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#4A352C', align: 'left', maxWidth: 186 },
        { formKey: 'timezone',                     x: 505, y: 1220, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#4A352C', align: 'left', maxWidth: 121 },
        { formKey: 'venue', x: 400, y: 1300, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#4A352C', align: 'left', maxWidth: 465, lineHeight: 41, wrapAfterChars: 24 },
      ],
    },
  },
  {
    id: 'pw-seven',
    eventType: 'bridetobe',
    name: 'Good Company',
    style: 'Rich & Burgundy',
    previewImage: '/templates/pre wedding/sevenpreview.jpeg',
    realImage: '/templates/pre wedding/sevenreal.png',
    accent: '#6B0035',
    layout: {
      naturalWidth: 941,   // actual: 941×1672 — offset layout, text sits on the right half
      naturalHeight: 1672,
      fields: [
        { formKey: 'celebrantName', x: 570, y: 980, fontFamily: 'Great Vibes', fontSize: 120, color: '#6B0035', align: 'center', maxWidth: 625 },
        { formKey: 'eventDate', format: 'longDate', x: 570, y: 1190, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#3F2A1E', align: 'left', maxWidth: 441 },
        { formKey: 'eventTime', format: 'time12', x: 572, y: 1230, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#3F2A1E', align: 'left', maxWidth: 184 },
        { formKey: 'timezone',                     x: 660, y: 1230, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#3F2A1E', align: 'left', maxWidth: 120 },
        { formKey: 'venue', x: 570, y: 1325, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#3F2A1E', align: 'left', maxWidth: 441, lineHeight: 41, wrapAfterChars: 24 },
      ],
    },
  },

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

  // ── Gender Reveal (7 templates) ────────────────────────────────────────
  // previewImage → carousel thumbnail shown before selection.
  // realImage    → full-res background loaded by TemplateRenderer on click.
  // naturalWidth/Height match each image's actual pixel dimensions (no cropping).
  // timezone sits on the same line as eventTime.
  {
    id: 'gr-one',
    eventType: 'genderreveal',
    name: 'Little He or She',
    style: 'Soft & Botanical',
    previewImage: '/templates/gender reveal/onepreview.jpeg',
    realImage: '/templates/gender reveal/onereal.png',
    accent: '#E9A1B8',
    layout: {
      naturalWidth: 1024,  // actual: 1023×1537
      naturalHeight: 1536,
      fields: [
        { formKey: 'motherName', x: 512, y: 800, fontFamily: 'Great Vibes', fontSize: 66, color: '#745943', align: 'center', maxWidth: 620 },
        { formKey: 'fatherName', x: 512, y: 930, fontFamily: 'Great Vibes', fontSize: 66, color: '#745943', align: 'center', maxWidth: 620 },
        { formKey: 'eventDate', format: 'longDate', x: 350, y: 1055, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#7B6A5D', align: 'left', maxWidth: 470 },
        { formKey: 'eventTime', format: 'time12', x: 350, y: 1085, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#7B6A5D', align: 'left', maxWidth: 200 },
        { formKey: 'timezone',                     x: 440, y: 1085, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#7B6A5D', align: 'left', maxWidth: 130 },
        { formKey: 'venue', x: 350, y: 1130, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#7B6A5D', align: 'left', maxWidth: 470, lineHeight: 38, wrapAfterChars: 22 },
      ],
    },
  },
  {
    id: 'gr-two',
    eventType: 'genderreveal',
    name: 'Floral Garden Reveal',
    style: 'Lush & Romantic',
    previewImage: '/templates/gender reveal/twopreview.jpeg',
    realImage: '/templates/gender reveal/tworeal.png',
    accent: '#C97AB2',
    layout: {
      naturalWidth: 941,   // actual: 941×1672 — all coords scaled from 1024×1536 base
      naturalHeight: 1672,
      fields: [
        { formKey: 'motherName', x: 471, y: 1080, fontFamily: 'Great Vibes', fontSize: 80, color: '#C97AB2', align: 'center', maxWidth: 588 },
        { formKey: 'fatherName', x: 471, y: 1270, fontFamily: 'Great Vibes', fontSize: 80, color: '#6EB5D4', align: 'center', maxWidth: 588 },
        { formKey: 'eventDate', format: 'longDate', x: 360, y: 1385, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#7B6A5D', align: 'left', maxWidth: 432 },
        { formKey: 'eventTime', format: 'time12', x: 360, y: 1420, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#7B6A5D', align: 'left', maxWidth: 184 },
        { formKey: 'timezone',                     x: 450, y: 1420, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#7B6A5D', align: 'left', maxWidth: 120 },
        { formKey: 'venue', x: 360, y: 1490, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#7B6A5D', align: 'left', maxWidth: 432, lineHeight: 41, wrapAfterChars: 20 },
      ],
    },
  },
  {
    id: 'gr-three',
    eventType: 'genderreveal',
    name: 'Pink or Blue',
    style: 'Classic & Playful',
    previewImage: '/templates/gender reveal/threepreview.jpeg',
    realImage: '/templates/gender reveal/threereal.png',
    accent: '#E76D97',
    layout: {
      naturalWidth: 958,   // actual: 958×1641 — all coords scaled from 1024×1536 base
      naturalHeight: 1641,
      fields: [
        { formKey: 'motherName', x: 479, y: 780, fontFamily: 'Great Vibes', fontSize: 90, color: '#E76D97', align: 'center', maxWidth: 599 },
        { formKey: 'fatherName', x: 479, y: 980, fontFamily: 'Great Vibes', fontSize: 90, color: '#2E9BC2', align: 'center', maxWidth: 599 },
        { formKey: 'eventDate', format: 'longDate', x: 380, y: 1120, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#6B4A32', align: 'left', maxWidth: 440 },
        { formKey: 'eventTime', format: 'time12', x: 380, y: 1160, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#6B4A32', align: 'left', maxWidth: 187 },
        { formKey: 'timezone',                     x: 470, y: 1160, fontFamily: 'Cormorant Garamond', fontSize: 24, color: '#6B4A32', align: 'left', maxWidth: 122 },
        { formKey: 'venue', x: 380, y: 1235, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#6B4A32', align: 'left', maxWidth: 440, lineHeight: 41, wrapAfterChars: 20 },
      ],
    },
  },
  {
    id: 'gr-four',
    eventType: 'genderreveal',
    name: 'Sweet Surprise',
    style: 'Whimsical & Soft',
    previewImage: '/templates/gender reveal/fourpreview.jpeg',
    realImage: '/templates/gender reveal/fourreal.png',
    accent: '#E75D8D',
    layout: {
      naturalWidth: 1024,  // actual: 1023×1537
      naturalHeight: 1536,
      fields: [
        { formKey: 'motherName', x: 512, y: 785, fontFamily: 'Great Vibes', fontSize: 90, color: '#E75D8D', align: 'center', maxWidth: 640 },
        { formKey: 'fatherName', x: 512, y: 950, fontFamily: 'Great Vibes', fontSize: 90, color: '#3E95D6', align: 'center', maxWidth: 640 },
        { formKey: 'eventDate', format: 'longDate', x: 340, y: 1100, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#314E70', align: 'left', maxWidth: 470 },
        { formKey: 'eventTime', format: 'time12', x: 340, y: 1140, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#314E70', align: 'left', maxWidth: 200 },
        { formKey: 'timezone',                     x: 430, y: 1140, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#314E70', align: 'left', maxWidth: 130 },
        { formKey: 'venue', x: 340, y: 1220, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#314E70', align: 'left', maxWidth: 470, lineHeight: 38, wrapAfterChars: 22 },
      ],
    },
  },
  {
    id: 'gr-five',
    eventType: 'genderreveal',
    name: 'Twinkle Little Star',
    style: 'Celestial & Dreamy',
    previewImage: '/templates/gender reveal/fivepreview.jpeg',
    realImage: '/templates/gender reveal/fivereal.png',
    accent: '#D96B86',
    layout: {
      naturalWidth: 1024,  // actual: 1023×1537
      naturalHeight: 1536,
      fields: [
        { formKey: 'motherName', x: 512, y: 815, fontFamily: 'Great Vibes', fontSize: 100, color: '#D96B86', align: 'center', maxWidth: 640 },
        { formKey: 'fatherName', x: 512, y: 1000, fontFamily: 'Great Vibes', fontSize: 100, color: '#4A90C9', align: 'center', maxWidth: 640 },
        { formKey: 'eventDate', format: 'longDate', x: 400, y: 1140, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#6E5140', align: 'left', maxWidth: 470 },
        { formKey: 'eventTime', format: 'time12', x: 405, y: 1180, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#6E5140', align: 'left', maxWidth: 200 },
        { formKey: 'timezone',                     x: 500, y: 1180, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#6E5140', align: 'left', maxWidth: 130 },
        { formKey: 'venue', x: 405, y: 1250, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#6E5140', align: 'left', maxWidth: 470, lineHeight: 38, wrapAfterChars: 22 },
      ],
    },
  },
  {
    id: 'gr-six',
    eventType: 'genderreveal',
    name: 'Starlit Reveal',
    style: 'Elegant & Warm',
    previewImage: '/templates/gender reveal/sixpreview.jpeg',
    realImage: '/templates/gender reveal/sixreal.png',
    accent: '#C98B6A',
    layout: {
      naturalWidth: 1024,  // actual: 1023×1537
      naturalHeight: 1536,
      fields: [
        { formKey: 'motherName', x: 512, y: 1090, fontFamily: 'Great Vibes', fontSize: 80, color: '#D96B86', align: 'center', maxWidth: 640 },
        { formKey: 'fatherName', x: 512, y: 1230, fontFamily: 'Great Vibes', fontSize: 80, color: '#4A90C9', align: 'center', maxWidth: 640 },
        { formKey: 'eventDate', format: 'longDate', x: 360, y: 1340, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#654A38', align: 'left', maxWidth: 470 },
        { formKey: 'eventTime', format: 'time12', x: 365, y: 1370, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#654A38', align: 'left', maxWidth: 200 },
        { formKey: 'timezone',                     x: 455, y: 1370, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#654A38', align: 'left', maxWidth: 130 },
        { formKey: 'venue', x: 360, y: 1430, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#654A38', align: 'left', maxWidth: 470, lineHeight: 38, wrapAfterChars: 22 },
      ],
    },
  },
  {
    id: 'gr-seven',
    eventType: 'genderreveal',
    name: 'A Little Dream',
    style: 'Dreamy & Soft',
    previewImage: '/templates/gender reveal/sevenpreview.jpeg',
    realImage: '/templates/gender reveal/sevenreal.png',
    accent: '#E85D8F',
    layout: {
      naturalWidth: 941,   // actual: 941×1672 — all coords scaled from 1024×1536 base
      naturalHeight: 1672,
      fields: [
        { formKey: 'motherName', x: 471, y: 980, fontFamily: 'Great Vibes', fontSize: 100, color: '#E85D8F', align: 'center', maxWidth: 588 },
        { formKey: 'fatherName', x: 471, y: 1180, fontFamily: 'Great Vibes', fontSize: 100, color: '#2F83C8', align: 'center', maxWidth: 588 },
        { formKey: 'eventDate', format: 'longDate', x: 310, y: 1320, fontFamily: 'Cormorant Garamond', fontSize: 32, color: '#6B3F18', align: 'left', maxWidth: 432 },
        { formKey: 'eventTime', format: 'time12', x: 315, y: 1360, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#6B3F18', align: 'left', maxWidth: 184 },
        { formKey: 'timezone',                     x: 400, y: 1360, fontFamily: 'Cormorant Garamond', fontSize: 26, color: '#6B3F18', align: 'left', maxWidth: 120 },
        { formKey: 'venue', x: 315, y: 1420, fontFamily: 'Cormorant Garamond', fontSize: 30, color: '#6B3F18', align: 'left', maxWidth: 432, lineHeight: 41, wrapAfterChars: 20 },
      ],
    },
  },
];
