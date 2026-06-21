import { FONT_CATEGORIES, COLOR_SWATCHES, type CanvasElementData, type TextElementData } from './types';

interface PropertyPanelProps {
  element: CanvasElementData | null;
  onChange: (id: string, patch: Partial<TextElementData>) => void;
}

function isText(el: CanvasElementData | null): el is TextElementData {
  return !!el && el.type === 'text';
}

export default function PropertyPanel({ element, onChange }: PropertyPanelProps) {
  if (!element) {
    return (
      <div className="w-64 shrink-0 border-l border-white/[0.07] bg-[#141c15] px-4 py-6">
        <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#b2c3b1]/40">
          Select an element to edit
        </p>
      </div>
    );
  }

  if (!isText(element)) {
    return (
      <div className="w-64 shrink-0 border-l border-white/[0.07] bg-[#141c15] px-4 py-6">
        <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092]">
          {element.mediaKind === 'video' ? 'Video' : 'Image'}
        </p>
        <p className="font-display text-[9px] tracking-[0.18em] text-[#b2c3b1]/55 mt-2">
          Drag corners to resize, drag to move, use the rotate handle to rotate.
        </p>
      </div>
    );
  }

  const set = (patch: Partial<TextElementData>) => onChange(element.id, patch);

  return (
    <div className="w-64 shrink-0 border-l border-white/[0.07] bg-[#141c15] px-4 py-5 overflow-y-auto scrollbar-subtle">
      <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092] mb-4">Edit Text</p>

      <label className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 block mb-1.5">
        Font
      </label>
      <select
        value={element.fontFamily}
        onChange={(e) => set({ fontFamily: e.target.value })}
        className="w-full bg-[#192116] border border-white/[0.1] text-[#e4eee1] text-sm px-2.5 py-1.5 mb-4 focus:outline-none focus:border-[#9cb092]/50"
      >
        {FONT_CATEGORIES.map((cat) => (
          <optgroup key={cat.label} label={cat.label}>
            {cat.fonts.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </optgroup>
        ))}
      </select>

      <label className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 block mb-1.5">
        Size
      </label>
      <input
        type="number"
        min={8}
        max={200}
        value={element.fontSize}
        onChange={(e) => set({ fontSize: Number(e.target.value) || element.fontSize })}
        className="w-full bg-[#192116] border border-white/[0.1] text-[#e4eee1] text-sm px-2.5 py-1.5 mb-4 focus:outline-none focus:border-[#9cb092]/50"
      />

      <label className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 block mb-1.5">
        Color
      </label>
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {COLOR_SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => set({ fill: c })}
            aria-label={`Set color ${c}`}
            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
              element.fill === c ? 'border-[#9cb092]' : 'border-white/10'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <input
        type="color"
        value={element.fill}
        onChange={(e) => set({ fill: e.target.value })}
        className="w-full h-8 mb-4 bg-transparent border border-white/[0.1] cursor-pointer"
      />

      <label className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 block mb-1.5">
        Align
      </label>
      <div className="flex gap-1.5 mb-4">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button
            key={a}
            onClick={() => set({ align: a })}
            className={`flex-1 py-1.5 text-[11px] font-display uppercase tracking-wide border transition-colors ${
              element.align === a
                ? 'bg-[#9cb092] text-[#111914] border-[#9cb092]'
                : 'border-white/[0.1] text-[#b2c3b1]/70 hover:border-[#9cb092]/40'
            }`}
          >
            {a[0].toUpperCase()}
          </button>
        ))}
      </div>

      <label className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 block mb-1.5">
        Style
      </label>
      <div className="flex gap-1.5">
        <button
          onClick={() => set({ fontStyle: element.fontStyle.includes('bold') ? element.fontStyle.replace('bold', '').trim() as TextElementData['fontStyle'] || 'normal' : `${element.fontStyle === 'normal' ? '' : element.fontStyle + ' '}bold`.trim() as TextElementData['fontStyle'] })}
          className={`flex-1 py-1.5 text-[11px] font-bold border transition-colors ${
            element.fontStyle.includes('bold')
              ? 'bg-[#9cb092] text-[#111914] border-[#9cb092]'
              : 'border-white/[0.1] text-[#b2c3b1]/70 hover:border-[#9cb092]/40'
          }`}
        >
          B
        </button>
        <button
          onClick={() => set({ fontStyle: element.fontStyle.includes('italic') ? element.fontStyle.replace('italic', '').trim() as TextElementData['fontStyle'] || 'normal' : `italic${element.fontStyle.includes('bold') ? ' bold' : ''}` as TextElementData['fontStyle'] })}
          className={`flex-1 py-1.5 text-[11px] italic border transition-colors ${
            element.fontStyle.includes('italic')
              ? 'bg-[#9cb092] text-[#111914] border-[#9cb092]'
              : 'border-white/[0.1] text-[#b2c3b1]/70 hover:border-[#9cb092]/40'
          }`}
        >
          I
        </button>
        <button
          onClick={() => set({ textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' })}
          className={`flex-1 py-1.5 text-[11px] underline border transition-colors ${
            element.textDecoration === 'underline'
              ? 'bg-[#9cb092] text-[#111914] border-[#9cb092]'
              : 'border-white/[0.1] text-[#b2c3b1]/70 hover:border-[#9cb092]/40'
          }`}
        >
          U
        </button>
      </div>
    </div>
  );
}
