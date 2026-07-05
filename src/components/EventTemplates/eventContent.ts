// Default editable content per event. Reuses the wedding InviteContent shape so
// the shared editor + primitives work unchanged. Field meaning is repurposed
// per event and surfaced with event-specific labels in the editor:
//   brideName → primary name/headline   groomName → secondary (optional)
//   monogram  → seal glyph / initials / emoji
import type { InviteContent } from '../WebsiteTemplates/inviteContent';
import type { EventKey } from './eventThemes';

const IMG = {
  baby: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=1200&auto=format&fit=crop',
  babyG1: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?q=80&w=800&auto=format&fit=crop',
  babyG2: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?q=80&w=800&auto=format&fit=crop',
  babyG3: 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?q=80&w=800&auto=format&fit=crop',
  babyG4: 'https://images.unsplash.com/photo-1607453998774-d533f65dac99?q=80&w=800&auto=format&fit=crop',
  party: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=1200&auto=format&fit=crop',
  partyG1: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop',
  partyG2: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
  partyG3: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800&auto=format&fit=crop',
  partyG4: 'https://images.unsplash.com/photo-1517157837591-73f0f6a9d0f7?q=80&w=800&auto=format&fit=crop',
  reveal: 'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?q=80&w=1200&auto=format&fit=crop',
  house: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
  houseG1: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=800&auto=format&fit=crop',
  houseG2: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop',
  houseG3: 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?q=80&w=800&auto=format&fit=crop',
  houseG4: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800&auto=format&fit=crop',
  custom: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
  customG1: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=800&auto=format&fit=crop',
  customG2: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=800&auto=format&fit=crop',
  customG3: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?q=80&w=800&auto=format&fit=crop',
  customG4: 'https://images.unsplash.com/photo-1530023367847-a683933f4172?q=80&w=800&auto=format&fit=crop',
};

