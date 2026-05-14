/**
 * Loads the 12 curated Google Fonts used by the evite text overlay.
 * One <link> tag injected on first call; idempotent.
 */
const FONT_SPECS = [
  'Italiana',
  'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500',
  'Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700',
  'Bodoni+Moda:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700',
  'Cinzel:wght@400;500;600;700;800;900',
  'DM+Serif+Display:ital@0;1',
  'Abril+Fatface',
  'Tenor+Sans',
  'Inter:wght@300;400;500;600;700',
  'Allura',
  'Great+Vibes',
  'Sacramento',
];

let loaded = false;

export function loadEviteFonts(): void {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;

  // Preconnect for faster font fetches
  const pre1 = document.createElement('link');
  pre1.rel = 'preconnect';
  pre1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(pre1);

  const pre2 = document.createElement('link');
  pre2.rel = 'preconnect';
  pre2.href = 'https://fonts.gstatic.com';
  pre2.crossOrigin = '';
  document.head.appendChild(pre2);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?' +
    FONT_SPECS.map((f) => `family=${f}`).join('&') +
    '&display=swap';
  document.head.appendChild(link);
}
