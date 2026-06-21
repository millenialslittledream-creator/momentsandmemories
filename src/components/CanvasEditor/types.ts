export interface TextElementData {
  id: string;
  type: 'text';
  x: number;
  y: number;
  width: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: 'normal' | 'italic' | 'bold' | 'italic bold';
  textDecoration: 'none' | 'underline';
  fill: string;
  align: 'left' | 'center' | 'right';
}

export interface ImageElementData {
  id: string;
  type: 'image';
  mediaKind: 'image' | 'video';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  src: string;
}

export type CanvasElementData = TextElementData | ImageElementData;

export interface CanvasBackground {
  type: 'color' | 'image';
  value: string;
}

export const FONT_CATEGORIES: { label: string; fonts: string[] }[] = [
  {
    label: 'Serif & Display',
    fonts: ['Playfair Display', 'Cormorant Garamond', 'Cormorant', 'EB Garamond', 'Libre Baskerville', 'Lora', 'Marcellus', 'Crimson Text'],
  },
  {
    label: 'Script & Calligraphy',
    fonts: ['Great Vibes', 'Parisienne', 'Allura', 'Pinyon Script', 'Marck Script'],
  },
  {
    label: 'Sans-Serif',
    fonts: ['Montserrat', 'Inter', 'Raleway', 'Poppins'],
  },
];

export const FONT_OPTIONS = FONT_CATEGORIES.flatMap((c) => c.fonts);

export const COLOR_SWATCHES = [
  '#1a1a1a', '#9cb092', '#c47a55', '#a8893d', '#7c8a6f',
  '#e4eee1', '#d9a679', '#5c4033', '#3a4a3a', '#b08968',
];

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}
