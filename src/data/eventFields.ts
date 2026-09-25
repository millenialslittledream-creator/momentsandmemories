export type EventType = 'birthday' | 'marriage' | 'babyshower' | 'bridetobe' | 'genderreveal' | 'housewarming' | 'custom';

export interface EventField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'time' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface EventTypeInfo {
  id: EventType;
  label: string;
  description: string;
  icon: string; // material icon name
  color: string;
}

export const eventTypes: EventTypeInfo[] = [
  {
    id: 'birthday',
    label: 'Birthday',
    description: 'Celebrate another year of life with a stunning invite',
    icon: 'cake',
    color: '#e8a87c',
  },
  {
    id: 'marriage',
    label: 'Wedding',
    description: 'Announce your special day with elegance and grace',
    icon: 'favorite',
    color: '#c4a882',
  },
  {
    id: 'babyshower',
    label: 'Baby Shower',
    description: 'Welcome the little one with a beautiful invitation',
    icon: 'child_care',
    color: '#a8d5ba',
  },
  {
    id: 'bridetobe',
    label: 'Pre-Wedding Party',
    description: 'Plan the perfect bridal shower or bachelorette',
    icon: 'spa',
    color: '#d4a5a5',
  },
  {
    id: 'genderreveal',
    label: 'Gender Reveal',
    description: 'Build the excitement for the big reveal',
    icon: 'auto_awesome',
    color: '#b5c7e3',
  },
  {
    id: 'housewarming',
    label: 'Housewarming',
    description: 'Celebrate your new home with family and friends',
    icon: 'home',
    color: '#c4a882',
  },
  {
    id: 'custom',
    label: 'Others',
    description: 'Create a personalised invite for any occasion',
    icon: 'stars',
    color: '#9cb092',
  },
];

const TIMEZONE_OPTIONS = ['PT', 'MT', 'CT', 'ET', 'AKT', 'HAT', 'AST', 'SST', 'ChST', 'IST'];

// Reusable common fields. Kept as a single export so legacy components keep compiling,
// but the editor flow uses `getEditorFields(eventType)` below to compose ordered, event-aware lists.
export const commonFields: EventField[] = [
  { name: 'hostName', label: 'Host Name(s)', type: 'text', placeholder: 'Who is hosting?', required: true },
  { name: 'eventDate', label: 'Event Date', type: 'date', required: true },
  { name: 'eventTime', label: 'Event Time', type: 'time', required: true },
  { name: 'timezone', label: 'Timezone', type: 'select', options: TIMEZONE_OPTIONS, required: true },
  { name: 'venue', label: 'Venue / Location', type: 'text', placeholder: 'Where is the event?', required: true },
  { name: 'guestCount', label: 'Approximate Guest Count', type: 'number', placeholder: 'e.g. 50', required: false },
  { name: 'customMessage', label: 'Custom Message (sent with the invite)', type: 'textarea', placeholder: 'A personal note from you — guests will see this in the message we send them.', required: false },
];

export const eventSpecificFields: Record<EventType, EventField[]> = {
  birthday: [
    { name: 'celebrantName', label: "Celebrant's Name", type: 'text', placeholder: "Who's the birthday star?", required: true },
  ],
  marriage: [
    { name: 'brideName', label: "Bride's Name", type: 'text', placeholder: "Bride's full name", required: true },
    { name: 'groomName', label: "Groom's Name", type: 'text', placeholder: "Groom's full name", required: true },
  ],
  babyshower: [
    { name: 'celebrantName', label: "Celebrant's Name", type: 'text', placeholder: "Celebrant's name", required: true },
    { name: 'babyGender', label: "Baby's Gender (if known)", type: 'select', options: ['Boy', 'Girl', 'Surprise!'], required: false },
    { name: 'registryLink', label: 'Registry Link', type: 'text', placeholder: 'Link to gift registry (optional)', required: false },
  ],
  bridetobe: [
    { name: 'celebrantName', label: "Celebrant's Name", type: 'text', placeholder: "Celebrant's name", required: true },
    { name: 'dressCode', label: 'Dress Code', type: 'text', placeholder: 'e.g. All White, Cocktail (optional)', required: false },
  ],
  genderreveal: [
    { name: 'motherName', label: "Mother's Name", type: 'text', placeholder: "e.g. Sarah", required: true },
    { name: 'fatherName', label: "Father's Name", type: 'text', placeholder: "e.g. Michael", required: false },
  ],
  housewarming: [
    { name: 'homeownerName', label: "Homeowner(s) Name", type: 'text', placeholder: "Who's celebrating the new home?", required: true },
  ],
  custom: [
    { name: 'eventName', label: 'Event Name', type: 'text', placeholder: 'e.g. Anniversary, Graduation, Reunion…', required: true },
  ],
};

// Per-template field overrides: a specific template can replace the event
// type's default "specific" fields. e.g. the pre-wedding "Champagne Toast"
// template (pw-h1) shows both names, so it collects the bride's + groom's name
// instead of the single celebrant name the other pre-wedding templates use.
export const TEMPLATE_FIELD_OVERRIDES: Record<string, EventField[]> = {
  'pw-h1': [
    { name: 'brideName', label: "Bride's Name", type: 'text', placeholder: "Bride's full name", required: true },
    { name: 'groomName', label: "Groom's Name", type: 'text', placeholder: "Groom's full name", required: true },
  ],
};

