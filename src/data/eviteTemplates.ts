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
  // Birthday
  { id: 'bday-1', eventType: 'birthday', name: 'Golden Hour', style: 'Elegant & Warm', previewImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=560&fit=crop', accent: '#e8a87c' },
  { id: 'bday-2', eventType: 'birthday', name: 'Neon Glow', style: 'Bold & Modern', previewImage: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=560&fit=crop', accent: '#ff6b6b' },
  { id: 'bday-3', eventType: 'birthday', name: 'Garden Party', style: 'Floral & Fresh', previewImage: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400&h=560&fit=crop', accent: '#a8d5ba' },
  { id: 'bday-4', eventType: 'birthday', name: 'Minimalist Chic', style: 'Clean & Simple', previewImage: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=560&fit=crop', accent: '#c4b5a0' },

  // Marriage
  { id: 'wed-1', eventType: 'marriage', name: 'Classic Romance', style: 'Timeless & Elegant', previewImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=560&fit=crop', accent: '#c4a882' },
  { id: 'wed-2', eventType: 'marriage', name: 'Botanical Dream', style: 'Lush & Natural', previewImage: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=560&fit=crop', accent: '#7d9b76' },
  { id: 'wed-3', eventType: 'marriage', name: 'Modern Luxe', style: 'Sleek & Sophisticated', previewImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=560&fit=crop', accent: '#1a1a2e' },
  { id: 'wed-4', eventType: 'marriage', name: 'Rustic Charm', style: 'Warm & Earthy', previewImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&h=560&fit=crop', accent: '#b5651d' },

  // Baby Shower
  { id: 'baby-1', eventType: 'babyshower', name: 'Soft Clouds', style: 'Dreamy & Pastel', previewImage: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=560&fit=crop', accent: '#b5d8eb' },
  { id: 'baby-2', eventType: 'babyshower', name: 'Little Safari', style: 'Playful & Fun', previewImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=560&fit=crop', accent: '#f0c987' },
  { id: 'baby-3', eventType: 'babyshower', name: 'Bloom & Grow', style: 'Floral & Soft', previewImage: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&h=560&fit=crop', accent: '#e8b4b8' },
  { id: 'baby-4', eventType: 'babyshower', name: 'Storybook', style: 'Whimsical & Sweet', previewImage: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=560&fit=crop', accent: '#d4c5a9' },

  // Bride to Be
  { id: 'bride-1', eventType: 'bridetobe', name: 'Blush & Gold', style: 'Glam & Feminine', previewImage: 'https://images.unsplash.com/photo-1519657337289-077653f724ed?w=400&h=560&fit=crop', accent: '#d4a5a5' },
  { id: 'bride-2', eventType: 'bridetobe', name: 'Champagne Toast', style: 'Bubbly & Chic', previewImage: 'https://images.unsplash.com/photo-1470338745628-171cf53de3a8?w=400&h=560&fit=crop', accent: '#c9b037' },
  { id: 'bride-3', eventType: 'bridetobe', name: 'Boho Bride', style: 'Free-spirited & Natural', previewImage: 'https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=400&h=560&fit=crop', accent: '#c4a882' },
  { id: 'bride-4', eventType: 'bridetobe', name: 'Rose Garden', style: 'Romantic & Soft', previewImage: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=400&h=560&fit=crop', accent: '#e8b4b8' },

  // Gender Reveal
  { id: 'gender-1', eventType: 'genderreveal', name: 'Pink or Blue', style: 'Classic & Fun', previewImage: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?w=400&h=560&fit=crop', accent: '#b5c7e3' },
  { id: 'gender-2', eventType: 'genderreveal', name: 'Twinkle Stars', style: 'Celestial & Dreamy', previewImage: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=400&h=560&fit=crop', accent: '#2c3e50' },
  { id: 'gender-3', eventType: 'genderreveal', name: 'He or She', style: 'Playful & Bold', previewImage: 'https://images.unsplash.com/photo-1518556991616-b220543d5ae7?w=400&h=560&fit=crop', accent: '#9b59b6' },
  { id: 'gender-4', eventType: 'genderreveal', name: 'Little Peanut', style: 'Cute & Cozy', previewImage: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=560&fit=crop', accent: '#f0c987' },
];
