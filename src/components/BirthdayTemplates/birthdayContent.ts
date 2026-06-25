export interface BirthdayScheduleItem {
  name: string;
  time: string;
  description: string;
}

export interface BirthdayContent {
  /* hero */
  honoree: string;
  age: string;
  tagline: string;
  monogram: string;
  intro: string;
  dateLabel: string;
  dateISO: string;
  heroImageUrl: string;

  /* about */
  aboutTitle: string;
  aboutBody: string;

  /* schedule */
  scheduleTitle: string;
  events: BirthdayScheduleItem[];

  /* gallery */
  galleryTitle: string;
  galleryImages: string[];

  /* venue */
  venueTitle: string;
  venueName: string;
  venueAddress: string;
  mapUrl: string;

  /* rsvp */
  rsvpTitle: string;
  rsvpNote: string;
  rsvpContact: string;

  /* footer */
  footerNote: string;
}

const STOCK = {
  hero: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=1200&auto=format&fit=crop',
  g1:   'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop',
  g2:   'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?q=80&w=800&auto=format&fit=crop',
  g3:   'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=800&auto=format&fit=crop',
  g4:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=800&auto=format&fit=crop',
};

export const DEFAULT_BIRTHDAY: BirthdayContent = {
  honoree:   'Priya',
  age:       '30',
  tagline:   '30 trips around the sun',
  monogram:  'P',
  intro:     'Join us as we celebrate the life, laughter, and wonderful years of someone who makes every room brighter.',
  dateLabel: 'Saturday, August 9, 2026',
  dateISO:   '2026-08-09T20:00',
  heroImageUrl: STOCK.hero,

  aboutTitle: 'The Guest of Honour',
  aboutBody:  'Priya has spent three decades collecting passport stamps, perfecting her biryani, and making strangers feel like lifelong friends. Thirty years of her has made the world a considerably better place — and this party is our way of saying thank you.',

  scheduleTitle: 'Evening Schedule',
  events: [
    { name: 'Welcome Drinks',  time: '7:00 PM',  description: 'Cocktails & canapes on the terrace' },
    { name: 'Dinner',          time: '8:30 PM',  description: 'Seated dinner & speeches' },
    { name: 'The Big Reveal',  time: '10:00 PM', description: 'Cake cutting & surprises' },
    { name: 'Dance Floor',     time: '10:30 PM', description: 'DJ till midnight' },
  ],

  galleryTitle: 'Through the Years',
  galleryImages: [STOCK.g1, STOCK.g2, STOCK.g3, STOCK.g4],

  venueTitle:   'Where to Find Us',
  venueName:    'The Leela Palace',
  venueAddress: 'No. 23, Langford Road, Bengaluru, Karnataka 560025',
  mapUrl:       'https://maps.google.com/?q=The+Leela+Palace+Bengaluru',

  rsvpTitle:   'Will You Be There?',
  rsvpNote:    'Kindly RSVP by July 30th so we can save you the best seat in the house.',
  rsvpContact: '+91 98765 43210',

  footerNote:  'With love, laughter & lots of cake — The Sharma Family',
};
