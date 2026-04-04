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
    label: 'Marriage',
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
  { name: 'venue', label: 'Venue / Location', type: 'text', placeholder: 'Where is the event?', required: true },
  { name: 'rsvpContact', label: 'RSVP Contact (Phone or Email)', type: 'text', placeholder: 'How should guests RSVP?', required: true },
  { name: 'customMessage', label: 'Custom Message', type: 'textarea', placeholder: 'Add a personal note (optional)', required: false },
];

export const eventSpecificFields: Record<EventType, EventField[]> = {
  birthday: [
    { name: 'celebrantName', label: "Celebrant's Name", type: 'text', placeholder: "Who's the birthday star?", required: true },
    { name: 'age', label: 'Age / Turning', type: 'number', placeholder: 'e.g. 25', required: false },
    { name: 'theme', label: 'Theme', type: 'text', placeholder: 'e.g. Retro, Garden Party (optional)', required: false },
  ],
  marriage: [
    { name: 'brideName', label: "Bride's Name", type: 'text', placeholder: "Bride's full name", required: true },
    { name: 'groomName', label: "Groom's Name", type: 'text', placeholder: "Groom's full name", required: true },
    { name: 'ceremonyType', label: 'Ceremony Type', type: 'select', options: ['Religious', 'Civil', 'Both'], required: true },
    { name: 'receptionVenue', label: 'Reception Venue (if different)', type: 'text', placeholder: 'Leave blank if same as ceremony', required: false },
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
