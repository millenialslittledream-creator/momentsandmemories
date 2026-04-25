import type { EventType } from './eventFields';

export interface EviteTemplate {
  id: string;
  eventType: EventType;
  name: string;
  style: string;
  previewImage: string;
  accent: string;
}

export const eviteTemplates: EviteTemplate[] = [
  // ── Birthday (10 templates) ─────────────────────────────────────────────
  { id: 'bday-1',  eventType: 'birthday', name: 'Golden Hour',      style: 'Elegant & Warm',      previewImage: '/templates/birthday/1.jpg',  accent: '#e8a87c' },
  { id: 'bday-2',  eventType: 'birthday', name: 'Neon Glow',        style: 'Bold & Modern',        previewImage: '/templates/birthday/2.jpg',  accent: '#ff6b6b' },
  { id: 'bday-3',  eventType: 'birthday', name: 'Garden Party',     style: 'Floral & Fresh',       previewImage: '/templates/birthday/3.jpg',  accent: '#a8d5ba' },
  { id: 'bday-4',  eventType: 'birthday', name: 'Minimalist Chic',  style: 'Clean & Simple',       previewImage: '/templates/birthday/4.jpg',  accent: '#c4b5a0' },
  { id: 'bday-5',  eventType: 'birthday', name: 'Pastel Dream',     style: 'Soft & Playful',       previewImage: '/templates/birthday/5.jpg',  accent: '#f0c987' },
  { id: 'bday-6',  eventType: 'birthday', name: 'Starry Night',     style: 'Celestial & Dreamy',   previewImage: '/templates/birthday/6.jpg',  accent: '#2c3e50' },
  { id: 'bday-7',  eventType: 'birthday', name: 'Tropical Fiesta',  style: 'Vibrant & Fun',        previewImage: '/templates/birthday/7.jpg',  accent: '#e67e22' },
  { id: 'bday-8',  eventType: 'birthday', name: 'Rustic Wood',      style: 'Warm & Natural',       previewImage: '/templates/birthday/8.jpg',  accent: '#b5651d' },
  { id: 'bday-9',  eventType: 'birthday', name: 'Midnight Luxe',    style: 'Dark & Sophisticated', previewImage: '/templates/birthday/9.jpg',  accent: '#9b59b6' },
  { id: 'bday-10', eventType: 'birthday', name: 'Confetti Pop',     style: 'Bright & Festive',     previewImage: '/templates/birthday/10.jpg', accent: '#e8a87c' },

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

  // ── Housewarming (3 templates) ─────────────────────────────────────────
  { id: 'house-1', eventType: 'housewarming', name: 'New Beginnings',  style: 'Warm & Inviting',      previewImage: '/templates/housewarming/1.jpg', accent: '#c4a882' },
  { id: 'house-2', eventType: 'housewarming', name: 'Home Sweet Home', style: 'Rustic & Cozy',         previewImage: '/templates/housewarming/2.jpg', accent: '#b5651d' },
  { id: 'house-3', eventType: 'housewarming', name: 'Welcome Home',    style: 'Modern & Minimal',      previewImage: '/templates/housewarming/3.jpg', accent: '#9cb092' },

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
