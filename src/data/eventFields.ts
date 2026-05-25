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
    { name: 'parentNames', label: "Parent(s) Name(s)", type: 'text', placeholder: "Parent(s) name(s)", required: true },
  ],
  housewarming: [
    { name: 'homeownerName', label: "Homeowner(s) Name", type: 'text', placeholder: "Who's celebrating the new home?", required: true },
  ],
  custom: [
    { name: 'eventName', label: 'Event Name', type: 'text', placeholder: 'e.g. Anniversary, Graduation, Reunion…', required: true },
  ],
};

// Event types that do NOT collect a Host Name in the editor.
const EVENTS_WITHOUT_HOST_NAME: EventType[] = ['marriage', 'bridetobe'];

/**
 * Build the ordered list of editor fields for a given event type.
 * Order: event-specific → host(?) → date → time → timezone → guest count → venue → custom message.
 * RSVP is no longer collected for any event type.
 */
export function getEditorFields(eventType: EventType): EventField[] {
  const find = (n: string) => commonFields.find((f) => f.name === n)!;
  const specific = eventSpecificFields[eventType] ?? [];
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

export function getRequiredFieldNames(eventType: EventType): string[] {
  return getEditorFields(eventType).filter((f) => f.required).map((f) => f.name);
}
