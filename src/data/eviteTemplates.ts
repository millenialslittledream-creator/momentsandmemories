import type { EventType } from './eventFields';
import { templateAssetUrl } from '@/lib/templateAssets';

export interface TemplateFieldLayout {
  formKey?: string;
  text?: string;
  prefix?: string;
  suffix?: string;
  format?: 'longDate' | 'longDateDayFirst' | 'longDateUpper' | 'longDateDayMonth' | 'longDateDayMonthUpper' | 'ordinalDateThenWeekday' | 'ordinalDate' | 'weekdayTitle' | 'weekdayThenDayMonthUpper' | 'weekdayUpper' | 'dayOfMonth' | 'monthYearUpper' | 'dayMonthYearUpper' | 'monthAbbrUpper' | 'yearOnly' | 'firstLetterUpper' | 'firstWord' | 'restOfName' | 'time' | 'time12' | 'raw';
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
  /** Hard cap on wrapped line count: past it the wrap widens instead of
   *  adding another line, so a long value can't grow down into the block
   *  beneath it. Only meaningful together with wrapAfterChars. */
  maxLines?: number;
  /** Widest this slot can take, in characters. A longer value is scaled down
   *  to fit rather than overflowing into whatever sits beside it — used on the
   *  date rows, where "27 SEPTEMBER 2026" is half again as wide as the
   *  designer's "22 JUNE 2026" sample. */
  fitChars?: number;
  /** CSS text-transform applied at render time. */
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  /** Render digits as full-height lining figures. Cormorant Garamond ships
   *  old-style (varying-height) figures by default, which read as a typo
   *  next to the baby-shower artwork's lining numerals. */
  liningNums?: boolean;
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

/**
 * Builds a sensible default field layout for "flat" invitation backgrounds —
 * clean designs whose artwork sits on the borders, leaving an empty central
 * area for text (our wedding + baby-shower stock images). Coordinates are
 * derived as fractions of the natural image size so one helper adapts to any
 * aspect ratio. Positions are intentionally generic (a centered stack in the
 * empty zone): hosts fine-tune them per design by dragging / nudging in the
 * editor's Customize tab. This is what makes every template customizable,
 * not just the hand-tuned ones.
 */
function flatLayout(opts: {
  naturalWidth: number;
  naturalHeight: number;
  eventType: EventType;
  accent: string;
  /** Detail text colour (date / time / venue). Defaults to a dark warm grey
   * that reads on the light pastel backgrounds these templates use. */
  detail?: string;
}): TemplateLayout {
  const { naturalWidth: W, naturalHeight: H, eventType, accent, detail = '#4A3A2E' } = opts;
  const cx = Math.round(W * 0.5);
  const script = 'Great Vibes';
  const body = 'Cormorant Garamond';
  const nameSize = Math.round(W * 0.12);
  const bodySize = Math.round(W * 0.037);
  const wide = Math.round(W * 0.82);

  const fields: TemplateFieldLayout[] = [];

  if (eventType === 'marriage') {
    fields.push(
      { formKey: 'groomName', x: cx, y: Math.round(H * 0.40), fontFamily: script, fontSize: nameSize, color: accent, align: 'center', maxWidth: wide },
      { text: '&', x: cx, y: Math.round(H * 0.465), fontFamily: script, fontSize: Math.round(nameSize * 0.55), color: accent, align: 'center' },
      { formKey: 'brideName', x: cx, y: Math.round(H * 0.515), fontFamily: script, fontSize: nameSize, color: accent, align: 'center', maxWidth: wide }
    );
  } else {
    fields.push(
      { formKey: 'celebrantName', x: cx, y: Math.round(H * 0.43), fontFamily: script, fontSize: nameSize, color: accent, align: 'center', maxWidth: wide }
    );
  }

  fields.push(
    { formKey: 'eventDate', format: 'longDate', x: cx, y: Math.round(H * 0.64), fontFamily: body, fontSize: bodySize, color: detail, align: 'center', maxWidth: wide },
    { formKey: 'eventTime', format: 'time12', x: cx, y: Math.round(H * 0.69), fontFamily: body, fontSize: bodySize, color: detail, align: 'center', maxWidth: wide },
    { formKey: 'venue', x: cx, y: Math.round(H * 0.745), fontFamily: body, fontSize: bodySize, color: detail, align: 'center', maxWidth: wide, lineHeight: Math.round(bodySize * 1.35), wrapAfterChars: 28 }
  );

  return { naturalWidth: W, naturalHeight: H, fields };
}

/* ==========================================================================
 * BABY-SHOWER CONCEPT CARDS (baby-c1 ... baby-c13)
 * --------------------------------------------------------------------------
 * Each concept ships two images in /public/templates/baby shower/concepts/:
 *   {n}-preview.jpg  -> the FILLED sample (gallery thumbnail, previewImage)
 *   {n}-blank.jpg    -> the SAME artwork with the variable text removed
 *                      (the editable background, realImage)
 *
 * The decorative copy + section labels + icons are BAKED into the blank; we
 * overlay ONLY the host-entered values, directly beneath their baked labels.
 *
 * COORDINATES are in the blank's A4 pixel space (2480 x 3508):
 *   bigger x -> right   smaller x -> left
 *   bigger y -> down    smaller y -> up
 * `y` is the TOP of the text block (its first line box), not the baseline.
 *
 * TYPOGRAPHY was measured off each filled `-preview.jpg` by aligning it onto
 * its `-blank.jpg` and reading the ink box of every value, so the overlay
 * reproduces the designed size / weight / colour instead of a generic
 * default. Most concepts set their detail body in Cormorant Garamond (the
 * serif drawn in the artwork); the three watercolour cards (c3, c5, c9) use
 * Montserrat, matching their previews.
 *
 * Hosts can still drag every field in the editor's "Customize Design" tab.
 * The per-template FIELD lists live in eventFields.ts (TEMPLATE_FIELD_SETS).
 * ======================================================================== */
const BABY_W = 2480;
const BABY_H = 3508;
const CG = 'Cormorant Garamond';
const MS = 'Montserrat';
const GV = 'Great Vibes';
const MK = 'Marck Script';

/** One overlaid value on a concept card. Defaults to centred Cormorant
 *  Garamond - every concept overrides what it needs. */
function bf(
  o: Partial<TemplateFieldLayout> & { x: number; y: number; fontSize: number; color: string }
): TemplateFieldLayout {
  return { fontFamily: CG, fontWeight: '500', liningNums: true, align: 'center', maxWidth: 2100, ...o } as TemplateFieldLayout;
}

/** Wraps a concept's field list into a full A4 layout. */
function babyLayout(fields: TemplateFieldLayout[]): TemplateLayout {
  return { naturalWidth: BABY_W, naturalHeight: BABY_H, fields };
}

/** Same idea as babyLayout, but for concept art that isn't the A4 2480x3508
 *  canvas. The revised birthday blanks ship at four different native sizes,
 *  and positions are percentages of the natural box — so each concept has to
 *  declare the size its coordinates were measured in, or the overlay drifts. */
function sizedLayout(naturalWidth: number, naturalHeight: number, fields: TemplateFieldLayout[]): TemplateLayout {
  return { naturalWidth, naturalHeight, fields };
}

const localEviteTemplates: EviteTemplate[] = [
  // -- Birthday concept cards (bday-c1 ... bday-c13) ----------------------
  // Rebuilt against the designer's revised artwork ("FINAL WITH CHANGES"),
  // which dropped the "HOSTED BY" and "APPROX. GUEST COUNT" rows from every
  // card and added one new design. Positions come from diffing each
  // {n}-preview.jpg against its {n}-blank.jpg, so every value sits exactly
  // where the designer printed it.
  //
  // NOTE: these blanks ship at four different native sizes (not the A4
  // 2480x3508 the other categories use), so each concept declares its own
  // natural box via sizedLayout.
  //
  // The revised set also renumbered the files: the "With Info" and "Without
  // Info" folders use DIFFERENT numbering for the same design, so preview
  // and blank were paired by image similarity, not by filename.
  {
    id: 'bday-c1', eventType: 'birthday', name: 'Confetti Pop', style: 'Bright & Cheerful',
    previewImage: '/templates/birthday/concepts/1-preview.jpg',
    realImage: '/templates/birthday/concepts/1-blank.jpg',
    accent: '#2A2A28',
    // Three baked label columns (DATE & TIME / CELEBRANT, then VENUE / LOCATION below).
    layout: sizedLayout(2480, 3508, [
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 998, y: 2350, fontSize: 38, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#2A2A28', maxWidth: 560, fitChars: 69 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 998, y: 2406, fontSize: 38, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#2A2A28', maxWidth: 560, fitChars: 69 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 998, y: 2462, fontSize: 38, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#2A2A28', textTransform: 'uppercase', maxWidth: 560 }),
      bf({ formKey: 'celebrantName', x: 1491, y: 2350, fontSize: 40, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#2A2A28', textTransform: 'uppercase', maxWidth: 560 }),
      bf({ formKey: 'venue', x: 1218, y: 2860, fontSize: 36, fontFamily: MS, fontWeight: '500', color: '#2A2A28', lineHeight: 54, wrapAfterChars: 26, maxWidth: 1100, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'bday-c2', eventType: 'birthday', name: 'Gilded Watercolor', style: 'Warm & Golden',
    previewImage: '/templates/birthday/concepts/2-preview.jpg',
    realImage: '/templates/birthday/concepts/2-blank.jpg',
    accent: '#1B1A18',
    layout: sizedLayout(1024, 1536, [
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 243, y: 987, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#0F0E0C', maxWidth: 250, fitChars: 17 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 242, y: 1016, fontSize: 20, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#151411', maxWidth: 250, fitChars: 17 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 243, y: 1044, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#0D0C0A', textTransform: 'uppercase', maxWidth: 250 }),
      bf({ formKey: 'celebrantName', x: 511, y: 986, fontSize: 20, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#0C0C0A', textTransform: 'uppercase', maxWidth: 250 }),
      bf({ formKey: 'venue', x: 787, y: 981, fontSize: 19, fontFamily: MS, fontWeight: '500', color: '#141312', lineHeight: 27, wrapAfterChars: 18, maxWidth: 300, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'bday-c3', eventType: 'birthday', name: 'Sparkling Toast', style: 'Rose Gold & Citrus',
    previewImage: '/templates/birthday/concepts/3-preview.jpg',
    realImage: '/templates/birthday/concepts/3-blank.jpg',
    accent: '#2B2A27',
    layout: sizedLayout(1024, 1536, [
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 203, y: 1098, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#1A1814', maxWidth: 250, fitChars: 16 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 203, y: 1126, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#1A1815', maxWidth: 250, fitChars: 14 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 204, y: 1157, fontSize: 20, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#181613', textTransform: 'uppercase', maxWidth: 250 }),
      bf({ formKey: 'celebrantName', x: 447, y: 1102, fontSize: 19, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#15120F', textTransform: 'uppercase', maxWidth: 250 }),
      bf({ formKey: 'venue', x: 693, y: 1095, fontSize: 18, fontFamily: MS, fontWeight: '500', color: '#201E1A', lineHeight: 26, wrapAfterChars: 20, maxWidth: 320, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'bday-c5', eventType: 'birthday', name: 'Floral Cake Toast', style: 'Elegant & Blush',
    previewImage: '/templates/birthday/concepts/5-preview.jpg',
    realImage: '/templates/birthday/concepts/5-blank.jpg',
    accent: '#26231E',
    layout: sizedLayout(1024, 1536, [
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 253, y: 1140, fontSize: 18, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#191612', maxWidth: 250, fitChars: 18 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 253, y: 1166, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#161310', maxWidth: 250, fitChars: 17 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 254, y: 1192, fontSize: 18, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#14100C', textTransform: 'uppercase', maxWidth: 250 }),
      bf({ formKey: 'celebrantName', x: 514, y: 1144, fontSize: 18, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#181411', textTransform: 'uppercase', maxWidth: 250 }),
      bf({ formKey: 'venue', x: 775, y: 1136, fontSize: 18, fontFamily: MS, fontWeight: '500', color: '#191511', lineHeight: 24, wrapAfterChars: 20, maxWidth: 300, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'bday-c6', eventType: 'birthday', name: 'Wonderful Birthday', style: 'Playful & Blue',
    previewImage: '/templates/birthday/concepts/6-preview.jpg',
    realImage: '/templates/birthday/concepts/6-blank.jpg',
    accent: '#1E2A3A',
    layout: sizedLayout(1054, 1492, [
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 293, y: 1075, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#1E2A3A', maxWidth: 230, fitChars: 16 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 293, y: 1101, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#1E2A3A', maxWidth: 230, fitChars: 16 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 293, y: 1127, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#1E2A3A', textTransform: 'uppercase', maxWidth: 230 }),
      bf({ formKey: 'celebrantName', x: 523, y: 1075, fontSize: 19, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#1E2A3A', textTransform: 'uppercase', maxWidth: 210 }),
      bf({ formKey: 'venue', x: 747, y: 1073, fontSize: 17, fontFamily: MS, fontWeight: '500', color: '#1E2A3A', lineHeight: 24, wrapAfterChars: 24, maxWidth: 300, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'bday-c7', eventType: 'birthday', name: 'Party Hat & Confetti', style: 'Playful & Pastel',
    previewImage: '/templates/birthday/concepts/7-preview.jpg',
    realImage: '/templates/birthday/concepts/7-blank.jpg',
    accent: '#241F19',
    // Two columns only - this design prints no celebrant name.
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 297, y: 1040, fontSize: 22, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#16140F', maxWidth: 300, fitChars: 20 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 299, y: 1071, fontSize: 23, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#13100D', maxWidth: 300, fitChars: 20 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 299, y: 1101, fontSize: 22, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#15120F', textTransform: 'uppercase', maxWidth: 300 }),
      bf({ formKey: 'venue', x: 645, y: 1027, fontSize: 23, fontFamily: MS, fontWeight: '500', color: '#161410', lineHeight: 29, wrapAfterChars: 18, maxWidth: 330, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'bday-c8', eventType: 'birthday', name: 'Olive & Gold Cocktail', style: 'Moody & Elegant',
    previewImage: '/templates/birthday/concepts/8-preview.jpg',
    realImage: '/templates/birthday/concepts/8-blank.jpg',
    accent: '#E0E1C5',
    // Two columns only, cream ink on the dark olive art.
    layout: sizedLayout(1060, 1484, [
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 361, y: 931, fontSize: 20, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#ECEED3', maxWidth: 300, fitChars: 20 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 361, y: 960, fontSize: 22, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#EDEDD2', maxWidth: 300, fitChars: 19 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 362, y: 990, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#EDEED3', textTransform: 'uppercase', maxWidth: 300 }),
      bf({ formKey: 'venue', x: 710, y: 929, fontSize: 23, fontFamily: MS, fontWeight: '500', color: '#EBECD2', lineHeight: 28, wrapAfterChars: 18, maxWidth: 340, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'bday-c9', eventType: 'birthday', name: 'Pink Ribbon Celebration', style: 'Romantic & Blush',
    previewImage: '/templates/birthday/concepts/9-preview.jpg',
    realImage: '/templates/birthday/concepts/9-blank.jpg',
    accent: '#28251F',
    // Two columns only - this design prints no celebrant name.
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 301, y: 960, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#171410', maxWidth: 300, fitChars: 36 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 300, y: 992, fontSize: 22, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#14100C', maxWidth: 300, fitChars: 34 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 302, y: 1024, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#100D09', textTransform: 'uppercase', maxWidth: 300 }),
      bf({ formKey: 'venue', x: 638, y: 983, fontSize: 24, fontFamily: MS, fontWeight: '500', color: '#14120E', lineHeight: 31, wrapAfterChars: 20, maxWidth: 340, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'bday-c10', eventType: 'birthday', name: 'Safari Jeep Adventure', style: 'Playful & Green',
    previewImage: '/templates/birthday/concepts/10-preview.jpg',
    realImage: '/templates/birthday/concepts/10-blank.jpg',
    accent: '#252420',
    // Date + celebrant sit side by side; venue is centred on its own row below.
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 357, y: 1238, fontSize: 15, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#161512', maxWidth: 240, fitChars: 59 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 357, y: 1262, fontSize: 16, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#191815', maxWidth: 240, fitChars: 52 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 357, y: 1286, fontSize: 16, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#191815', textTransform: 'uppercase', maxWidth: 240 }),
      bf({ formKey: 'celebrantName', x: 596, y: 1254, fontSize: 17, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#171715', textTransform: 'uppercase', maxWidth: 240 }),
      bf({ formKey: 'venue', x: 500, y: 1395, fontSize: 18, fontFamily: MS, fontWeight: '500', color: '#171613', lineHeight: 24, wrapAfterChars: 18, maxWidth: 420, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'bday-c11', eventType: 'birthday', name: 'Balloon Buddies', style: 'Playful & Pastel',
    previewImage: '/templates/birthday/concepts/11-preview.jpg',
    realImage: '/templates/birthday/concepts/11-blank.jpg',
    accent: '#0E0D0C',
    // Single centred column; weekday and date share one line here.
    layout: sizedLayout(1024, 1536, [
      bf({ formKey: 'eventDate', format: 'longDateDayMonthUpper', x: 517, y: 712, fontSize: 26, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#080806', maxWidth: 420, fitChars: 35 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 515, y: 748, fontSize: 25, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#080806', textTransform: 'uppercase', maxWidth: 420 }),
      bf({ formKey: 'venue', x: 512, y: 1014, fontSize: 25, fontFamily: MS, fontWeight: '500', color: '#12110F', lineHeight: 30, wrapAfterChars: 20, maxWidth: 460, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'bday-c13', eventType: 'birthday', name: 'Hot Air Balloon Delivery', style: 'Whimsical & Copper',
    previewImage: '/templates/birthday/concepts/13-preview.jpg',
    realImage: '/templates/birthday/concepts/13-blank.jpg',
    accent: '#33261E',
    // Stacked rows with a baked dotted rule under each label; values sit on
    // the rule. The "A LITTLE NOTE" panel is baked copy telling the host the
    // custom message travels with the invite, so nothing is printed there.
    layout: sizedLayout(1060, 1484, [
      bf({ formKey: 'celebrantName', x: 818, y: 582, fontSize: 24, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#33261E', textTransform: 'uppercase', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'longDateDayMonthUpper', x: 818, y: 815, fontSize: 20, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#33261E', maxWidth: 300, fitChars: 26 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 818, y: 856, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#33261E', textTransform: 'uppercase', maxWidth: 300 }),
      bf({ formKey: 'venue', x: 818, y: 1057, fontSize: 18, fontFamily: MS, fontWeight: '500', color: '#33261E', lineHeight: 24, wrapAfterChars: 30, maxWidth: 360, textTransform: 'uppercase' }),
    ]),
  },
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

  // ── Wedding concept cards (wed-c1 … wed-c12) ────────────────────────────
  // Same measurement approach as the baby-shower / birthday / pre-wedding
  // concept cards above: each {n}-preview.jpg (filled sample) is a NARROWER
  // crop than its {n}-blank.jpg (full A4 2480x3508 editable background) —
  // the preview and blank are NOT the same aspect ratio for this batch, so
  // positions are measured directly off the blank's own baked guide marks
  // (the "&"/"and" connector, divider flourishes, date-stamp bars) rather
  // than by warping the preview onto the blank. The preview is used only
  // for font / color / relative-order reference.
  //
  // Every concept prints "Bride & Groom" (script, baked "&"/"and" between
  // them), a SATURDAY / FEB | 14 | 2027 date stamp, a time, and a venue;
  // several also print a guest count. Names are POSITIONED CLOSE to the
  // baked connector (matching the source art) but this batch skews toward
  // shorter first-name-only samples in the source, so every name field
  // still gets a generous maxWidth and — where the connector sits mid-line
  // rather than stacked above/below — outward alignment, to stay robust
  // against longer real names.
  {
    id: 'wed-c1', eventType: 'marriage', name: 'Lotus Palace', style: 'Blush & Palace',
    previewImage: '/templates/wedding/concepts/1-preview.jpg',
    realImage: '/templates/wedding/concepts/1-blank.jpg',
    accent: '#752433',
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 1240, y: 610, fontSize: 150, fontFamily: GV, color: '#752433', maxWidth: 1900 }),
      bf({ formKey: 'groomName', x: 1240, y: 1105, fontSize: 150, fontFamily: GV, color: '#752433', maxWidth: 1900 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1245, y: 1965, fontSize: 42, fontFamily: CG, fontWeight: '500', letterSpacing: 4, color: '#752433', maxWidth: 900, fitChars: 82 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 880, y: 2078, fontSize: 38, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#752433', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1232, y: 2045, fontSize: 130, fontFamily: CG, fontWeight: '600', color: '#5A0F1E', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1590, y: 2078, fontSize: 38, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#752433', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1245, y: 2225, fontSize: 38, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#752433', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2325, fontSize: 44, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#752433', lineHeight: 68, wrapAfterChars: 22, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },
  // NOTE: even though this looks like the same arch-doorway composition as
  // wed-c1, its guide marks sit at DIFFERENT absolute pixel positions — do
  // not assume shared coordinates between concepts without re-measuring.
  {
    id: 'wed-c2', eventType: 'marriage', name: 'Stone Temple', style: 'Dark & Copper',
    previewImage: '/templates/wedding/concepts/2-preview.jpg',
    realImage: '/templates/wedding/concepts/2-blank.jpg',
    accent: '#B9774F',
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 1270, y: 990, fontSize: 110, fontFamily: GV, color: '#B9774F', maxWidth: 1800 }),
      bf({ formKey: 'groomName', x: 1270, y: 1420, fontSize: 110, fontFamily: GV, color: '#B9774F', maxWidth: 1800 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1250, y: 2075, fontSize: 34, fontFamily: CG, fontWeight: '500', letterSpacing: 4, color: '#B9774F', maxWidth: 900, fitChars: 52 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 830, y: 2225, fontSize: 34, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#B9774F', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1225, y: 2195, fontSize: 100, fontFamily: CG, fontWeight: '600', color: '#D69B6C', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1620, y: 2225, fontSize: 34, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#B9774F', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1250, y: 2370, fontSize: 34, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#B9774F', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1250, y: 2470, fontSize: 40, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#B9774F', lineHeight: 62, wrapAfterChars: 22, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'wed-c3', eventType: 'marriage', name: 'Mandap Garden', style: 'Palace & Elephant',
    previewImage: '/templates/wedding/concepts/3-preview.jpg',
    realImage: '/templates/wedding/concepts/3-blank.jpg',
    accent: '#6C1515',
    // Has one more baked divider than wed-c1/2: names -> [divider] ->
    // custom message -> [divider] -> SATURDAY -> date bars -> time ->
    // [divider] -> venue -> [divider] -> guest count -> mandap photo.
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 1240, y: 930, fontSize: 100, fontFamily: GV, color: '#6C1515', maxWidth: 1800 }),
      bf({ formKey: 'groomName', x: 1240, y: 1385, fontSize: 100, fontFamily: GV, color: '#6C1515', maxWidth: 1800 }),
      bf({ formKey: 'customMessage', x: 1240, y: 1685, fontSize: 26, fontFamily: CG, fontWeight: '500', letterSpacing: 1, color: '#6C1515', lineHeight: 42, wrapAfterChars: 34, maxWidth: 1550, textTransform: 'uppercase' }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1245, y: 2005, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#6C1515', maxWidth: 900, fitChars: 61 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 920, y: 2113, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#6C1515', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1232, y: 2078, fontSize: 105, fontFamily: CG, fontWeight: '600', color: '#4A0E0E', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1545, y: 2113, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#6C1515', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1245, y: 2230, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#6C1515', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2410, fontSize: 38, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#6C1515', lineHeight: 60, wrapAfterChars: 22, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'wed-c4', eventType: 'marriage', name: 'Lakeside Arch', style: 'Ivory & Bells',
    previewImage: '/templates/wedding/concepts/4-preview.jpg',
    realImage: '/templates/wedding/concepts/4-blank.jpg',
    accent: '#442619',
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 1300, y: 940, fontSize: 100, fontFamily: GV, color: '#442619', maxWidth: 1800 }),
      bf({ formKey: 'groomName', x: 1300, y: 1420, fontSize: 100, fontFamily: GV, color: '#442619', maxWidth: 1800 }),
      bf({ formKey: 'customMessage', x: 1300, y: 1755, fontSize: 26, fontFamily: CG, fontWeight: '500', letterSpacing: 1, color: '#442619', lineHeight: 42, wrapAfterChars: 34, maxWidth: 1550, textTransform: 'uppercase' }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1305, y: 2175, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#442619', maxWidth: 900 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 970, y: 2288, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#442619', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1237, y: 2255, fontSize: 100, fontFamily: CG, fontWeight: '600', color: '#8A5A2E', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1500, y: 2288, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#442619', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1305, y: 2440, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#442619', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1300, y: 2755, fontSize: 38, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#442619', lineHeight: 60, wrapAfterChars: 22, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },
  // First names print large; surnames print smaller (with floral accents)
  // on their own line below. A one-word name just skips the surname line.
  {
    id: 'wed-c5', eventType: 'marriage', name: 'Banana Leaf Court', style: 'Ivory & Olive',
    previewImage: '/templates/wedding/concepts/5-preview.jpg',
    realImage: '/templates/wedding/concepts/5-blank.jpg',
    accent: '#393D12',
    layout: babyLayout([
      bf({ formKey: 'brideName', format: 'firstWord', x: 1240, y: 700, fontSize: 92, fontFamily: GV, color: '#393D12', maxWidth: 1700 }),
      bf({ formKey: 'brideName', format: 'restOfName', x: 1240, y: 1050, fontSize: 34, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#A38454', maxWidth: 900 }),
      bf({ formKey: 'groomName', format: 'firstWord', x: 1240, y: 1290, fontSize: 92, fontFamily: GV, color: '#393D12', maxWidth: 1700 }),
      bf({ formKey: 'groomName', format: 'restOfName', x: 1240, y: 1580, fontSize: 34, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#A38454', maxWidth: 900 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1245, y: 2085, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#393D12', maxWidth: 900, fitChars: 96 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 940, y: 2278, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#393D12', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1237, y: 2245, fontSize: 100, fontFamily: CG, fontWeight: '600', color: '#7A6428', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1530, y: 2278, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#393D12', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1245, y: 2400, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#393D12', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2645, fontSize: 38, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#393D12', lineHeight: 60, wrapAfterChars: 22, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },
  // Has a SECOND baked intro line ("WITH IMMENSE JOY, WE INVITE YOU TO
  // CELEBRATE THE WEDDING OF") beyond the usual header — fixed art, not
  // overlaid. Names use the firstWord/restOfName split (like wed-c5) with
  // a baked "and" between the two people instead of "&".
  {
    id: 'wed-c6', eventType: 'marriage', name: 'Orchid Conservatory', style: 'Glasshouse & Ivory',
    previewImage: '/templates/wedding/concepts/6-preview.jpg',
    realImage: '/templates/wedding/concepts/6-blank.jpg',
    accent: '#404215',
    layout: babyLayout([
      bf({ formKey: 'brideName', format: 'firstWord', x: 1240, y: 1080, fontSize: 82, fontFamily: GV, color: '#404215', maxWidth: 1700 }),
      bf({ formKey: 'brideName', format: 'restOfName', x: 1240, y: 1290, fontSize: 30, fontFamily: GV, color: '#BFA47B', maxWidth: 900 }),
      bf({ formKey: 'groomName', format: 'firstWord', x: 1240, y: 1560, fontSize: 82, fontFamily: GV, color: '#404215', maxWidth: 1700 }),
      bf({ formKey: 'groomName', format: 'restOfName', x: 1240, y: 1900, fontSize: 30, fontFamily: GV, color: '#BFA47B', maxWidth: 900 }),
      bf({ formKey: 'customMessage', x: 1240, y: 2165, fontSize: 26, fontFamily: CG, fontWeight: '500', letterSpacing: 1, color: '#404215', lineHeight: 42, wrapAfterChars: 34, maxWidth: 1550 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1245, y: 2510, fontSize: 24, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#404215', maxWidth: 900, fitChars: 59 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 800, y: 2615, fontSize: 28, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#404215', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1227, y: 2590, fontSize: 78, fontFamily: CG, fontWeight: '600', color: '#8A7439', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1460, y: 2615, fontSize: 28, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#404215', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1245, y: 2705, fontSize: 28, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#404215', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1245, y: 3005, fontSize: 29, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#404215', lineHeight: 37, wrapAfterChars: 26, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'wed-c7', eventType: 'marriage', name: 'Navy Balcony', style: 'Royal & Gold',
    previewImage: '/templates/wedding/concepts/7-preview.jpg',
    realImage: '/templates/wedding/concepts/7-blank.jpg',
    accent: '#1B1B3A',
    layout: babyLayout([
      bf({ formKey: 'brideName', format: 'firstWord', x: 1240, y: 750, fontSize: 92, fontFamily: GV, color: '#1B1B3A', maxWidth: 1700 }),
      bf({ formKey: 'brideName', format: 'restOfName', x: 1240, y: 980, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#9C7B3D', maxWidth: 900 }),
      bf({ formKey: 'groomName', format: 'firstWord', x: 1240, y: 1400, fontSize: 92, fontFamily: GV, color: '#1B1B3A', maxWidth: 1700 }),
      bf({ formKey: 'groomName', format: 'restOfName', x: 1240, y: 1630, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#9C7B3D', maxWidth: 900 }),
      bf({ formKey: 'customMessage', x: 1240, y: 1915, fontSize: 26, fontFamily: CG, fontWeight: '500', letterSpacing: 1, color: '#1B1B3A', lineHeight: 40, wrapAfterChars: 34, maxWidth: 1550, textTransform: 'uppercase' }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1245, y: 2140, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#1B1B3A', maxWidth: 900, fitChars: 70 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 850, y: 2405, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#1B1B3A', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1245, y: 2380, fontSize: 88, fontFamily: CG, fontWeight: '600', color: '#9C7B3D', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1600, y: 2405, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#1B1B3A', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1245, y: 2525, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#1B1B3A', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2800, fontSize: 34, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#1B1B3A', lineHeight: 46, wrapAfterChars: 24, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'wed-c8', eventType: 'marriage', name: 'Sunset Cliffside', style: 'Blush & Coastal',
    previewImage: '/templates/wedding/concepts/8-preview.jpg',
    realImage: '/templates/wedding/concepts/8-blank.jpg',
    accent: '#4B0F0D',
    layout: babyLayout([
      bf({ formKey: 'brideName', format: 'firstWord', x: 1240, y: 1060, fontSize: 88, fontFamily: GV, color: '#4B0F0D', maxWidth: 1700 }),
      bf({ formKey: 'brideName', format: 'restOfName', x: 1240, y: 1245, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#B08D3E', maxWidth: 900 }),
      bf({ formKey: 'groomName', format: 'firstWord', x: 1240, y: 1430, fontSize: 88, fontFamily: GV, color: '#4B0F0D', maxWidth: 1700 }),
      bf({ formKey: 'groomName', format: 'restOfName', x: 1240, y: 1615, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#B08D3E', maxWidth: 900 }),
      bf({ formKey: 'customMessage', x: 1240, y: 1850, fontSize: 26, fontFamily: CG, fontWeight: '500', letterSpacing: 1, color: '#4B0F0D', lineHeight: 46, wrapAfterChars: 30, maxWidth: 1600, textTransform: 'uppercase' }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1245, y: 2150, fontSize: 26, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#4B0F0D', maxWidth: 900 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 850, y: 2250, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#4B0F0D', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1227, y: 2225, fontSize: 82, fontFamily: CG, fontWeight: '600', color: '#B08D3E', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1560, y: 2250, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#4B0F0D', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1245, y: 2360, fontSize: 28, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#4B0F0D', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2585, fontSize: 34, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#4B0F0D', lineHeight: 46, wrapAfterChars: 24, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'wed-c9', eventType: 'marriage', name: 'Jasmine Courtyard', style: 'Ivory & Sage',
    previewImage: '/templates/wedding/concepts/9-preview.jpg',
    realImage: '/templates/wedding/concepts/9-blank.jpg',
    accent: '#3D4A2A',
    layout: babyLayout([
      bf({ formKey: 'brideName', format: 'firstWord', x: 1240, y: 830, fontSize: 88, fontFamily: CG, fontWeight: '500', color: '#3D4A2A', maxWidth: 1700 }),
      bf({ formKey: 'brideName', format: 'restOfName', x: 1240, y: 1040, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 6, color: '#A38454', maxWidth: 900 }),
      bf({ formKey: 'groomName', format: 'firstWord', x: 1240, y: 1330, fontSize: 88, fontFamily: CG, fontWeight: '500', color: '#3D4A2A', maxWidth: 1700 }),
      bf({ formKey: 'groomName', format: 'restOfName', x: 1240, y: 1540, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 6, color: '#A38454', maxWidth: 900 }),
      bf({ formKey: 'customMessage', x: 1240, y: 1830, fontSize: 26, fontFamily: CG, fontStyle: 'italic', fontWeight: '500', color: '#3D4A2A', lineHeight: 42, wrapAfterChars: 30, maxWidth: 1500 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1245, y: 2175, fontSize: 26, fontFamily: CG, fontWeight: '500', letterSpacing: 4, color: '#A38454', maxWidth: 900, fitChars: 108 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 870, y: 2325, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#3D4A2A', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1242, y: 2295, fontSize: 82, fontFamily: CG, fontWeight: '600', color: '#A38454', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1590, y: 2325, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#3D4A2A', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1245, y: 2440, fontSize: 28, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#3D4A2A', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2790, fontSize: 34, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#3D4A2A', lineHeight: 46, wrapAfterChars: 24, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'wed-c10', eventType: 'marriage', name: 'Moonlit Lotus Pond', style: 'Emerald & Gold',
    previewImage: '/templates/wedding/concepts/10-preview.jpg',
    realImage: '/templates/wedding/concepts/10-blank.jpg',
    accent: '#E3B473',
    layout: babyLayout([
      bf({ formKey: 'brideName', format: 'firstWord', x: 1240, y: 1040, fontSize: 88, fontFamily: CG, fontWeight: '500', color: '#E3B473', maxWidth: 1700 }),
      bf({ formKey: 'brideName', format: 'restOfName', x: 1240, y: 1290, fontSize: 34, fontFamily: GV, color: '#E3B473', maxWidth: 900 }),
      bf({ formKey: 'groomName', format: 'firstWord', x: 1240, y: 1580, fontSize: 88, fontFamily: CG, fontWeight: '500', color: '#E3B473', maxWidth: 1700 }),
      bf({ formKey: 'groomName', format: 'restOfName', x: 1240, y: 1820, fontSize: 34, fontFamily: GV, color: '#E3B473', maxWidth: 900 }),
      bf({ formKey: 'customMessage', x: 1240, y: 2080, fontSize: 26, fontFamily: CG, fontStyle: 'italic', fontWeight: '500', color: '#E5E0D0', lineHeight: 44, wrapAfterChars: 28, maxWidth: 1500 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1245, y: 2445, fontSize: 26, fontFamily: CG, fontWeight: '500', letterSpacing: 4, color: '#E5E0D0', maxWidth: 900, fitChars: 66 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 880, y: 2590, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#E5E0D0', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1247, y: 2565, fontSize: 82, fontFamily: CG, fontWeight: '600', color: '#E3B473', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1600, y: 2590, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#E5E0D0', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1245, y: 2710, fontSize: 28, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#E5E0D0', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 3020, fontSize: 34, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#E3B473', lineHeight: 46, wrapAfterChars: 24, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },
  // Die-cut arch card with an illustrated couple at the bottom — venue/
  // guests sit in a tight band above their heads, so kept compact.
  {
    id: 'wed-c11', eventType: 'marriage', name: 'Peacock Garden', style: 'Ivory & Navy',
    previewImage: '/templates/wedding/concepts/11-preview.jpg',
    realImage: '/templates/wedding/concepts/11-blank.jpg',
    accent: '#0A2444',
    layout: babyLayout([
      bf({ formKey: 'brideName', format: 'firstWord', x: 1240, y: 1150, fontSize: 78, fontFamily: CG, fontWeight: '600', color: '#0A2444', maxWidth: 1700, textTransform: 'uppercase' }),
      bf({ formKey: 'brideName', format: 'restOfName', x: 1240, y: 1350, fontSize: 28, fontFamily: CG, fontWeight: '500', letterSpacing: 6, color: '#0A2444', maxWidth: 900, textTransform: 'uppercase' }),
      bf({ formKey: 'groomName', format: 'firstWord', x: 1240, y: 1670, fontSize: 78, fontFamily: CG, fontWeight: '600', color: '#0A2444', maxWidth: 1700, textTransform: 'uppercase' }),
      bf({ formKey: 'groomName', format: 'restOfName', x: 1240, y: 1810, fontSize: 28, fontFamily: CG, fontWeight: '500', letterSpacing: 6, color: '#0A2444', maxWidth: 900, textTransform: 'uppercase' }),
      bf({ formKey: 'customMessage', x: 1240, y: 1955, fontSize: 26, fontFamily: CG, fontStyle: 'italic', fontWeight: '500', color: '#0A2444', lineHeight: 40, wrapAfterChars: 32, maxWidth: 1500 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1245, y: 2180, fontSize: 26, fontFamily: CG, fontWeight: '500', letterSpacing: 4, color: '#0A2444', maxWidth: 900, fitChars: 72 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 870, y: 2305, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#0A2444', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1252, y: 2280, fontSize: 80, fontFamily: CG, fontWeight: '600', color: '#B08D3E', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1620, y: 2305, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#0A2444', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1245, y: 2420, fontSize: 28, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#B08D3E', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2760, fontSize: 28, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#0A2444', lineHeight: 36, wrapAfterChars: 26, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'wed-c12', eventType: 'marriage', name: 'Handmade Paper Meadow', style: 'Deckle & Indigo',
    previewImage: '/templates/wedding/concepts/12-preview.jpg',
    realImage: '/templates/wedding/concepts/12-blank.jpg',
    accent: '#223145',
    layout: babyLayout([
      bf({ formKey: 'brideName', format: 'firstWord', x: 1240, y: 1030, fontSize: 82, fontFamily: CG, fontWeight: '500', color: '#223145', maxWidth: 1700 }),
      bf({ formKey: 'brideName', format: 'restOfName', x: 1240, y: 1260, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 6, color: '#223145', maxWidth: 900 }),
      bf({ formKey: 'groomName', format: 'firstWord', x: 1240, y: 1560, fontSize: 82, fontFamily: CG, fontWeight: '500', color: '#223145', maxWidth: 1700 }),
      bf({ formKey: 'groomName', format: 'restOfName', x: 1240, y: 1800, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 6, color: '#223145', maxWidth: 900 }),
      bf({ formKey: 'customMessage', x: 1240, y: 1935, fontSize: 26, fontFamily: CG, fontStyle: 'italic', fontWeight: '500', color: '#223145', lineHeight: 42, wrapAfterChars: 30, maxWidth: 1500 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1245, y: 2225, fontSize: 26, fontFamily: CG, fontWeight: '500', letterSpacing: 4, color: '#223145', maxWidth: 900, fitChars: 60 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 860, y: 2350, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#223145', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1235, y: 2320, fontSize: 82, fontFamily: CG, fontWeight: '600', color: '#223145', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1600, y: 2350, fontSize: 30, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#223145', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1245, y: 2460, fontSize: 28, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#223145', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2775, fontSize: 34, fontFamily: CG, fontWeight: '600', letterSpacing: 1, color: '#223145', lineHeight: 46, wrapAfterChars: 24, maxWidth: 1700, textTransform: 'uppercase' }),
    ]),
  },

  // ── Wedding (8 templates, pre-existing) ─────────────────────────────────
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

  { id: 'wed-1', eventType: 'marriage', name: 'Classic Romance',  style: 'Timeless & Elegant',    previewImage: '/templates/wedding/1.jpg', accent: '#c4a882', layout: flatLayout({ naturalWidth: 736, naturalHeight: 1308, eventType: 'marriage', accent: '#a8843a' }) },
  { id: 'wed-2', eventType: 'marriage', name: 'Botanical Dream',  style: 'Lush & Natural',         previewImage: '/templates/wedding/2.jpg', accent: '#7d9b76', layout: flatLayout({ naturalWidth: 564, naturalHeight: 1002, eventType: 'marriage', accent: '#5f7d58' }) },
  { id: 'wed-3', eventType: 'marriage', name: 'Modern Luxe',      style: 'Sleek & Sophisticated',  previewImage: '/templates/wedding/3.jpg', accent: '#1a1a2e', layout: flatLayout({ naturalWidth: 622, naturalHeight: 1200, eventType: 'marriage', accent: '#1a1a2e' }) },
  { id: 'wed-4', eventType: 'marriage', name: 'Rustic Charm',     style: 'Warm & Earthy',          previewImage: '/templates/wedding/4.jpg', accent: '#b5651d', layout: flatLayout({ naturalWidth: 736, naturalHeight: 1308, eventType: 'marriage', accent: '#b5651d' }) },
  { id: 'wed-5', eventType: 'marriage', name: 'Indian Heritage',  style: 'Traditional & Vibrant',  previewImage: '/templates/wedding/5.jpg', accent: '#e67e22', layout: flatLayout({ naturalWidth: 736, naturalHeight: 1308, eventType: 'marriage', accent: '#c2611b' }) },
  { id: 'wed-6', eventType: 'marriage', name: 'Mehendi Magic',    style: 'Bohemian & Festive',     previewImage: '/templates/wedding/6.jpg', accent: '#c4a882', layout: flatLayout({ naturalWidth: 675, naturalHeight: 1200, eventType: 'marriage', accent: '#a8843a' }) },
  { id: 'wed-7', eventType: 'marriage', name: 'Golden Mandap',    style: 'Regal & Traditional',    previewImage: '/templates/wedding/7.jpg', accent: '#c9b037', layout: flatLayout({ naturalWidth: 736, naturalHeight: 1308, eventType: 'marriage', accent: '#9c8722' }) },

  // ── Baby Shower (20 templates) ──────────────────────────────────────────
  // First: 13 "concept" cards (baby-c1…c13), rebuilt against the designer's
  // revised artwork ("FINAL BABY SHOWER INVITATIONS"). The revision stripped
  // every card back to DATE & TIME / VENUE / a closing note — the celebrant
  // name, guest count, baby's gender, registry, "hosted by" and RSVP rows are
  // gone from the artwork, so they're gone from the overlay and the form too.
  // Designs 1 and 3 also swapped places in the designer's numbering.
  //
  // previewImage = the filled sample (gallery thumbnail); realImage = the
  // blank the host's details are overlaid onto. These blanks ship at five
  // different native sizes (not the A4 2480x3508 the older cards used), so
  // each concept declares its own natural box via sizedLayout. Positions come
  // from diffing each {n}-preview.jpg against its {n}-blank.jpg, so every
  // value sits exactly where the designer printed it.
  // Per-template form fields live in eventFields.ts (TEMPLATE_FIELD_SETS).
  {
    id: 'baby-c1', eventType: 'babyshower', name: 'Sweet Dreams Elephant', style: 'Playful & Pink',
    previewImage: '/templates/baby shower/concepts/1-preview.jpg',
    realImage: '/templates/baby shower/concepts/1-blank.jpg',
    accent: '#E9A6B4',
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'eventDate', format: 'ordinalDate', x: 470, y: 958, fontSize: 48, color: '#3E627A', maxWidth: 884, fitChars: 37 }),
      bf({ formKey: 'eventDate', format: 'weekdayTitle', x: 473, y: 1009, fontSize: 33, letterSpacing: 6, color: '#426377', maxWidth: 884 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 473, y: 1043, fontSize: 41, color: '#3E6178', maxWidth: 884 }),
      bf({ formKey: 'venue', x: 470, y: 1169, fontSize: 31, color: '#525959', lineHeight: 33, maxWidth: 884, wrapAfterChars: 20, maxLines: 3 }),
      bf({ formKey: 'customMessage', x: 468, y: 1291, fontSize: 29, color: '#525352', lineHeight: 35, maxWidth: 884, wrapAfterChars: 40, maxLines: 4 }),
    ]),
  },
  {
    id: 'baby-c2', eventType: 'babyshower', name: 'Little Wardrobe', style: 'Soft & Neutral',
    previewImage: '/templates/baby shower/concepts/2-preview.jpg',
    realImage: '/templates/baby shower/concepts/2-blank.jpg',
    accent: '#C3B49C',
    layout: sizedLayout(1023, 1537, [
      bf({ formKey: 'eventDate', format: 'ordinalDateThenWeekday', x: 524, y: 649, fontSize: 48, color: '#3B463B', lineHeight: 51, maxWidth: 961, fitChars: 37 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 520, y: 744, fontSize: 43, color: '#3B463C', maxWidth: 961 }),
      bf({ formKey: 'venue', x: 519, y: 884, fontSize: 30, color: '#4F554E', lineHeight: 33, maxWidth: 961, wrapAfterChars: 20, maxLines: 3 }),
      bf({ formKey: 'customMessage', x: 513, y: 1019, fontSize: 27, color: '#4A4C47', lineHeight: 32, maxWidth: 961, wrapAfterChars: 34, maxLines: 5 }),
    ]),
  },
  {
    id: 'baby-c3', eventType: 'babyshower', name: 'Banana Leaf Blessings', style: 'Cultural & Botanical',
    previewImage: '/templates/baby shower/concepts/3-preview.jpg',
    realImage: '/templates/baby shower/concepts/3-blank.jpg',
    accent: '#D4762A',
    layout: sizedLayout(1024, 1536, [
      bf({ formKey: 'eventDate', format: 'ordinalDateThenWeekday', x: 518, y: 752, fontSize: 46, color: '#163315', lineHeight: 46, maxWidth: 962, fitChars: 39 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 517, y: 842, fontSize: 44, color: '#163315', maxWidth: 962 }),
      bf({ formKey: 'venue', x: 516, y: 983, fontSize: 27, color: '#354226', lineHeight: 30, maxWidth: 962, wrapAfterChars: 26, maxLines: 3 }),
      bf({ formKey: 'customMessage', x: 514, y: 1136, fontSize: 27, color: '#364125', lineHeight: 30, maxWidth: 962, wrapAfterChars: 36, maxLines: 4 }),
    ]),
  },
  {
    id: 'baby-c4', eventType: 'babyshower', name: 'Nursery Whimsy', style: 'Sage & Sweet',
    previewImage: '/templates/baby shower/concepts/4-preview.jpg',
    realImage: '/templates/baby shower/concepts/4-blank.jpg',
    accent: '#8C9A6E',
    layout: sizedLayout(1024, 1536, [
      bf({ formKey: 'eventDate', format: 'ordinalDateThenWeekday', x: 512, y: 703, fontSize: 47, color: '#46472E', lineHeight: 52, maxWidth: 962, fitChars: 41 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 513, y: 802, fontSize: 46, color: '#574126', maxWidth: 962 }),
      bf({ formKey: 'venue', x: 513, y: 968, fontSize: 30, color: '#53402E', lineHeight: 35, maxWidth: 962, wrapAfterChars: 20, maxLines: 3 }),
      bf({ formKey: 'customMessage', x: 513, y: 1150, fontSize: 27, color: '#594533', lineHeight: 36, maxWidth: 962, wrapAfterChars: 40, maxLines: 5 }),
    ]),
  },
  {
    id: 'baby-c5', eventType: 'babyshower', name: 'Meadow Mobile', style: 'Gentle & Green',
    previewImage: '/templates/baby shower/concepts/5-preview.jpg',
    realImage: '/templates/baby shower/concepts/5-blank.jpg',
    accent: '#9BAE84',
    layout: sizedLayout(1054, 1492, [
      bf({ formKey: 'eventDate', format: 'ordinalDateThenWeekday', x: 530, y: 676, fontSize: 49, color: '#4B5440', lineHeight: 53, maxWidth: 990, fitChars: 36 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 528, y: 771, fontSize: 47, color: '#4B5440', maxWidth: 990 }),
      bf({ formKey: 'venue', x: 527, y: 928, fontSize: 29, color: '#484D45', lineHeight: 32, maxWidth: 990, wrapAfterChars: 26, maxLines: 3 }),
      bf({ formKey: 'customMessage', x: 531, y: 1096, fontSize: 30, color: '#4C413A', lineHeight: 32, maxWidth: 990, wrapAfterChars: 38, maxLines: 4 }),
    ]),
  },
  {
    id: 'baby-c6', eventType: 'babyshower', name: 'Over the Moon', style: 'Celestial & Navy',
    previewImage: '/templates/baby shower/concepts/6-preview.jpg',
    realImage: '/templates/baby shower/concepts/6-blank.jpg',
    accent: '#D8B25C',
    layout: sizedLayout(1055, 1491, [
      bf({ formKey: 'eventDate', format: 'ordinalDateThenWeekday', x: 529, y: 668, fontSize: 43, color: '#E9F1FA', lineHeight: 45, maxWidth: 991, fitChars: 44 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 531, y: 754, fontSize: 43, color: '#EAF2FA', maxWidth: 991 }),
      bf({ formKey: 'venue', x: 530, y: 886, fontSize: 26, color: '#C8D6EA', lineHeight: 32, maxWidth: 991, wrapAfterChars: 26, maxLines: 3 }),
      bf({ formKey: 'customMessage', x: 525, y: 1055, fontSize: 32, color: '#293556', lineHeight: 43, maxWidth: 991, wrapAfterChars: 38, maxLines: 4 }),
    ]),
  },
  {
    id: 'baby-c7', eventType: 'babyshower', name: 'Balloons & Bows', style: 'Blush & Gold',
    previewImage: '/templates/baby shower/concepts/7-preview.jpg',
    realImage: '/templates/baby shower/concepts/7-blank.jpg',
    accent: '#E9A2AE',
    layout: sizedLayout(1055, 1491, [
      bf({ formKey: 'eventDate', format: 'ordinalDateThenWeekday', x: 404, y: 814, fontSize: 30, color: '#3A2E2D', lineHeight: 34, maxWidth: 991, fitChars: 18 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 404, y: 878, fontSize: 28, color: '#372929', maxWidth: 991 }),
      bf({ formKey: 'venue', x: 706, y: 814, fontSize: 26, color: '#413533', lineHeight: 32, maxWidth: 991, wrapAfterChars: 20, maxLines: 4 }),
      bf({ formKey: 'customMessage', x: 569, y: 1052, fontSize: 29, color: '#3C2C2C', lineHeight: 35, maxWidth: 991, wrapAfterChars: 38, maxLines: 4 }),
    ]),
  },
  {
    id: 'baby-c8', eventType: 'babyshower', name: 'Heritage Cradle', style: 'Traditional & Gold',
    previewImage: '/templates/baby shower/concepts/8-preview.jpg',
    realImage: '/templates/baby shower/concepts/8-blank.jpg',
    accent: '#6E8B4E',
    layout: sizedLayout(1055, 1491, [
      bf({ formKey: 'eventDate', format: 'ordinalDateThenWeekday', x: 383, y: 869, fontSize: 27, color: '#25211F', lineHeight: 29, maxWidth: 991, fitChars: 19 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 384, y: 925, fontSize: 27, color: '#201B18', maxWidth: 991 }),
      bf({ formKey: 'venue', x: 674, y: 870, fontSize: 24, color: '#312D29', lineHeight: 30, maxWidth: 991, wrapAfterChars: 20, maxLines: 4 }),
      bf({ formKey: 'customMessage', x: 529, y: 1037, fontSize: 27, color: '#2F2C29', lineHeight: 34, maxWidth: 991, wrapAfterChars: 38, maxLines: 5 }),
    ]),
  },
  {
    id: 'baby-c9', eventType: 'babyshower', name: 'Adventure Awaits', style: 'Sky & Clouds',
    previewImage: '/templates/baby shower/concepts/9-preview.jpg',
    realImage: '/templates/baby shower/concepts/9-blank.jpg',
    accent: '#5C87BF',
    layout: sizedLayout(1054, 1492, [
      bf({ formKey: 'eventDate', format: 'ordinalDateThenWeekday', x: 378, y: 867, fontSize: 29, color: '#2E4773', lineHeight: 34, maxWidth: 990, fitChars: 18 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 379, y: 933, fontSize: 30, color: '#26416F', maxWidth: 990 }),
      bf({ formKey: 'venue', x: 689, y: 859, fontSize: 25, color: '#3A5177', lineHeight: 32, maxWidth: 990, wrapAfterChars: 22, maxLines: 4 }),
      bf({ formKey: 'customMessage', x: 528, y: 1053, fontSize: 27, color: '#31486F', lineHeight: 36, maxWidth: 990, wrapAfterChars: 34, maxLines: 5 }),
      bf({ text: 'We can’t wait to celebrate\nthis beautiful new beginning\nwith you!', x: 529, y: 1282, fontSize: 27, color: '#2D4162', lineHeight: 37, maxWidth: 990 }),
    ]),
  },
  {
    id: 'baby-c10', eventType: 'babyshower', name: 'Bluebird Arch', style: 'Airy & Blue',
    previewImage: '/templates/baby shower/concepts/10-preview.jpg',
    realImage: '/templates/baby shower/concepts/10-blank.jpg',
    accent: '#9BBBDD',
    layout: sizedLayout(1054, 1492, [
      bf({ formKey: 'eventDate', format: 'ordinalDateThenWeekday', x: 380, y: 836, fontSize: 29, color: '#4C3632', lineHeight: 35, maxWidth: 990, fitChars: 18 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 381, y: 903, fontSize: 29, color: '#422E2C', maxWidth: 990 }),
      bf({ formKey: 'venue', x: 680, y: 836, fontSize: 26, color: '#533C37', lineHeight: 33, maxWidth: 990, wrapAfterChars: 20, maxLines: 5 }),
      bf({ formKey: 'customMessage', x: 538, y: 1028, fontSize: 26, color: '#2D2928', lineHeight: 34, maxWidth: 990, wrapAfterChars: 34, maxLines: 5 }),
      bf({ text: 'We can’t wait to celebrate\nthis beautiful new beginning\nwith you!', x: 539, y: 1256, fontSize: 26, color: '#2F2A28', lineHeight: 34, maxWidth: 990 }),
    ]),
  },
  {
    id: 'baby-c11', eventType: 'babyshower', name: 'Under the Sea', style: 'Ocean & Calm',
    previewImage: '/templates/baby shower/concepts/11-preview.jpg',
    realImage: '/templates/baby shower/concepts/11-blank.jpg',
    accent: '#6E92BE',
    layout: sizedLayout(1054, 1492, [
      bf({ formKey: 'eventDate', format: 'ordinalDateThenWeekday', x: 392, y: 953, fontSize: 27, color: '#4C4B48', lineHeight: 32, maxWidth: 990, fitChars: 18 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' Onwards', x: 392, y: 1015, fontSize: 26, color: '#4E4D4A', maxWidth: 990 }),
      bf({ formKey: 'venue', x: 663, y: 951, fontSize: 24, color: '#53524F', lineHeight: 31, maxWidth: 990, wrapAfterChars: 20, maxLines: 5 }),
      bf({ formKey: 'customMessage', x: 526, y: 1140, fontSize: 27, color: '#4B4A47', lineHeight: 35, maxWidth: 990, wrapAfterChars: 34, maxLines: 5 }),
    ]),
  },
  {
    id: 'baby-c12', eventType: 'babyshower', name: 'First Glimpse', style: 'Botanical & Keepsake',
    previewImage: '/templates/baby shower/concepts/12-preview.jpg',
    realImage: '/templates/baby shower/concepts/12-blank.jpg',
    accent: '#8C9377',
    layout: sizedLayout(1054, 1492, [
      bf({ formKey: 'eventDate', format: 'weekdayThenDayMonthUpper', x: 368, y: 1096, fontSize: 19, letterSpacing: 1.8, color: '#52504A', lineHeight: 28, maxWidth: 990, fitChars: 26 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 373, y: 1154, fontSize: 19, letterSpacing: 1.8, color: '#514F49', maxWidth: 990, textTransform: 'uppercase' }),
      bf({ formKey: 'venue', x: 698, y: 1096, fontSize: 19, letterSpacing: 1.8, color: '#55514C', lineHeight: 28, maxWidth: 990, wrapAfterChars: 20, maxLines: 5, textTransform: 'uppercase' }),
      bf({ formKey: 'customMessage', x: 526, y: 1251, fontSize: 23, color: '#4E4B45', lineHeight: 30, maxWidth: 990, wrapAfterChars: 34, maxLines: 5 }),
    ]),
  },
  {
    id: 'baby-c13', eventType: 'babyshower', name: 'Golden Cradle', style: 'Elegant & Traditional',
    previewImage: '/templates/baby shower/concepts/13-preview.jpg',
    realImage: '/templates/baby shower/concepts/13-blank.jpg',
    accent: '#C9A86B',
    layout: sizedLayout(1054, 1492, [
      bf({ formKey: 'eventDate', format: 'weekdayThenDayMonthUpper', x: 890, y: 717, fontSize: 22, letterSpacing: 1.8, color: '#544137', lineHeight: 32, maxWidth: 990, fitChars: 24 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 889, y: 783, fontSize: 21, letterSpacing: 1.8, color: '#4C3A2E', maxWidth: 990, textTransform: 'uppercase' }),
      bf({ formKey: 'venue', x: 889, y: 992, fontSize: 20, letterSpacing: 1.8, color: '#5B4B3F', lineHeight: 32, maxWidth: 990, wrapAfterChars: 20, maxLines: 8, textTransform: 'uppercase' }),
      bf({ formKey: 'customMessage', x: 523, y: 1317, fontSize: 20, letterSpacing: 1.8, color: '#5B493F', lineHeight: 32, maxWidth: 990, wrapAfterChars: 30, maxLines: 4, textTransform: 'uppercase' }),
    ]),
  },

  // ── Original stock baby-shower flats (7) ────────────────────────────────
  { id: 'baby-1', eventType: 'babyshower', name: 'Soft Clouds',   style: 'Dreamy & Pastel',    previewImage: '/templates/baby shower/1.jpg', accent: '#b5d8eb', layout: flatLayout({ naturalWidth: 736, naturalHeight: 1308, eventType: 'babyshower', accent: '#5b86a6' }) },
  { id: 'baby-2', eventType: 'babyshower', name: 'Little Safari', style: 'Playful & Fun',       previewImage: '/templates/baby shower/2.jpg', accent: '#f0c987', layout: flatLayout({ naturalWidth: 736, naturalHeight: 1308, eventType: 'babyshower', accent: '#6b7da0' }) },
  { id: 'baby-3', eventType: 'babyshower', name: 'Bloom & Grow',  style: 'Floral & Soft',       previewImage: '/templates/baby shower/3.jpg', accent: '#e8b4b8', layout: flatLayout({ naturalWidth: 675, naturalHeight: 1200, eventType: 'babyshower', accent: '#b5727a' }) },
  { id: 'baby-4', eventType: 'babyshower', name: 'Storybook',     style: 'Whimsical & Sweet',   previewImage: '/templates/baby shower/4.jpg', accent: '#d4c5a9', layout: flatLayout({ naturalWidth: 675, naturalHeight: 1200, eventType: 'babyshower', accent: '#8a6d4a' }) },
  { id: 'baby-5', eventType: 'babyshower', name: 'Starlight',     style: 'Celestial & Soft',    previewImage: '/templates/baby shower/5.jpg', accent: '#b5c7e3', layout: flatLayout({ naturalWidth: 675, naturalHeight: 1200, eventType: 'babyshower', accent: '#5e76a3' }) },
  { id: 'baby-6', eventType: 'babyshower', name: 'Garden Baby',   style: 'Fresh & Natural',     previewImage: '/templates/baby shower/6.jpg', accent: '#a8d5ba', layout: flatLayout({ naturalWidth: 736, naturalHeight: 1308, eventType: 'babyshower', accent: '#b06b86' }) },
  { id: 'baby-7', eventType: 'babyshower', name: 'Classic Charm', style: 'Timeless & Elegant',  previewImage: '/templates/baby shower/7.jpg', accent: '#c4b5a0', layout: flatLayout({ naturalWidth: 675, naturalHeight: 1200, eventType: 'babyshower', accent: '#7d6b52' }) },

  // ── Pre-Wedding Party / Bride to Be (19 templates) ─────────────────────
  // previewImage → carousel thumbnail. realImage → full-res background for the renderer.
  // naturalWidth/Height match each image's actual pixel dimensions (no cropping).
  // timezone sits on the same line as eventTime; maxWidth on time keeps them from overlapping.
  {
    id: 'pw-c1', eventType: 'bridetobe', name: 'Champagne Tower', style: 'Glam & Gold',
    previewImage: '/templates/pre wedding/concepts/1-preview.jpg',
    realImage: '/templates/pre wedding/concepts/1-blank.jpg',
    accent: '#836832',
    // Monogram initials (top) + stacked "Bride / & / Groom" names (stacked
    // rather than the source's inline layout, so long names can't collide —
    // an inline single-line pair only works for short placeholder names) +
    // a 3-part "MON | DAY | YEAR" date stamp (day rendered large, baked
    // vertical bars either side) — all four eventDate pieces below share
    // the formKey 'eventDate' so dragging one in the editor moves the whole
    // stamp together, matching the pw-h1 precedent.
    layout: babyLayout([
      bf({ formKey: 'brideName', format: 'firstLetterUpper', x: 1050, y: 389, fontSize: 280, fontFamily: CG, fontWeight: '500', color: '#836832', maxWidth: 400 }),
      bf({ formKey: 'groomName', format: 'firstLetterUpper', x: 1430, y: 390, fontSize: 280, fontFamily: CG, fontWeight: '500', color: '#836832', maxWidth: 400 }),
      bf({ formKey: 'brideName', x: 1231, y: 1880, fontSize: 74, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#836832', textTransform: 'uppercase', maxWidth: 1700 }),
      bf({ text: '&', x: 1231, y: 1962, fontSize: 44, fontFamily: CG, fontWeight: '500', color: '#836832' }),
      bf({ formKey: 'groomName', x: 1231, y: 2030, fontSize: 74, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#836832', textTransform: 'uppercase', maxWidth: 1700 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1231, y: 2130, fontSize: 28, fontFamily: MS, fontWeight: '500', letterSpacing: 5, color: '#0B0907', maxWidth: 700, fitChars: 66 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 948, y: 2234, fontSize: 36, fontFamily: MS, letterSpacing: 3, color: '#0B0907', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1264, y: 2181, fontSize: 140, fontFamily: CG, fontWeight: '500', color: '#836832', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1511, y: 2234, fontSize: 36, fontFamily: MS, letterSpacing: 3, color: '#0B0907', maxWidth: 300 }),
      // Time sits in the gap under the date stamp, above the baked divider
      // at y2475; venue sits under the baked location pin (ends y2590) and
      // has to clear the next divider at y2780.
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1231, y: 2390, fontSize: 32, fontFamily: MS, letterSpacing: 3, color: '#0B0907', textTransform: 'uppercase', maxWidth: 700 }),
      bf({ formKey: 'venue', x: 1230, y: 2625, fontSize: 40, fontFamily: MS, letterSpacing: 2, color: '#0B0907', lineHeight: 62, wrapAfterChars: 28, maxWidth: 1300, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'pw-c2', eventType: 'bridetobe', name: 'Toast & New Beginnings', style: 'Editorial & Sage',
    previewImage: '/templates/pre wedding/concepts/2-preview.jpg',
    realImage: '/templates/pre wedding/concepts/2-blank.jpg',
    accent: '#1D1E11',
    // Stacked "BRIDE / and / GROOM" names, then a "SATURDAY | 22 | AT 6PM"
    // date stamp (big sage day number) with "MONTH YEAR" below it.
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 1240, y: 1815, fontSize: 72, fontFamily: CG, fontWeight: '500', letterSpacing: 5, color: '#1D1E11', textTransform: 'uppercase', maxWidth: 1600 }),
      bf({ formKey: 'groomName', x: 1240, y: 1975, fontSize: 72, fontFamily: CG, fontWeight: '500', letterSpacing: 5, color: '#1D1E11', textTransform: 'uppercase', maxWidth: 1600 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 800, y: 2371, fontSize: 27, fontFamily: MS, letterSpacing: 3, color: '#1D1E11', maxWidth: 400, fitChars: 21 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1248, y: 2300, fontSize: 130, fontFamily: CG, color: '#979781', maxWidth: 400 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 1580, y: 2436, fontSize: 23, fontFamily: MS, letterSpacing: 2, color: '#1D1E11', textTransform: 'uppercase', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'monthYearUpper', x: 1248, y: 2470, fontSize: 27, fontFamily: MS, letterSpacing: 3, color: '#1D1E11', maxWidth: 700, fitChars: 15 }),
      bf({ formKey: 'venue', x: 1230, y: 2650, fontSize: 32, fontFamily: MS, letterSpacing: 1.5, color: '#1D1E11', lineHeight: 58, wrapAfterChars: 22, maxWidth: 1300, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'pw-c3', eventType: 'bridetobe', name: 'Velvet Lounge', style: 'Moody & Neon Pink',
    previewImage: '/templates/pre wedding/concepts/3-preview.jpg',
    realImage: '/templates/pre wedding/concepts/3-blank.jpg',
    accent: '#EE9AA8',
    // Same monogram + "MON | DAY | YEAR" stamp structure as pw-c1, restyled
    // for the dark neon-lounge palette. Names are stacked, not inline — see
    // pw-c1's comment for why.
    layout: babyLayout([
      // Initials straddle the baked vertical bar (centred x1222) at the
      // height of its shaft — the revised artwork moved this ornament.
      bf({ formKey: 'brideName', format: 'firstLetterUpper', x: 1080, y: 285, fontSize: 155, fontFamily: CG, fontWeight: '500', color: '#EE9AA8', maxWidth: 400 }),
      bf({ formKey: 'groomName', format: 'firstLetterUpper', x: 1364, y: 285, fontSize: 155, fontFamily: CG, fontWeight: '500', color: '#EE9AA8', maxWidth: 400 }),
      bf({ formKey: 'brideName', x: 1230, y: 1560, fontSize: 64, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#EE9AA8', textTransform: 'uppercase', maxWidth: 1700 }),
      bf({ text: '&', x: 1230, y: 1636, fontSize: 38, fontFamily: CG, fontWeight: '500', color: '#EE9AA8' }),
      bf({ formKey: 'groomName', x: 1230, y: 1694, fontSize: 64, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#EE9AA8', textTransform: 'uppercase', maxWidth: 1700 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1195, y: 1840, fontSize: 24, fontFamily: MS, letterSpacing: 4, color: '#DBD3D5', maxWidth: 700, fitChars: 10 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 935, y: 1945, fontSize: 28, fontFamily: MS, letterSpacing: 2, color: '#DBD3D5', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1230, y: 1900, fontSize: 118, fontFamily: CG, fontWeight: '500', color: '#EE9AA8', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1475, y: 1945, fontSize: 28, fontFamily: MS, letterSpacing: 2, color: '#DBD3D5', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1195, y: 2050, fontSize: 26, fontFamily: MS, letterSpacing: 2, color: '#DBD3D5', textTransform: 'uppercase', maxWidth: 700 }),
      bf({ formKey: 'venue', x: 1230, y: 2180, fontSize: 40, fontFamily: MS, letterSpacing: 2, color: '#EAA2B4', lineHeight: 60, wrapAfterChars: 28, maxWidth: 1300, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'pw-c4', eventType: 'bridetobe', name: 'Confetti & Copper', style: 'Playful & Rose Gold',
    previewImage: '/templates/pre wedding/concepts/4-preview.jpg',
    realImage: '/templates/pre wedding/concepts/4-blank.jpg',
    accent: '#2D0C04',
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 1366, y: 1650, fontSize: 62, fontFamily: CG, fontWeight: '500', letterSpacing: 6, color: '#040201', textTransform: 'uppercase', maxWidth: 1300 }),
      bf({ formKey: 'groomName', x: 1250, y: 1855, fontSize: 62, fontFamily: CG, fontWeight: '500', letterSpacing: 6, color: '#040201', textTransform: 'uppercase', maxWidth: 1300 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 943, y: 1995, fontSize: 27, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#040201', maxWidth: 500, fitChars: 112 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1211, y: 1985, fontSize: 145, fontFamily: CG, fontWeight: '500', color: '#2D0C04', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 1564, y: 1995, fontSize: 27, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#040201', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1564, y: 2075, fontSize: 27, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#040201', maxWidth: 400 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', x: 1246, y: 2288, fontSize: 27, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#040201', textTransform: 'uppercase', maxWidth: 700 }),
      bf({ formKey: 'venue', x: 1210, y: 2455, fontSize: 40, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#2D0C04', lineHeight: 80, wrapAfterChars: 18, maxWidth: 900, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'pw-c5', eventType: 'bridetobe', name: 'Midnight Glamour', style: 'Club & Gold',
    previewImage: '/templates/pre wedding/concepts/5-preview.jpg',
    realImage: '/templates/pre wedding/concepts/5-blank.jpg',
    accent: '#E3B26D',
    // Names are stacked, not inline — see pw-c1's comment for why.
    layout: babyLayout([
      // Initials straddle the baked crown-and-bar ornament (centred x1245,
      // shaft y500-750) — the revised artwork moved it.
      bf({ formKey: 'brideName', format: 'firstLetterUpper', x: 1095, y: 500, fontSize: 165, fontFamily: CG, fontWeight: '500', color: '#E3B26D', maxWidth: 400 }),
      bf({ formKey: 'groomName', format: 'firstLetterUpper', x: 1395, y: 500, fontSize: 165, fontFamily: CG, fontWeight: '500', color: '#E3B26D', maxWidth: 400 }),
      bf({ formKey: 'brideName', x: 1231, y: 1770, fontSize: 68, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#E3B26D', textTransform: 'uppercase', maxWidth: 1700 }),
      bf({ text: '&', x: 1231, y: 1850, fontSize: 40, fontFamily: CG, fontWeight: '500', color: '#E3B26D' }),
      bf({ formKey: 'groomName', x: 1231, y: 1912, fontSize: 68, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#E3B26D', textTransform: 'uppercase', maxWidth: 1700 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1239, y: 2060, fontSize: 24, fontFamily: MS, letterSpacing: 4, color: '#EEEEEE', maxWidth: 700, fitChars: 85 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 1008, y: 2165, fontSize: 28, fontFamily: MS, letterSpacing: 2, color: '#EEEEEE', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1244, y: 2120, fontSize: 115, fontFamily: CG, fontWeight: '500', color: '#E3B26D', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1494, y: 2165, fontSize: 28, fontFamily: MS, letterSpacing: 2, color: '#EEEEEE', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1239, y: 2270, fontSize: 26, fontFamily: MS, letterSpacing: 2, color: '#EEEEEE', textTransform: 'uppercase', maxWidth: 700 }),
      bf({ formKey: 'venue', x: 1227, y: 2400, fontSize: 40, fontFamily: MS, letterSpacing: 2, color: '#E3B26D', lineHeight: 62, wrapAfterChars: 28, maxWidth: 1300, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'pw-c6', eventType: 'bridetobe', name: 'Beer Toast', style: 'Watercolor & Warm',
    previewImage: '/templates/pre wedding/concepts/6-preview.jpg',
    realImage: '/templates/pre wedding/concepts/6-blank.jpg',
    accent: '#A87F46',
    // Left-aligned (not centered) — script names, then the usual date
    // stamp, then venue. No monogram on this one. Names grow outward AWAY
    // from the baked "and" between them (bride right-aligned ending just
    // before it, groom left-aligned starting just after) so longer names
    // can't collide with it or each other.
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 780, y: 2092, align: 'right', fontSize: 80, fontFamily: GV, color: '#161411', maxWidth: 700 }),
      bf({ formKey: 'groomName', x: 940, y: 2092, align: 'left', fontSize: 80, fontFamily: GV, color: '#161411', maxWidth: 700 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 436, y: 2378, align: 'left', fontSize: 27, fontFamily: MS, letterSpacing: 3, color: '#161411', maxWidth: 400, fitChars: 12 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 854, y: 2355, align: 'center', fontSize: 110, fontFamily: CG, fontWeight: '500', color: '#A87F46', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'monthYearUpper', x: 1024, y: 2378, align: 'left', fontSize: 27, fontFamily: MS, letterSpacing: 3, color: '#161411', maxWidth: 500, fitChars: 29 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', x: 709, y: 2500, fontSize: 27, fontFamily: MS, letterSpacing: 3, color: '#161411', textTransform: 'uppercase', maxWidth: 600 }),
      bf({ formKey: 'venue', x: 576, y: 2686, align: 'left', fontSize: 36, fontFamily: MS, letterSpacing: 2, color: '#A87F46', lineHeight: 60, wrapAfterChars: 22, maxWidth: 1300, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'pw-c7', eventType: 'bridetobe', name: 'Toast to Forever', style: 'Navy & Gold',
    previewImage: '/templates/pre wedding/concepts/7-preview.jpg',
    realImage: '/templates/pre wedding/concepts/7-blank.jpg',
    accent: '#E3A93F',
    // Names grow outward away from the baked "and" between them (bride
    // right-aligned ending just before it, groom left-aligned starting
    // just after) so longer names can't collide with it or each other.
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 1140, y: 1998, align: 'right', fontSize: 80, fontFamily: GV, color: '#EFF1F2', maxWidth: 900 }),
      bf({ formKey: 'groomName', x: 1300, y: 1998, align: 'left', fontSize: 80, fontFamily: GV, color: '#EFF1F2', maxWidth: 900 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 814, y: 2320, fontSize: 27, fontFamily: MS, letterSpacing: 3, color: '#EFF1F2', maxWidth: 400, fitChars: 17 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1127, y: 2255, fontSize: 130, fontFamily: CG, fontWeight: '500', color: '#E3A93F', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'monthYearUpper', x: 1524, y: 2320, fontSize: 27, fontFamily: MS, letterSpacing: 3, color: '#EFF1F2', maxWidth: 500, fitChars: 16 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', x: 1173, y: 2500, align: 'center', fontSize: 28, fontFamily: MS, letterSpacing: 2, color: '#EFF1F2', textTransform: 'uppercase', maxWidth: 700 }),
      bf({ formKey: 'venue', x: 1258, y: 2649, fontSize: 40, fontFamily: MS, letterSpacing: 2, color: '#E3A93F', lineHeight: 80, wrapAfterChars: 18, maxWidth: 1300, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'pw-c8', eventType: 'bridetobe', name: 'Sunset Beach', style: 'Destination & Warm',
    previewImage: '/templates/pre wedding/concepts/8-preview.jpg',
    realImage: '/templates/pre wedding/concepts/8-blank.jpg',
    accent: '#A15B3D',
    // This concept has no explicit time shown, and closes with an RSVP
    // contact line instead of a dress code.
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 1226, y: 1374, fontSize: 80, fontFamily: CG, fontWeight: '500', letterSpacing: 4, color: '#431901', textTransform: 'uppercase', maxWidth: 1300 }),
      bf({ formKey: 'groomName', x: 1238, y: 1600, fontSize: 80, fontFamily: CG, fontWeight: '500', letterSpacing: 4, color: '#431901', textTransform: 'uppercase', maxWidth: 1300 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 900, y: 2000, fontSize: 26, fontFamily: MS, letterSpacing: 3, color: '#431901', maxWidth: 400, fitChars: 32 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1240, y: 1960, fontSize: 100, fontFamily: CG, fontWeight: '500', color: '#A15B3D', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'monthYearUpper', x: 1580, y: 2000, fontSize: 26, fontFamily: MS, letterSpacing: 3, color: '#431901', maxWidth: 400, fitChars: 24 }),
      bf({ formKey: 'venue', x: 1233, y: 2373, fontSize: 40, fontFamily: GV, color: '#A15B3D', lineHeight: 60, wrapAfterChars: 24, maxWidth: 1300 }),
      bf({ text: 'RSVP', x: 1233, y: 2660, fontSize: 26, fontFamily: MS, fontWeight: '500', letterSpacing: 3, color: '#4B270D', maxWidth: 500 }),
      bf({ formKey: 'rsvpName', x: 1233, y: 2722, fontSize: 30, fontFamily: MS, letterSpacing: 1, color: '#4B270D', maxWidth: 1400, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'pw-c9', eventType: 'bridetobe', name: 'Before Forever', style: 'Floral & Gold Foil',
    previewImage: '/templates/pre wedding/concepts/9-preview.jpg',
    realImage: '/templates/pre wedding/concepts/9-blank.jpg',
    accent: '#917235',
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 1280, y: 1930, fontSize: 52, fontFamily: CG, fontWeight: '500', letterSpacing: 5, color: '#25211A', textTransform: 'uppercase', maxWidth: 1300 }),
      bf({ formKey: 'groomName', x: 1280, y: 2160, fontSize: 52, fontFamily: CG, fontWeight: '500', letterSpacing: 5, color: '#25211A', textTransform: 'uppercase', maxWidth: 1300 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 944, y: 2225, fontSize: 26, fontFamily: MS, letterSpacing: 3, color: '#25211A', maxWidth: 400, fitChars: 30 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1246, y: 2210, fontSize: 95, fontFamily: CG, fontWeight: '500', color: '#917235', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', x: 1596, y: 2225, fontSize: 26, fontFamily: MS, letterSpacing: 2, color: '#25211A', textTransform: 'uppercase', maxWidth: 500 }),
      bf({ formKey: 'eventDate', format: 'monthYearUpper', x: 1241, y: 2580, fontSize: 27, fontFamily: MS, letterSpacing: 3, color: '#25211A', maxWidth: 700, fitChars: 75 }),
      bf({ formKey: 'venue', x: 1230, y: 2760, fontSize: 42, fontFamily: GV, color: '#917235', lineHeight: 60, wrapAfterChars: 24, maxWidth: 1300 }),
    ]),
  },
  {
    id: 'pw-c10', eventType: 'bridetobe', name: 'Golden Hour Palms', style: 'Warm & Burgundy',
    previewImage: '/templates/pre wedding/concepts/10-preview.jpg',
    realImage: '/templates/pre wedding/concepts/10-blank.jpg',
    accent: '#31030B',
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 1236, y: 1848, fontSize: 58, fontFamily: CG, fontWeight: '500', letterSpacing: 5, color: '#060201', textTransform: 'uppercase', maxWidth: 1300 }),
      bf({ formKey: 'groomName', x: 1236, y: 1992, fontSize: 58, fontFamily: CG, fontWeight: '500', letterSpacing: 5, color: '#060201', textTransform: 'uppercase', maxWidth: 1300 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 936, y: 2192, fontSize: 26, fontFamily: MS, letterSpacing: 3, color: '#31030B', maxWidth: 400, fitChars: 12 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1246, y: 2128, fontSize: 105, fontFamily: CG, fontWeight: '500', color: '#31030B', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 1548, y: 2184, fontSize: 26, fontFamily: MS, letterSpacing: 2, color: '#31030B', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1548, y: 2232, fontSize: 26, fontFamily: MS, letterSpacing: 2, color: '#31030B', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', x: 1236, y: 2352, fontSize: 26, fontFamily: MS, letterSpacing: 2, color: '#31030B', textTransform: 'uppercase', maxWidth: 700 }),
      bf({ formKey: 'venue', x: 1232, y: 2582, fontSize: 38, fontFamily: MS, letterSpacing: 2, color: '#7A1B2E', lineHeight: 62, wrapAfterChars: 20, maxWidth: 1200, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'pw-c11', eventType: 'bridetobe', name: 'Sunset Beach Bonfire', style: 'Tropical & Amber',
    previewImage: '/templates/pre wedding/concepts/11-preview.jpg',
    realImage: '/templates/pre wedding/concepts/11-blank.jpg',
    accent: '#FFD38F',
    // Names are stacked, not inline — see pw-c1's comment for why.
    layout: babyLayout([
      bf({ formKey: 'brideName', format: 'firstLetterUpper', x: 1116, y: 320, fontSize: 160, fontFamily: CG, fontWeight: '500', color: '#FFD38F', maxWidth: 350 }),
      bf({ formKey: 'groomName', format: 'firstLetterUpper', x: 1330, y: 320, fontSize: 160, fontFamily: CG, fontWeight: '500', color: '#FFD38F', maxWidth: 350 }),
      bf({ formKey: 'brideName', x: 1164, y: 1810, fontSize: 60, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#FFD38F', textTransform: 'uppercase', maxWidth: 1700 }),
      bf({ text: '&', x: 1164, y: 1882, fontSize: 36, fontFamily: CG, fontWeight: '500', color: '#FFD38F' }),
      bf({ formKey: 'groomName', x: 1164, y: 1938, fontSize: 60, fontFamily: CG, fontWeight: '500', letterSpacing: 3, color: '#FFD38F', textTransform: 'uppercase', maxWidth: 1700 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 813, y: 2119, fontSize: 25, fontFamily: MS, letterSpacing: 3, color: '#FFD38F', maxWidth: 400, fitChars: 15 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 1080, y: 2130, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#FFD38F', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1330, y: 2095, fontSize: 105, fontFamily: CG, fontWeight: '500', color: '#FFD38F', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1620, y: 2130, fontSize: 32, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#FFD38F', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', suffix: ' ONWARDS', x: 1164, y: 2280, fontSize: 28, fontFamily: MS, letterSpacing: 2, color: '#FFEBD1', textTransform: 'uppercase', maxWidth: 700 }),
      bf({ formKey: 'venue', x: 1164, y: 2394, fontSize: 38, fontFamily: CG, fontWeight: '500', letterSpacing: 2, color: '#FFD38F', lineHeight: 58, wrapAfterChars: 26, maxWidth: 1300, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'pw-c12', eventType: 'bridetobe', name: 'Ribbon & Olive', style: 'Minimal & Sage',
    previewImage: '/templates/pre wedding/concepts/12-preview.jpg',
    realImage: '/templates/pre wedding/concepts/12-blank.jpg',
    accent: '#705F3A',
    layout: babyLayout([
      bf({ formKey: 'brideName', x: 1220, y: 1508, fontSize: 48, fontFamily: CG, fontWeight: '500', letterSpacing: 5, color: '#191F14', textTransform: 'uppercase', maxWidth: 1300 }),
      bf({ formKey: 'groomName', x: 1220, y: 1712, fontSize: 48, fontFamily: CG, fontWeight: '500', letterSpacing: 5, color: '#191F14', textTransform: 'uppercase', maxWidth: 1300 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 922, y: 1900, fontSize: 25, fontFamily: MS, letterSpacing: 3, color: '#191F14', maxWidth: 400, fitChars: 13 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1206, y: 1845, fontSize: 90, fontFamily: CG, fontWeight: '500', color: '#705F3A', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', x: 1592, y: 1900, fontSize: 25, fontFamily: MS, letterSpacing: 2, color: '#191F14', textTransform: 'uppercase', maxWidth: 500 }),
      bf({ formKey: 'eventDate', format: 'monthYearUpper', x: 1214, y: 2036, fontSize: 26, fontFamily: MS, letterSpacing: 3, color: '#191F14', maxWidth: 700, fitChars: 65 }),
      bf({ formKey: 'venue', x: 1252, y: 2340, fontSize: 38, fontFamily: GV, color: '#5A5A4A', lineHeight: 58, wrapAfterChars: 24, maxWidth: 1300 }),
    ]),
  },
  {
    // ═══════════════════════════════════════════════════════════════════════
    // "Champagne Toast" — FIRST in the Pre-Wedding section.
    // EDIT PLACEMENTS HERE: the coordinate space is the real image's pixels
    // (900 × 1600). Every x / y / fontSize / letterSpacing below is in THAT
    // space — nudge them to reposition. Sizes were scaled up (~1.7×) from your
    // design spec so they fit the 1600px-tall canvas; tune to taste.
    // Fonts: Montserrat + Cormorant Garamond already load; Bodoni Moda added to
    // index.html. "Brittany Signature" is a paid font — until you drop the
    // .otf into public/fonts and add an @font-face for it, that line falls back
    // to a serif.
    // Dynamic (from the event form): both names (brideName / groomName — this
    // template overrides the pre-wedding form to collect both, via
    // TEMPLATE_FIELD_OVERRIDES in eventFields.ts), weekday / day / month-year
    // (eventDate), time (eventTime), and venue. Static text: AT and the two
    // address lines (the form has no address field yet).
    // ═══════════════════════════════════════════════════════════════════════
    id: 'pw-h1',
    eventType: 'bridetobe',
    name: 'Champagne Toast',
    style: 'Modern & Gold',
    previewImage: '/templates/pre wedding/h1preview.png',
    realImage: '/templates/pre wedding/h1real.jpeg',
    accent: '#C6A867',
    layout: {
      naturalWidth: 900,
      naturalHeight: 1600,
      fields: [
        // AISHWARYA — Cormorant Garamond Medium · CAPS · wide tracking  (→ bride's name)
        { formKey: 'brideName', x: 450, y: 840, fontFamily: 'Cormorant Garamond', fontWeight: '500', fontSize: 45, letterSpacing: 12, color: '#3a352d', align: 'center', maxWidth: 780, textTransform: 'uppercase' },
        // NIKHIL — Cormorant Garamond Medium · CAPS · wide tracking  (→ groom's name)
        { formKey: 'groomName', x: 450, y: 930, fontFamily: 'Cormorant Garamond', fontWeight: '500', fontSize: 45, letterSpacing: 12, color: '#3a352d', align: 'center', maxWidth: 780, textTransform: 'uppercase' },
        // SATURDAY — Montserrat Medium · CAPS · +tracking  (→ eventDate weekday)
        { formKey: 'eventDate', format: 'weekdayUpper', x: 280, y: 1150, fontFamily: 'Montserrat', fontWeight: '500', fontSize: 25, letterSpacing: 6, color: '#3a352d', align: 'center' },
        // 22 — Bodoni Moda Regular (the big day number)  (→ eventDate day)
        { formKey: 'eventDate', format: 'dayOfMonth', x: 455, y: 1060, fontFamily: 'Bodoni Moda', fontWeight: '400', fontSize: 80, color: '#3a352d', align: 'center' },
        // AT — Montserrat Medium · CAPS  (static connector)
        { text: 'AT', x: 610, y: 1150, fontFamily: 'Montserrat', fontWeight: '500', fontSize: 25, letterSpacing: 3.4, color: '#3a352d', align: 'center' },
        // 6:00 PM — Montserrat Medium · CAPS  (→ eventTime)
        { formKey: 'eventTime', format: 'time12', x: 610, y: 1195, fontFamily: 'Montserrat', fontWeight: '500', fontSize: 25, letterSpacing: 3.4, color: '#3a352d', align: 'center', textTransform: 'uppercase' },
        // MARCH 2026 — Montserrat Medium · CAPS · +tracking  (→ eventDate month + year)
        { formKey: 'eventDate', format: 'monthYearUpper', x: 430, y: 1220, fontFamily: 'Montserrat', fontWeight: '500', fontSize: 25, letterSpacing: 6, color: '#3a352d', align: 'center' },
        // Venue / address — the WHOLE venue the host types, wrapped onto as
        // many lines as needed (each ≤ wrapAfterChars characters). The lines
        // flow down from this y using lineHeight. Tune wrapAfterChars for how
        // many characters per line, and lineHeight for the gap between lines.
        { formKey: 'venue', x: 450, y: 1285, fontFamily: 'Montserrat', fontWeight: '400', fontSize: 26, letterSpacing: 4.3, color: '#3a352d', align: 'center', maxWidth: 780, lineHeight: 42, wrapAfterChars: 18 },
      ],
    },
  },
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

  // ── Housewarming concept cards (hw-c1 … hw-c10) ─────────────────────────
  // Same measurement approach as the other concept-card batches: positions
  // measured directly off each {n}-blank.jpg's own baked guide marks
  // (labels, divider lines, date-box outlines). Most concepts print a
  // single "Homeowner(s)" signature line near the bottom; some print an
  // address block too. hw-c9's own artwork is a literal field-label legend
  // (icon + "HOMEOWNER(S)" / "HOST NAME(S)" / "DATE & TIME" / "APPROXIMATE
  // GUEST COUNT" / "VENUE / LOCATION" / "A WARM NOTE") which is what
  // confirmed the field set this whole batch collects.
  {
    id: 'hw-c1', eventType: 'housewarming', name: 'Marigold Doorway', style: 'Warm & Traditional',
    previewImage: '/templates/housewarming/concepts/1-preview.jpg',
    realImage: '/templates/housewarming/concepts/1-blank.jpg',
    accent: '#DBC998',
    layout: babyLayout([
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1240, y: 2015, fontSize: 30, fontFamily: MS, letterSpacing: 4, color: '#DBC998', maxWidth: 900, fitChars: 43 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1240, y: 2065, fontSize: 110, fontFamily: CG, fontWeight: '600', color: '#F0E4BC', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'monthYearUpper', x: 1240, y: 2235, fontSize: 34, fontFamily: MS, letterSpacing: 3, color: '#DBC998', maxWidth: 700, fitChars: 29 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', x: 1240, y: 2385, fontSize: 34, fontFamily: MS, letterSpacing: 2, color: '#DBC998', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'homeownerName', x: 1240, y: 3340, fontSize: 54, fontFamily: GV, color: '#4A5A3A', maxWidth: 1500 }),
    ]),
  },
  {
    id: 'hw-c2', eventType: 'housewarming', name: 'Blush Watercolor Home', style: 'Soft & Romantic',
    previewImage: '/templates/housewarming/concepts/2-preview.jpg',
    realImage: '/templates/housewarming/concepts/2-blank.jpg',
    accent: '#D14D7A',
    layout: babyLayout([
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1675, y: 2050, fontSize: 28, fontFamily: MS, letterSpacing: 3, color: '#B8860B', maxWidth: 700, fitChars: 30 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1675, y: 2170, fontSize: 90, fontFamily: CG, fontWeight: '600', color: '#D14D7A', maxWidth: 400 }),
      bf({ formKey: 'eventDate', format: 'monthYearUpper', x: 1675, y: 2310, fontSize: 30, fontFamily: MS, letterSpacing: 2, color: '#B8860B', maxWidth: 600, fitChars: 41 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', x: 1675, y: 2430, fontSize: 28, fontFamily: MS, letterSpacing: 2, color: '#D14D7A', textTransform: 'uppercase', maxWidth: 700 }),
      bf({ formKey: 'customMessage', x: 1520, y: 2940, fontSize: 27, fontFamily: CG, fontStyle: 'italic', fontWeight: '500', color: '#6B4038', lineHeight: 42, wrapAfterChars: 24, maxWidth: 900 }),
      bf({ formKey: 'homeownerName', x: 1240, y: 3350, fontSize: 46, fontFamily: MS, fontWeight: '600', letterSpacing: 2, color: '#D14D7A', textTransform: 'uppercase', maxWidth: 1500 }),
    ]),
  },
  {
    id: 'hw-c3', eventType: 'housewarming', name: 'Blossom Lane Bells', style: 'Pink & Gold Icons',
    previewImage: '/templates/housewarming/concepts/3-preview.jpg',
    realImage: '/templates/housewarming/concepts/3-blank.jpg',
    accent: '#48572F',
    layout: babyLayout([
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1240, y: 1625, fontSize: 34, fontFamily: MS, fontWeight: '600', letterSpacing: 2, color: '#48572F', maxWidth: 900, fitChars: 65 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 1240, y: 1690, fontSize: 34, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#C2447A', maxWidth: 900, fitChars: 66 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', suffix: ' ONWARDS', x: 1240, y: 1750, fontSize: 28, fontFamily: MS, letterSpacing: 1, color: '#3A2E22', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2075, fontSize: 30, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#3A2E22', lineHeight: 42, wrapAfterChars: 30, maxWidth: 1700, textTransform: 'uppercase' }),
      bf({ formKey: 'homeownerName', x: 1240, y: 2565, fontSize: 46, fontFamily: GV, color: '#C2447A', maxWidth: 1500 }),
    ]),
  },
  // Narrow 3-column layout (Date | Venue | Blessings) — smaller fonts and
  // tight wrapAfterChars to stay inside each ~500px-wide column. The
  // "SUNDAY" caption is BAKED as the date column's literal label (not a
  // generic "DATE" label), so no dynamic weekday is rendered here — it
  // would either duplicate or contradict the fixed word.
  {
    id: 'hw-c4', eventType: 'housewarming', name: 'Sacred Cow Threshold', style: 'Blush & Traditional',
    previewImage: '/templates/housewarming/concepts/4-preview.jpg',
    realImage: '/templates/housewarming/concepts/4-blank.jpg',
    accent: '#4F5222',
    layout: babyLayout([
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 550, y: 1750, fontSize: 24, fontFamily: MS, fontWeight: '600', color: '#C2447A', maxWidth: 480, fitChars: 20 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', suffix: ' ONWARDS', x: 550, y: 1805, fontSize: 20, fontFamily: MS, color: '#3A2E22', textTransform: 'uppercase', lineHeight: 28, wrapAfterChars: 11, maxWidth: 480 }),
      bf({ formKey: 'venue', x: 1000, y: 1750, fontSize: 20, fontFamily: MS, fontWeight: '600', color: '#3A2E22', lineHeight: 28, wrapAfterChars: 15, maxWidth: 480, textTransform: 'uppercase' }),
      bf({ formKey: 'homeownerName', x: 1425, y: 1800, fontSize: 30, fontFamily: GV, color: '#C2447A', maxWidth: 500 }),
    ]),
  },
  {
    id: 'hw-c5', eventType: 'housewarming', name: 'Sage Watercolor Bloom', style: 'Soft & Botanical',
    previewImage: '/templates/housewarming/concepts/5-preview.jpg',
    realImage: '/templates/housewarming/concepts/5-blank.jpg',
    accent: '#364030',
    layout: babyLayout([
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1240, y: 1710, fontSize: 32, fontFamily: MS, fontWeight: '600', letterSpacing: 2, color: '#364030', maxWidth: 900, fitChars: 97 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 1240, y: 1790, fontSize: 40, fontFamily: CG, fontWeight: '600', color: '#B8860B', maxWidth: 900, fitChars: 122 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', suffix: ' ONWARDS', x: 1240, y: 1890, fontSize: 30, fontFamily: MS, letterSpacing: 1, color: '#3A3A2E', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ text: 'OUR NEW HOME', x: 1240, y: 2390, fontSize: 30, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#364030', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2460, fontSize: 28, fontFamily: MS, color: '#3A3A2E', lineHeight: 46, wrapAfterChars: 26, maxWidth: 1600, textTransform: 'uppercase' }),
      bf({ formKey: 'homeownerName', x: 1240, y: 3060, fontSize: 52, fontFamily: GV, color: '#B8860B', maxWidth: 1500 }),
    ]),
  },
  {
    id: 'hw-c6', eventType: 'housewarming', name: 'Golden Threshold Boxes', style: 'Olive & Gold',
    previewImage: '/templates/housewarming/concepts/6-preview.jpg',
    realImage: '/templates/housewarming/concepts/6-blank.jpg',
    accent: '#505333',
    layout: babyLayout([
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 875, y: 1955, fontSize: 32, fontFamily: MS, fontWeight: '600', letterSpacing: 2, color: '#505333', maxWidth: 400, fitChars: 15 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1225, y: 1930, fontSize: 80, fontFamily: CG, fontWeight: '600', color: '#B8860B', maxWidth: 350 }),
      bf({ formKey: 'eventDate', format: 'monthYearUpper', x: 1575, y: 1955, fontSize: 32, fontFamily: MS, fontWeight: '600', letterSpacing: 2, color: '#505333', maxWidth: 400, fitChars: 12 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', suffix: ' ONWARDS', x: 1240, y: 2170, fontSize: 34, fontFamily: MS, letterSpacing: 1, color: '#3A3A2E', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2460, fontSize: 36, fontFamily: MS, fontWeight: '600', color: '#3A3A2E', lineHeight: 60, wrapAfterChars: 26, maxWidth: 1600, textTransform: 'uppercase' }),
      bf({ formKey: 'homeownerName', x: 1240, y: 2930, fontSize: 76, fontFamily: GV, color: '#B8860B', maxWidth: 1500 }),
    ]),
  },
  {
    id: 'hw-c7', eventType: 'housewarming', name: 'Peacock & Terracotta', style: 'Earthy & Botanical',
    previewImage: '/templates/housewarming/concepts/7-preview.jpg',
    realImage: '/templates/housewarming/concepts/7-blank.jpg',
    accent: '#4A5A3A',
    layout: babyLayout([
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1240, y: 1835, fontSize: 32, fontFamily: MS, fontWeight: '600', letterSpacing: 3, color: '#3A3A2E', maxWidth: 900, fitChars: 60 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 1075, y: 2050, fontSize: 30, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#3A3A2E', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 1285, y: 2010, fontSize: 100, fontFamily: CG, fontWeight: '600', color: '#B46634', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1485, y: 2050, fontSize: 30, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#3A3A2E', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', suffix: ' ONWARDS', x: 1240, y: 2200, fontSize: 30, fontFamily: MS, letterSpacing: 1, color: '#3A3A2E', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2545, fontSize: 30, fontFamily: MS, fontWeight: '600', color: '#3A3A2E', lineHeight: 46, wrapAfterChars: 24, maxWidth: 1600, textTransform: 'uppercase' }),
      bf({ formKey: 'homeownerName', x: 1240, y: 2930, fontSize: 46, fontFamily: GV, color: '#B46634', maxWidth: 1500 }),
    ]),
  },
  {
    id: 'hw-c8', eventType: 'housewarming', name: 'Blue Willow Havan', style: 'Indigo & Gold',
    previewImage: '/templates/housewarming/concepts/8-preview.jpg',
    realImage: '/templates/housewarming/concepts/8-blank.jpg',
    accent: '#161F46',
    layout: babyLayout([
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1240, y: 1610, fontSize: 32, fontFamily: MS, fontWeight: '600', letterSpacing: 3, color: '#161F46', maxWidth: 900, fitChars: 94 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 540, y: 1705, fontSize: 30, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#161F46', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 880, y: 1665, fontSize: 110, fontFamily: CG, fontWeight: '600', color: '#161F46', maxWidth: 350 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1380, y: 1705, fontSize: 30, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#161F46', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', suffix: ' ONWARDS', x: 1240, y: 1880, fontSize: 30, fontFamily: MS, letterSpacing: 1, color: '#161F46', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2175, fontSize: 30, fontFamily: MS, fontWeight: '600', color: '#161F46', lineHeight: 46, wrapAfterChars: 26, maxWidth: 1600, textTransform: 'uppercase' }),
      bf({ formKey: 'homeownerName', x: 1240, y: 2520, fontSize: 44, fontFamily: GV, color: '#B8860B', maxWidth: 1500 }),
    ]),
  },
  // This concept's own artwork IS the field legend for the whole batch:
  // icon + "HOMEOWNER(S)" / "HOST NAME(S)" / "DATE & TIME" / "APPROXIMATE
  // GUEST COUNT" / "VENUE / LOCATION" / "A WARM NOTE", each left-aligned
  // under its own baked label. Collects both a homeowner AND a separate
  // host-name line (unlike the other concepts, which print only one).
  {
    id: 'hw-c9', eventType: 'housewarming', name: 'Gruhapravesam Arch', style: 'Indigo & Gold Legend',
    previewImage: '/templates/housewarming/concepts/9-preview.jpg',
    realImage: '/templates/housewarming/concepts/9-blank.jpg',
    accent: '#192643',
    layout: babyLayout([
      bf({ formKey: 'homeownerName', x: 1010, y: 1780, align: 'left', fontSize: 34, fontFamily: MS, color: '#192643', maxWidth: 1300 }),
      bf({ formKey: 'hostName', x: 1010, y: 1980, align: 'left', fontSize: 34, fontFamily: MS, color: '#192643', maxWidth: 1300 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 1010, y: 2180, align: 'left', fontSize: 34, fontFamily: MS, color: '#192643', maxWidth: 600, fitChars: 54 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: ' | ', x: 1460, y: 2180, align: 'left', fontSize: 34, fontFamily: MS, color: '#192643', maxWidth: 500 }),
      bf({ formKey: 'guestCount', x: 1010, y: 2425, align: 'left', fontSize: 34, fontFamily: MS, color: '#192643', maxWidth: 700 }),
      bf({ formKey: 'venue', x: 1010, y: 2620, align: 'left', fontSize: 32, fontFamily: MS, color: '#192643', lineHeight: 46, wrapAfterChars: 28, maxWidth: 1400 }),
      bf({ formKey: 'customMessage', x: 1240, y: 2980, fontSize: 28, fontFamily: CG, fontStyle: 'italic', fontWeight: '500', color: '#B8860B', lineHeight: 42, wrapAfterChars: 30, maxWidth: 1500 }),
    ]),
  },
  {
    id: 'hw-c10', eventType: 'housewarming', name: 'Lotus Courtyard Lounge', style: 'Sage & Terracotta',
    previewImage: '/templates/housewarming/concepts/10-preview.jpg',
    realImage: '/templates/housewarming/concepts/10-blank.jpg',
    accent: '#4F573D',
    layout: babyLayout([
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 1240, y: 1660, fontSize: 32, fontFamily: MS, fontWeight: '600', letterSpacing: 3, color: '#4F573D', maxWidth: 900, fitChars: 55 }),
      bf({ formKey: 'eventDate', format: 'monthAbbrUpper', x: 590, y: 1755, fontSize: 30, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#4F573D', maxWidth: 300 }),
      bf({ formKey: 'eventDate', format: 'dayOfMonth', x: 907, y: 1715, fontSize: 110, fontFamily: CG, fontWeight: '600', color: '#BD6436', maxWidth: 350 }),
      bf({ formKey: 'eventDate', format: 'yearOnly', x: 1210, y: 1755, fontSize: 30, fontFamily: MS, fontWeight: '600', letterSpacing: 1, color: '#4F573D', maxWidth: 300 }),
      bf({ formKey: 'eventTime', format: 'time12', prefix: 'AT ', suffix: ' ONWARDS', x: 1240, y: 1930, fontSize: 30, fontFamily: MS, letterSpacing: 1, color: '#4F573D', textTransform: 'uppercase', maxWidth: 900 }),
      bf({ formKey: 'venue', x: 1240, y: 2230, fontSize: 30, fontFamily: MS, fontWeight: '600', color: '#BD6436', lineHeight: 46, wrapAfterChars: 26, maxWidth: 1600, textTransform: 'uppercase' }),
      bf({ formKey: 'homeownerName', x: 1240, y: 2610, fontSize: 46, fontFamily: GV, color: '#BD6436', maxWidth: 1500 }),
    ]),
  },

  // ── Housewarming (2 templates, pre-existing) ────────────────────────────
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

  // -- Gender reveal concept cards (gr-c1 ... gr-c10) ---------------------
  // Positions measured by diffing each {n}-preview.jpg against its
  // {n}-blank.jpg. Every concept prints both celebrants' names (grown
  // outward from a static '&' so long names can't collide), a
  // DATE | TIME | VENUE row under baked icons, and most a closing note.
  //
  // Concept 3 is deliberately absent: its supplied "Without Info" file
  // still has the sample names printed on it, so it has no usable blank.
  {
    id: 'gr-c1', eventType: 'genderreveal', name: 'Midnight Confetti', style: 'Navy & Neon',
    previewImage: '/templates/gender reveal/concepts/1-preview.jpg',
    realImage: '/templates/gender reveal/concepts/1-blank.jpg',
    accent: '#D5C38D',
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'fatherName', x: 411, y: 1141, align: 'right', fontSize: 67, fontFamily: GV, color: '#E2CE97', maxWidth: 520 }),
      bf({ text: '&', x: 455, y: 1157, fontSize: 42, fontFamily: GV, color: '#D5C38D' }),
      bf({ formKey: 'motherName', x: 499, y: 1140, align: 'left', fontSize: 67, fontFamily: GV, color: '#E0CE96', maxWidth: 520 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 240, y: 1320, fontSize: 18, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#CCD2DE', maxWidth: 230, fitChars: 14 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 240, y: 1349, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#CCA5C9', maxWidth: 230, fitChars: 12 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 457, y: 1325, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#78C0DC', textTransform: 'uppercase', maxWidth: 200 }),
      bf({ formKey: 'venue', x: 682, y: 1319, fontSize: 21, fontFamily: MS, fontWeight: '500', color: '#C0A2C2', lineHeight: 25, wrapAfterChars: 20, maxWidth: 260, textTransform: 'uppercase' }),
      bf({ formKey: 'customMessage', x: 452, y: 1451, fontSize: 22, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#C7CDDD', lineHeight: 28, wrapAfterChars: 15, maxWidth: 420, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'gr-c2', eventType: 'genderreveal', name: 'Blush Arch Gift', style: 'Soft & Modern',
    previewImage: '/templates/gender reveal/concepts/2-preview.jpg',
    realImage: '/templates/gender reveal/concepts/2-blank.jpg',
    accent: '#2B2927',
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'fatherName', x: 433, y: 773, align: 'right', fontSize: 72, fontFamily: GV, color: '#2B2927', maxWidth: 520 }),
      bf({ text: '&', x: 477, y: 786, fontSize: 45, fontFamily: GV, color: '#2B2927' }),
      bf({ formKey: 'motherName', x: 521, y: 773, align: 'left', fontSize: 72, fontFamily: GV, color: '#2B2927', maxWidth: 520 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 265, y: 1334, fontSize: 17, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#494642', maxWidth: 230, fitChars: 14 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 267, y: 1360, fontSize: 20, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#B6878A', maxWidth: 230, fitChars: 11 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 461, y: 1342, fontSize: 20, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#66808C', textTransform: 'uppercase', maxWidth: 200 }),
      bf({ formKey: 'venue', x: 664, y: 1336, fontSize: 17, fontFamily: MS, fontWeight: '500', color: '#56534E', lineHeight: 22, wrapAfterChars: 20, maxWidth: 260, textTransform: 'uppercase' }),
      bf({ formKey: 'customMessage', x: 467, y: 1459, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#3D3B37', lineHeight: 30, wrapAfterChars: 18, maxWidth: 420, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'gr-c4', eventType: 'genderreveal', name: 'Balloon Letter', style: 'Botanical & Cream',
    previewImage: '/templates/gender reveal/concepts/4-preview.jpg',
    realImage: '/templates/gender reveal/concepts/4-blank.jpg',
    accent: '#866D4E',
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'fatherName', x: 670, y: 767, align: 'right', fontSize: 56, fontFamily: GV, color: '#7D6446', maxWidth: 520 }),
      bf({ text: '&', x: 698, y: 786, fontSize: 35, fontFamily: GV, color: '#866D4E' }),
      bf({ formKey: 'motherName', x: 725, y: 772, align: 'left', fontSize: 56, fontFamily: GV, color: '#866D4E', maxWidth: 520 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 691, y: 952, fontSize: 18, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#555046', maxWidth: 230, fitChars: 34 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 693, y: 979, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#B2817F', maxWidth: 230, fitChars: 24 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 693, y: 1143, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#7D8EA0', textTransform: 'uppercase', maxWidth: 200 }),
      // Sits ~25px above where the designer typeset it: their sample deleted
      // the short rule at y1345, but that rule IS baked into the blank we
      // render on, so a 3-line address has to clear it rather than cross it.
      bf({ formKey: 'venue', x: 691, y: 1251, fontSize: 19, fontFamily: MS, fontWeight: '500', color: '#B48785', lineHeight: 30, wrapAfterChars: 20, maxLines: 3, maxWidth: 260, textTransform: 'uppercase' }),
      bf({ formKey: 'customMessage', x: 471, y: 1444, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#5A4941', lineHeight: 25, wrapAfterChars: 18, maxWidth: 420, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'gr-c5', eventType: 'genderreveal', name: 'Question Envelope', style: 'Pink & Blue Pop',
    previewImage: '/templates/gender reveal/concepts/5-preview.jpg',
    realImage: '/templates/gender reveal/concepts/5-blank.jpg',
    accent: '#242F4B',
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'fatherName', x: 422, y: 718, align: 'right', fontSize: 79, fontFamily: GV, color: '#242F4B', maxWidth: 520 }),
      bf({ text: '&', x: 466, y: 732, fontSize: 49, fontFamily: GV, color: '#242F4B' }),
      bf({ formKey: 'motherName', x: 510, y: 718, align: 'left', fontSize: 79, fontFamily: GV, color: '#242F4B', maxWidth: 520 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 231, y: 1308, fontSize: 18, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#2A344C', maxWidth: 230, fitChars: 16 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 232, y: 1337, fontSize: 23, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#D78498', maxWidth: 230, fitChars: 12 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 468, y: 1337, fontSize: 22, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#527DA4', textTransform: 'uppercase', maxWidth: 200 }),
      bf({ formKey: 'venue', x: 710, y: 1307, fontSize: 19, fontFamily: MS, fontWeight: '500', color: '#323E52', lineHeight: 25, wrapAfterChars: 20, maxWidth: 260, textTransform: 'uppercase' }),
      bf({ formKey: 'customMessage', x: 469, y: 1464, fontSize: 22, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#2B374E', lineHeight: 28, wrapAfterChars: 18, maxWidth: 420, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'gr-c6', eventType: 'genderreveal', name: 'Little Onesie', style: 'Muted & Tender',
    previewImage: '/templates/gender reveal/concepts/6-preview.jpg',
    realImage: '/templates/gender reveal/concepts/6-blank.jpg',
    accent: '#32353C',
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'fatherName', x: 432, y: 1148, align: 'right', fontSize: 87, fontFamily: GV, color: '#32353C', maxWidth: 520 }),
      bf({ text: '&', x: 476, y: 1164, fontSize: 54, fontFamily: GV, color: '#32353C' }),
      bf({ formKey: 'motherName', x: 520, y: 1148, align: 'left', fontSize: 87, fontFamily: GV, color: '#32353C', maxWidth: 520 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 225, y: 1320, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#2B2A2E', maxWidth: 230, fitChars: 15 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 226, y: 1353, fontSize: 24, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#B57D7F', maxWidth: 230, fitChars: 12 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 457, y: 1353, fontSize: 23, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#5B7488', textTransform: 'uppercase', maxWidth: 200 }),
      bf({ formKey: 'venue', x: 707, y: 1320, fontSize: 19, fontFamily: MS, fontWeight: '500', color: '#907865', lineHeight: 29, wrapAfterChars: 20, maxWidth: 260, textTransform: 'uppercase' }),
      // This card (and gr-c9) closes with a handwritten script line rather
      // than the spaced Montserrat caps the other concepts use.
      bf({ formKey: 'customMessage', x: 464, y: 1471, fontSize: 38, fontFamily: MK, color: '#3D3C3C', lineHeight: 51, wrapAfterChars: 27, maxLines: 3, maxWidth: 620 }),
    ]),
  },
  {
    id: 'gr-c7', eventType: 'genderreveal', name: 'Secret Door', style: 'Whimsical & Bright',
    previewImage: '/templates/gender reveal/concepts/7-preview.jpg',
    realImage: '/templates/gender reveal/concepts/7-blank.jpg',
    accent: '#1C202E',
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'fatherName', x: 419, y: 1153, align: 'right', fontSize: 78, fontFamily: GV, color: '#0F1321', maxWidth: 520 }),
      bf({ text: '&', x: 463, y: 1172, fontSize: 48, fontFamily: GV, color: '#1C202E' }),
      bf({ formKey: 'motherName', x: 507, y: 1152, align: 'left', fontSize: 78, fontFamily: GV, color: '#111624', maxWidth: 520 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 248, y: 1321, fontSize: 16, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#242631', maxWidth: 230, fitChars: 16 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 250, y: 1350, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#C67888', maxWidth: 230, fitChars: 12 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 456, y: 1349, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#4E799C', textTransform: 'uppercase', maxWidth: 200 }),
      bf({ formKey: 'venue', x: 673, y: 1318, fontSize: 19, fontFamily: MS, fontWeight: '500', color: '#2C303D', lineHeight: 28, wrapAfterChars: 20, maxWidth: 260, textTransform: 'uppercase' }),
      bf({ formKey: 'customMessage', x: 447, y: 1447, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#1D202B', lineHeight: 26, wrapAfterChars: 18, maxWidth: 420, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'gr-c8', eventType: 'genderreveal', name: 'Cotton Candy Sky', style: 'Dreamy & Pastel',
    previewImage: '/templates/gender reveal/concepts/8-preview.jpg',
    realImage: '/templates/gender reveal/concepts/8-blank.jpg',
    accent: '#192C4E',
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'fatherName', x: 433, y: 962, align: 'right', fontSize: 89, fontFamily: GV, color: '#192C4E', maxWidth: 520 }),
      bf({ text: '&', x: 477, y: 978, fontSize: 55, fontFamily: GV, color: '#192C4E' }),
      bf({ formKey: 'motherName', x: 521, y: 962, align: 'left', fontSize: 89, fontFamily: GV, color: '#192C4E', maxWidth: 520 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 235, y: 1173, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#1D2128', maxWidth: 230, fitChars: 14 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 235, y: 1204, fontSize: 21, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#D16E88', maxWidth: 230, fitChars: 13 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 453, y: 1206, fontSize: 20, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#3171A6', textTransform: 'uppercase', maxWidth: 200 }),
      bf({ formKey: 'venue', x: 686, y: 1169, fontSize: 17, fontFamily: MS, fontWeight: '500', color: '#306DA2', lineHeight: 29, wrapAfterChars: 20, maxWidth: 260, textTransform: 'uppercase' }),
      bf({ formKey: 'customMessage', x: 470, y: 1294, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#20252E', lineHeight: 28, wrapAfterChars: 18, maxWidth: 420, textTransform: 'uppercase' }),
    ]),
  },
  {
    id: 'gr-c9', eventType: 'genderreveal', name: 'Teddy Reveal Party', style: 'Navy & Balloons',
    previewImage: '/templates/gender reveal/concepts/9-preview.jpg',
    realImage: '/templates/gender reveal/concepts/9-blank.jpg',
    accent: '#252E44',
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'fatherName', x: 415, y: 800, align: 'right', fontSize: 64, fontFamily: GV, color: '#252E44', maxWidth: 520 }),
      bf({ text: '&', x: 459, y: 812, fontSize: 40, fontFamily: GV, color: '#252E44' }),
      bf({ formKey: 'motherName', x: 503, y: 800, align: 'left', fontSize: 64, fontFamily: GV, color: '#252E44', maxWidth: 520 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 263, y: 1287, fontSize: 18, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#D2E2EE', maxWidth: 230, fitChars: 13 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 263, y: 1316, fontSize: 18, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#D2E2EE', maxWidth: 230, fitChars: 13 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 452, y: 1316, fontSize: 19, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#89B0E1', textTransform: 'uppercase', maxWidth: 200 }),
      bf({ formKey: 'venue', x: 660, y: 1285, fontSize: 18, fontFamily: MS, fontWeight: '500', color: '#D1E0EF', lineHeight: 26, wrapAfterChars: 20, maxWidth: 260, textTransform: 'uppercase' }),
      // Handwritten script sign-off, same treatment as gr-c6.
      bf({ formKey: 'customMessage', x: 471, y: 1407, fontSize: 36, fontFamily: MK, color: '#D5D1EE', lineHeight: 21, wrapAfterChars: 27, maxLines: 3, maxWidth: 620 }),
    ]),
  },
  {
    id: 'gr-c10', eventType: 'genderreveal', name: 'Little Bottle', style: 'Minimal & Sweet',
    previewImage: '/templates/gender reveal/concepts/10-preview.jpg',
    realImage: '/templates/gender reveal/concepts/10-blank.jpg',
    accent: '#786C66',
    layout: sizedLayout(941, 1672, [
      bf({ formKey: 'fatherName', x: 433, y: 1124, align: 'right', fontSize: 88, fontFamily: GV, color: '#786C66', maxWidth: 520 }),
      bf({ text: '&', x: 477, y: 1140, fontSize: 55, fontFamily: GV, color: '#786C66' }),
      bf({ formKey: 'motherName', x: 521, y: 1124, align: 'left', fontSize: 88, fontFamily: GV, color: '#786C66', maxWidth: 520 }),
      bf({ formKey: 'eventDate', format: 'weekdayUpper', x: 216, y: 1309, fontSize: 20, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#6E625C', maxWidth: 230, fitChars: 15 }),
      bf({ formKey: 'eventDate', format: 'dayMonthYearUpper', x: 216, y: 1340, fontSize: 23, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#DD9299', maxWidth: 230, fitChars: 13 }),
      bf({ formKey: 'eventTime', format: 'time12', x: 456, y: 1342, fontSize: 22, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#4B85AE', textTransform: 'uppercase', maxWidth: 200 }),
      bf({ formKey: 'venue', x: 714, y: 1308, fontSize: 19, fontFamily: MS, fontWeight: '500', color: '#5086AB', lineHeight: 29, wrapAfterChars: 20, maxWidth: 260, textTransform: 'uppercase' }),
      bf({ formKey: 'customMessage', x: 469, y: 1455, fontSize: 22, fontFamily: MS, fontWeight: '500', letterSpacing: 1, color: '#6F655E', lineHeight: 33, wrapAfterChars: 18, maxWidth: 420, textTransform: 'uppercase' }),
    ]),
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

export const eviteTemplates: EviteTemplate[] = localEviteTemplates.map((template) => ({
  ...template,
  previewImage: templateAssetUrl(template.previewImage),
  realImage: template.realImage ? templateAssetUrl(template.realImage) : undefined,
}));
