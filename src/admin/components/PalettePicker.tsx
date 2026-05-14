import { useEffect, useRef, useState } from 'react';

interface PalettePickerProps {
  imageUrl: string;
  selected: string;
  alts: string[];
  onChange: (hex: string) => void;
  onAltsChange: (alts: string[]) => void;
}

const PRESETS = ['#ffffff', '#1a1a1a', '#9cb092', '#d4a5a5', '#c9b037', '#2c3e50', '#e8a87c'];

/**
 * Sample dominant colors from the image and offer them as text-color presets.
 * Computed in-browser, no external service. Falls back to PRESETS on error.
 */
function sampleDominantColors(img: HTMLImageElement, count = 5): string[] {
  try {
    const canvas = document.createElement('canvas');
    const w = 80;
    const h = Math.round((img.naturalHeight / img.naturalWidth) * w);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const buckets: Record<string, number> = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] & 0xf0;
      const g = data[i + 1] & 0xf0;
      const b = data[i + 2] & 0xf0;
      const k = `${r},${g},${b}`;
      buckets[k] = (buckets[k] ?? 0) + 1;
    }
    const top = Object.entries(buckets)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([k]) => {
        const [r, g, b] = k.split(',').map(Number);
        return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
      });
    return top;
  } catch {
    return [];
  }
}

export default function PalettePicker({
  imageUrl,
  selected,
  alts,
  onChange,
  onAltsChange,
}: PalettePickerProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [sampled, setSampled] = useState<string[]>([]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      const colors = sampleDominantColors(img);
      setSampled(colors);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const allSwatches = Array.from(new Set([...alts, ...sampled, ...PRESETS])).slice(0, 12);

  const toggleAlt = (hex: string) => {
    if (alts.includes(hex)) onAltsChange(alts.filter((c) => c !== hex));
    else onAltsChange([...alts, hex]);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/40 mb-2">
          Text color
        </p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={selected}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 bg-transparent border border-white/15 cursor-pointer"
          />
          <input
            type="text"
            value={selected}
            onChange={(e) => onChange(e.target.value)}
            className="bg-white/[0.04] border border-white/10 focus:border-white/30 text-white/90 font-mono text-xs px-2 h-10 w-24 outline-none"
          />
        </div>
      </div>

      <div>
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/40 mb-2">
          Sampled & presets · click to use · alt-click to save as user choice
        </p>
        <div className="flex flex-wrap gap-1.5">
          {allSwatches.map((hex) => {
            const isSelected = hex === selected;
            const isAlt = alts.includes(hex);
            return (
              <button
                key={hex}
                onClick={(e) => {
                  if (e.altKey) toggleAlt(hex);
                  else onChange(hex);
                }}
                title={`${hex}${isAlt ? ' (user choice)' : ''}`}
                style={{ backgroundColor: hex }}
                className={`w-7 h-7 border ${
                  isSelected ? 'border-[#9cb092] ring-1 ring-[#9cb092]' : 'border-white/20'
                } ${isAlt ? 'ring-1 ring-white/50' : ''} hover:scale-110 transition-transform`}
              />
            );
          })}
        </div>
        <p className="font-mono text-[9px] text-white/30 mt-2">
          User-choice swatches ({alts.length}) appear in the public color override on the preview.
        </p>
      </div>
    </div>
  );
}