export const EVENT_CONTENT: Record<EventKey, InviteContent> = {
  babyshower: {
    brideName: 'Baby Kapoor', groomName: '', monogram: '👶', dateISO: '2026-05-17T11:00',
    intro: 'A tiny miracle is on the way — join us to shower Ananya with love before the little one arrives.',
    dateLabel: 'Sunday, May 17, 2026',
    heroImageUrl: IMG.baby,
    storyTitle: 'The Sweetest News', storyBody:
      'After the longest, happiest wait, our family is about to grow by two little feet. Come celebrate the mama-to-be with games, giggles, and a whole lot of cake.',
    eventsTitle: 'The Celebration',
    events: [
      { name: 'Welcome & Games', date: 'Sun, May 17', time: '11:00 AM', venue: 'The Garden Room' },
      { name: 'Brunch & Cake', date: 'Sun, May 17', time: '12:30 PM', venue: 'Terrace Patio' },
      { name: 'Gift Opening', date: 'Sun, May 17', time: '2:00 PM', venue: 'The Garden Room' },
    ],
    galleryTitle: 'Countdown to Cuddles', galleryImages: [IMG.babyG1, IMG.babyG2, IMG.babyG3, IMG.babyG4],
    venueTitle: 'Where', venueName: 'The Ivy Garden', venueAddress: '42 Bloom Street, Portland, OR 97205',
    mapUrl: 'https://maps.google.com/?q=Portland',
    rsvpTitle: 'Will You Join Us?', rsvpNote: 'Kindly RSVP by May 3rd so we can save you a slice of cake.',
    rsvpContact: '+1 555 0134',
    footerNote: 'With love — Ananya & family',
  },
  bridetobe: {
    brideName: 'Sofia', groomName: '', monogram: '💍', dateISO: '2026-06-06T19:00',
    intro: 'She said yes! Now let\'s send our girl into married life with one unforgettable night out.',
    dateLabel: 'Saturday, June 6, 2026',
    heroImageUrl: IMG.party,
    storyTitle: 'One Last Fling', storyBody:
      'Before the veil, before the vows — there\'s a night that belongs to us. Heels on, worries off. Let\'s toast to the bride and make memories we\'ll be laughing about for years.',
    eventsTitle: 'The Itinerary',
    events: [
      { name: 'Champagne Welcome', date: 'Sat, Jun 6', time: '7:00 PM', venue: 'The Rooftop, Suite 12' },
      { name: 'Dinner & Toasts', date: 'Sat, Jun 6', time: '8:30 PM', venue: 'Lumière Bistro' },
      { name: 'Dance the Night', date: 'Sat, Jun 6', time: '10:30 PM', venue: 'Club Aurora' },
    ],
    galleryTitle: 'The Bride Tribe', galleryImages: [IMG.partyG1, IMG.partyG2, IMG.partyG3, IMG.partyG4],
    venueTitle: 'Meeting Point', venueName: 'The Rooftop Lounge', venueAddress: '9 Skyline Ave, Miami, FL 33139',
    mapUrl: 'https://maps.google.com/?q=Miami',
    rsvpTitle: 'Are You In?', rsvpNote: 'Text me to claim your spot — dress code is glam & fabulous.',
    rsvpContact: '+1 555 0177',
    footerNote: 'To the bride-to-be — Sofia 💫',
  },
  genderreveal: {
    brideName: 'Baby M', groomName: '', monogram: '❓', dateISO: '2026-04-25T16:00',
    intro: 'Pink or blue? He or she? The wait is almost over — come find out with us!',
    dateLabel: 'Saturday, April 25, 2026',
    heroImageUrl: IMG.reveal,
    storyTitle: 'The Big Question', storyBody:
      'We\'ve been dying to share the secret (okay, we don\'t know it either!). Cast your vote, grab a treat, and be there for the moment the confetti flies and the mystery unravels.',
    eventsTitle: 'How It Goes',
    events: [
      { name: 'Cast Your Vote', date: 'Sat, Apr 25', time: '4:00 PM', venue: 'The Backyard' },
      { name: 'The Reveal', date: 'Sat, Apr 25', time: '5:00 PM', venue: 'The Backyard' },
      { name: 'Celebrate!', date: 'Sat, Apr 25', time: '5:30 PM', venue: 'The Backyard' },
    ],
    galleryTitle: 'Team Pink vs Team Blue', galleryImages: [IMG.customG1, IMG.customG2, IMG.customG3, IMG.customG4],
    venueTitle: 'Where', venueName: 'The Family Backyard', venueAddress: '7 Maple Court, Austin, TX 78704',
    mapUrl: 'https://maps.google.com/?q=Austin',
    rsvpTitle: 'Pick a Team', rsvpNote: 'RSVP with your guess — winner gets bragging rights forever!',
    rsvpContact: '+1 555 0199',
    footerNote: 'Pink or blue, we\'ll love you — The Morgans',
  },
  housewarming: {
    brideName: 'The Nguyens', groomName: '', monogram: '🏡', dateISO: '2026-03-14T17:00',
    intro: 'We finally found home. Come break bread, warm the walls, and make our new place feel loved.',
    dateLabel: 'Saturday, March 14, 2026',
    heroImageUrl: IMG.house,
    storyTitle: 'Our New Chapter', storyBody:
      'Keys in hand and hearts full, we\'ve turned a house into a home — and there\'s no housewarming without the people who make it warm. Bring your appetite; leave your shoes at the door.',
    eventsTitle: 'The Evening',
    events: [
      { name: 'House Tour', date: 'Sat, Mar 14', time: '5:00 PM', venue: 'Front Door' },
      { name: 'Dinner & Drinks', date: 'Sat, Mar 14', time: '6:30 PM', venue: 'The Kitchen' },
      { name: 'Fireside Hangout', date: 'Sat, Mar 14', time: '8:00 PM', venue: 'The Backyard' },
    ],
    galleryTitle: 'Around the House', galleryImages: [IMG.houseG1, IMG.houseG2, IMG.houseG3, IMG.houseG4],
    venueTitle: 'Come On Over', venueName: 'Our New Home', venueAddress: '128 Cedar Lane, Denver, CO 80206',
    mapUrl: 'https://maps.google.com/?q=Denver',
    rsvpTitle: 'Save Us a Seat?', rsvpNote: 'Let us know you\'re coming so we cook enough — no gifts, just good company.',
    rsvpContact: '+1 555 0142',
    footerNote: 'Our door is always open — The Nguyens',
  },
  custom: {
    brideName: 'Our Celebration', groomName: '', monogram: '✦', dateISO: '2026-07-18T18:00',
    intro: 'Some moments deserve more than a text. Join us for an evening worth remembering.',
    dateLabel: 'Saturday, July 18, 2026',
    heroImageUrl: IMG.custom,
    storyTitle: 'The Occasion', storyBody:
      'Whatever we\'re celebrating — a milestone, a reunion, a brand-new beginning — it\'s always better together. Here\'s to good food, great company, and a night we\'ll be glad we said yes to.',
    eventsTitle: 'The Programme',
    events: [
      { name: 'Welcome Drinks', date: 'Sat, Jul 18', time: '6:00 PM', venue: 'The Atrium' },
      { name: 'Dinner', date: 'Sat, Jul 18', time: '7:30 PM', venue: 'Main Hall' },
      { name: 'Music & Dancing', date: 'Sat, Jul 18', time: '9:00 PM', venue: 'The Terrace' },
    ],
    galleryTitle: 'Moments', galleryImages: [IMG.customG1, IMG.customG2, IMG.customG3, IMG.customG4],
    venueTitle: 'Find Your Way', venueName: 'The Grand Atrium', venueAddress: '55 Park Avenue, New York, NY 10016',
    mapUrl: 'https://maps.google.com/?q=New+York',
    rsvpTitle: 'Join Us?', rsvpNote: 'Kindly let us know if you can make it by July 4th.',
    rsvpContact: '+1 555 0100',
    footerNote: 'With gratitude — your hosts',
  },
};