// ── Baby-shower concept cards: full per-template field lists ──────────────
// The designer's revised artwork prints only DATE & TIME, VENUE and a closing
// note on every one of the 13 concepts — the celebrant name, guest count,
// baby's gender, registry, "hosted by" and RSVP rows were all removed. Unlike
// TEMPLATE_FIELD_OVERRIDES (which only swaps the event-specific fields and
// still appends every common field), TEMPLATE_FIELD_SETS defines the COMPLETE
// ordered field list so the editor collects exactly what that concept prints —
// nothing more.
const cf = (n: string): EventField => commonFields.find((f) => f.name === n)!;
// Date + time + timezone + venue — the block every concept shares. (The editor
// renders date/time/timezone together in one picker; venue is its own field.)
const dtv = (): EventField[] => [cf('eventDate'), cf('eventTime'), cf('timezone'), cf('venue')];

// Used by every concept whose ARTWORK prints the note. The generic
// commonFields entry is for templates that only send it with the invite.
const bfNote: EventField = { name: 'customMessage', label: 'A Little Note (printed on the card)', type: 'textarea', placeholder: 'A short message printed on the invitation — guests also see it in the message we send.', required: false };

// Every revised concept collects the same thing: date · time · venue · note.
const bfRsvpName: EventField = { name: 'rsvpName', label: 'RSVP To', type: 'text', placeholder: 'e.g. Melinda Shin', required: false };

const babyNoteSet = (): EventField[] => [...dtv(), bfNote];

// ── Birthday concept cards: full per-template field lists ─────────────────
// Same rationale as the baby-shower sets above: each of the 12 birthday
// "concept" templates (bday-c1 … bday-c12) prints a different subset, so the
// editor collects exactly what that concept shows — nothing more.
const bfBdayCelebrant: EventField = { name: 'celebrantName', label: "Celebrant's Name", type: 'text', placeholder: "Who's the birthday star?", required: true };
// name · date · venue · guests · hosted by — the grid & ribbon concepts, whose
// closing note ("Good people. Great vibes...") is baked into the artwork.
const bdayNameDateVenueSet = (): EventField[] => [bfBdayCelebrant, ...dtv()];
const bdayDateVenueSet = (): EventField[] => [...dtv()];
// Same fields, printed with a real "A little note" / "Custom message" box.

// ── Pre-wedding concept cards: full per-template field lists ──────────────
// Every concept prints both partners' names (monogram initials and/or an
// inline "Bride & Groom" or stacked "Bride / and / Groom" line) plus the
// usual date/time/venue. Most also print a dress code; two skip it (no
// baked "DRESS CODE" line in that concept) and one prints an RSVP contact
// line instead.
const bfBride: EventField = { name: 'brideName', label: "Bride's Name", type: 'text', placeholder: "Bride's full name", required: true };
const bfGroom: EventField = { name: 'groomName', label: "Groom's Name", type: 'text', placeholder: "Groom's full name", required: true };
const pwCoupleSet = (): EventField[] => [bfBride, bfGroom, ...dtv()];

// ── Housewarming concept cards: full per-template field lists ─────────────
// Most concepts print a single "Homeowner(s)" signature line; a couple also
// print a separate "Host Name(s)" line, a guest count, or a warm note.
const bfHomeowner: EventField = { name: 'homeownerName', label: "Homeowner(s) Name", type: 'text', placeholder: "Who's celebrating the new home?", required: true };
const bfHostNames: EventField = { name: 'hostName', label: 'Host Name(s)', type: 'text', placeholder: 'Who else is hosting?', required: false };
const hwDateVenueSet = (): EventField[] => [bfHomeowner, ...dtv()];
const hwDateOnlySet = (): EventField[] => [bfHomeowner, cf('eventDate'), cf('eventTime'), cf('timezone')];

// ── Wedding concept cards: full per-template field lists ──────────────────
// Every concept prints both names + date/time/venue; most also print a custom
// message. The artwork previously carried a "150 GUESTS" line, which the
// designer removed in the final revision — so no concept collects one now.
const wedCoupleSet = (): EventField[] => [bfBride, bfGroom, ...dtv()];

// -- Gender reveal concept cards: full per-template field lists -----------
// Each card prints BOTH celebrants' names either side of a baked '&', so
// both are required here even though the event type treats the father's
// name as optional by default.
const grParentA: EventField = { name: 'fatherName', label: "Celebrant 1 Name", type: 'text', placeholder: 'e.g. Rahul', required: true };
const grParentB: EventField = { name: 'motherName', label: "Celebrant 2 Name", type: 'text', placeholder: 'e.g. Aishwarya', required: true };
const grSetWithNote = (): EventField[] => [grParentA, grParentB, ...dtv(), bfNote];

