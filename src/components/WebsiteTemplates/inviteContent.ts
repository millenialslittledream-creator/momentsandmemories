// The editable content for a wedding invitation. The editor only ever touches
// text + image fields below — structure/layout is owned by the template, not the user.

export interface EventItem {
  name: string;
  date: string;
  time: string;
  venue: string;
}

export interface InviteContent {
  // Hero
  brideName: string;
  groomName: string;
  monogram: string;        // initials on the wax seal, e.g. "D&D"
  intro: string;           // "Together with their families…"
  dateLabel: string;       // "Sunday, April 12, 2026"
  dateISO: string;         // for the countdown, e.g. "2026-04-12T18:00"
  heroImageUrl: string;

  // Our story
  storyTitle: string;
  storyBody: string;

  // Events / schedule
  eventsTitle: string;
  events: EventItem[];

  // Gallery
  galleryTitle: string;
  galleryImages: string[];

  // Venue
  venueTitle: string;
  venueName: string;
  venueAddress: string;
  mapUrl: string;

  // RSVP
  rsvpTitle: string;
  rsvpNote: string;
  rsvpContact: string;

  // Footer
  footerNote: string;
}

const STOCK = {
  hero: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=1200&auto=format&fit=crop',
  g1: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
  g2: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop',
  g3: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop',
  g4: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800&auto=format&fit=crop',
};

export const DEFAULT_WEDDING: InviteContent = {
  brideName: 'Darshan',
  groomName: 'Dharal',
  monogram: 'D&D',
  intro: 'Together with their families, request the pleasure of your company as they begin their forever.',
  dateLabel: 'Sunday, April 12, 2026',
  dateISO: '2026-04-12T18:00',
  heroImageUrl: STOCK.hero,

  storyTitle: 'Our Story',
  storyBody:
    'What began as a chance meeting over chai grew into a love we never saw coming. Three monsoons, countless road trips, and one very nervous proposal later — here we are, asking you to celebrate the beginning of our always.',

  eventsTitle: 'Wedding Events',
  events: [
    { name: 'Mehendi', date: 'Fri, Apr 10', time: '4:00 PM', venue: 'The Courtyard, Udaipur' },
    { name: 'Sangeet', date: 'Sat, Apr 11', time: '7:00 PM', venue: 'Crystal Ballroom' },
    { name: 'Wedding Ceremony', date: 'Sun, Apr 12', time: '6:00 PM', venue: 'The Oberoi Udaivilas' },
  ],

  galleryTitle: 'Moments',
  galleryImages: [STOCK.g1, STOCK.g2, STOCK.g3, STOCK.g4],

  venueTitle: 'Find Your Way',
  venueName: 'The Oberoi Udaivilas',
  venueAddress: 'Haridasji Ki Magri, Udaipur, Rajasthan 313001',
  mapUrl: 'https://maps.google.com/?q=The+Oberoi+Udaivilas+Udaipur',

  rsvpTitle: 'Will You Join Us?',
  rsvpNote: 'Kindly let us know by March 20th so we can save you a seat at our celebration.',
  rsvpContact: '+91 98765 43210',

  footerNote: 'With love & gratitude — Darshan & Dharal',
};
