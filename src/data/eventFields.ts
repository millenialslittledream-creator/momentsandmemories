export type EventType = 'birthday' | 'marriage' | 'babyshower' | 'bridetobe' | 'genderreveal';

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
    label: 'Bride to Be',
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
];

export const commonFields: EventField[] = [
  { name: 'hostName', label: 'Host Name(s)', type: 'text', placeholder: 'Who is hosting?', required: true },
  { name: 'eventDate', label: 'Event Date', type: 'date', required: true },
  { name: 'eventTime', label: 'Event Time', type: 'time', required: true },
  { name: 'timezone', label: 'Timezone', type: 'select', options: [
    // ── United States ──
    'US - Eastern (ET) New York, Washington DC',
    'US - Central (CT) Chicago, Houston, Dallas',
    'US - Mountain (MT) Denver, Salt Lake City',
    'US - Arizona (MT no DST) Phoenix',
    'US - Pacific (PT) Los Angeles, San Francisco',
    'US - Alaska (AKT) Anchorage, Fairbanks',
    'US - Hawaii (HT) Honolulu, Maui',
    'US - Atlantic (AST) Puerto Rico, US Virgin Islands',
    'US - Samoa (SST) Pago Pago',
    'US - Chamorro (ChST) Guam, Saipan',
    // ── Americas ──
    '(UTC-05:00) Toronto, Montreal',
    '(UTC-06:00) Mexico City, Guadalajara',
    '(UTC-04:00) Halifax, Santo Domingo, Caracas',
    '(UTC-03:30) Newfoundland',
    '(UTC-03:00) Buenos Aires, São Paulo, Santiago',
    '(UTC-05:00) Bogota, Lima, Quito',
    // ── Europe ──
    '(UTC+00:00) London, Dublin, Lisbon',
    '(UTC+01:00) Paris, Berlin, Rome, Madrid',
    '(UTC+02:00) Athens, Helsinki, Bucharest',
    '(UTC+03:00) Moscow, Istanbul, Minsk',
    // ── Africa ──
    '(UTC+00:00) Accra, Dakar',
    '(UTC+01:00) Lagos, Algiers, Tunis',
    '(UTC+02:00) Cairo, Johannesburg, Harare',
    '(UTC+03:00) Nairobi, Addis Ababa, Dar es Salaam',
    // ── Middle East ──
    '(UTC+03:00) Riyadh, Kuwait, Baghdad',
    '(UTC+03:30) Tehran',
    '(UTC+04:00) Dubai, Abu Dhabi, Muscat',
    '(UTC+04:30) Kabul',
    // ── South Asia ──
    '(UTC+05:00) Karachi, Tashkent',
    '(UTC+05:30) Mumbai, New Delhi, Colombo',
    '(UTC+05:45) Kathmandu',
    '(UTC+06:00) Dhaka, Almaty',
    '(UTC+06:30) Yangon',
    // ── East & Southeast Asia ──
    '(UTC+07:00) Bangkok, Jakarta, Ho Chi Minh City',
    '(UTC+08:00) Singapore, Beijing, Hong Kong, Taipei',
    '(UTC+09:00) Tokyo, Seoul',
    // ── Oceania ──
    '(UTC+08:00) Perth',
    '(UTC+09:30) Adelaide, Darwin',
    '(UTC+10:00) Sydney, Melbourne, Brisbane',
    '(UTC+12:00) Auckland, Fiji',
    '(UTC+13:00) Apia, Tongatapu',
    // ── Other ──
    '(UTC-12:00) Baker Island',
    '(UTC-11:00) Niue, Midway',
    '(UTC-02:00) South Georgia',
    '(UTC-01:00) Azores, Cape Verde',
    '(UTC+14:00) Line Islands',
  ], required: true },
  { name: 'venue', label: 'Venue / Location', type: 'text', placeholder: 'Where is the event?', required: true },
  { name: 'rsvpContact', label: 'RSVP Contact (Phone or Email)', type: 'text', placeholder: 'How should guests RSVP?', required: true },
  { name: 'customMessage', label: 'Custom Message', type: 'textarea', placeholder: 'Add a personal note (optional)', required: false },
];

export const eventSpecificFields: Record<EventType, EventField[]> = {
  birthday: [
    { name: 'celebrantName', label: "Celebrant's Name", type: 'text', placeholder: "Who's the birthday star?", required: true },
  ],
  marriage: [
    { name: 'celebrantName', label: "Couple's Names", type: 'text', placeholder: "e.g. Sarah & John", required: true },
    { name: 'brideName', label: "Bride's Name", type: 'text', placeholder: "Bride's full name", required: true },
    { name: 'groomName', label: "Groom's Name", type: 'text', placeholder: "Groom's full name", required: true },
  ],
  babyshower: [
    { name: 'parentNames', label: "Parent(s) Name", type: 'text', placeholder: "Parent(s) name", required: true },
    { name: 'babyGender', label: "Baby's Gender (if known)", type: 'select', options: ['Boy', 'Girl', 'Surprise!'], required: false },
    { name: 'registryLink', label: 'Registry Link', type: 'text', placeholder: 'Link to gift registry (optional)', required: false },
  ],
  bridetobe: [
    { name: 'brideName', label: "Bride's Name", type: 'text', placeholder: "Bride's name", required: true },
    { name: 'organizer', label: 'Organized By', type: 'text', placeholder: 'Bridal party organizer', required: true },
    { name: 'dressCode', label: 'Dress Code', type: 'text', placeholder: 'e.g. All White, Cocktail (optional)', required: false },
  ],
  genderreveal: [
    { name: 'parentNames', label: "Parent(s) Name", type: 'text', placeholder: "Parent(s) name", required: true },
    { name: 'revealHint', label: 'Reveal Method', type: 'select', options: ['Balloons', 'Cake', 'Confetti', 'Smoke Cannon', 'Surprise'], required: false },
  ],
};