export const TEMPLATE_FIELD_SETS: Record<string, EventField[]> = {
  'baby-c1': babyNoteSet(),
  'baby-c2': babyNoteSet(),
  'baby-c3': babyNoteSet(),
  'baby-c4': babyNoteSet(),
  'baby-c5': babyNoteSet(),
  'baby-c6': babyNoteSet(),
  'baby-c7': babyNoteSet(),
  'baby-c8': babyNoteSet(),
  'baby-c9': babyNoteSet(),
  'baby-c10': babyNoteSet(),
  'baby-c11': babyNoteSet(),
  'baby-c12': babyNoteSet(),
  'baby-c13': babyNoteSet(),

  // Revised birthday artwork prints only celebrant + date/time + venue
  // (the HOSTED BY and GUEST COUNT rows were removed); three of the
  // designs print no celebrant name at all.
  'bday-c1': bdayNameDateVenueSet(),
  'bday-c2': bdayNameDateVenueSet(),
  'bday-c3': bdayNameDateVenueSet(),
  'bday-c5': bdayNameDateVenueSet(),
  'bday-c6': bdayNameDateVenueSet(),
  'bday-c7': bdayDateVenueSet(),
  'bday-c8': bdayDateVenueSet(),
  'bday-c9': bdayDateVenueSet(),
  'bday-c10': bdayNameDateVenueSet(),
  'bday-c11': bdayDateVenueSet(),
  'bday-c13': bdayNameDateVenueSet(),

  'pw-c1': pwCoupleSet(),
  'pw-c2': pwCoupleSet(),
  'pw-c3': pwCoupleSet(),
  'pw-c4': pwCoupleSet(),
  'pw-c5': pwCoupleSet(),
  'pw-c6': pwCoupleSet(),
  'pw-c7': pwCoupleSet(),
  'pw-c8': [bfBride, bfGroom, ...dtv(), bfRsvpName],
  'pw-c9': pwCoupleSet(),
  'pw-c10': pwCoupleSet(),
  'pw-c11': pwCoupleSet(),
  'pw-c12': pwCoupleSet(),

  'wed-c1': wedCoupleSet(),
  'wed-c2': wedCoupleSet(),
  'wed-c3': [...wedCoupleSet(), bfNote],
  'wed-c4': [...wedCoupleSet(), bfNote],
  'wed-c5': wedCoupleSet(),
  'wed-c6': [...wedCoupleSet(), bfNote],
  'wed-c7': [...wedCoupleSet(), bfNote],
  'wed-c8': [...wedCoupleSet(), bfNote],
  'wed-c9': [...wedCoupleSet(), bfNote],
  'wed-c10': [...wedCoupleSet(), bfNote],
  'wed-c11': [...wedCoupleSet(), bfNote],
  'wed-c12': [...wedCoupleSet(), bfNote],


  'gr-c1': grSetWithNote(),
  'gr-c2': grSetWithNote(),
  'gr-c4': grSetWithNote(),
  'gr-c5': grSetWithNote(),
  'gr-c6': grSetWithNote(),
  'gr-c7': grSetWithNote(),
  'gr-c8': grSetWithNote(),
  'gr-c9': grSetWithNote(),
  'gr-c10': grSetWithNote(),

  'hw-c1': hwDateOnlySet(),
  'hw-c2': [...hwDateOnlySet(), bfNote],
  'hw-c3': hwDateVenueSet(),
  'hw-c4': hwDateVenueSet(),
  'hw-c5': hwDateVenueSet(),
  'hw-c6': hwDateVenueSet(),
  'hw-c7': hwDateVenueSet(),
  'hw-c8': hwDateVenueSet(),
  'hw-c9': [bfHomeowner, bfHostNames, ...dtv(), cf('guestCount'), bfNote],
  'hw-c10': hwDateVenueSet(),
};

// Event types that do NOT collect a Host Name in the editor.
const EVENTS_WITHOUT_HOST_NAME: EventType[] = ['marriage', 'bridetobe'];

/**
 * Build the ordered list of editor fields for a given event type.
 * Order: event-specific → host(?) → date → time → timezone → guest count → venue → custom message.
 * RSVP is no longer collected for any event type.
 */
export function getEditorFields(eventType: EventType, templateId?: string): EventField[] {
  // Templates with a complete, hand-authored field list (baby-shower concepts)
  // bypass the default composition entirely.
  if (templateId && TEMPLATE_FIELD_SETS[templateId]) return TEMPLATE_FIELD_SETS[templateId];
  const find = (n: string) => commonFields.find((f) => f.name === n)!;
  const specific = (templateId && TEMPLATE_FIELD_OVERRIDES[templateId]) || eventSpecificFields[eventType] || [];
  const fields: EventField[] = [...specific];
  if (!EVENTS_WITHOUT_HOST_NAME.includes(eventType)) {
    fields.push(find('hostName'));
  }
  fields.push(find('eventDate'));
  fields.push(find('eventTime'));
  fields.push(find('timezone'));
  fields.push(find('guestCount'));
  fields.push(find('venue'));
  fields.push(find('customMessage'));
  return fields;
}

export function getRequiredFieldNames(eventType: EventType, templateId?: string): string[] {
  return getEditorFields(eventType, templateId).filter((f) => f.required).map((f) => f.name);
}
