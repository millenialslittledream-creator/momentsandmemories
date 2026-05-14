import { useEffect, useState } from 'react';
import { eviteTemplates, type EviteTemplate } from '@/data/eviteTemplates';
import type { TemplateLayout } from '@/lib/templateLayouts';
import { layoutCapacity } from '@/lib/templateCapacity';

interface Props {
  currentLength: number;
  maxChars: number;
  currentTemplateId: string | null;
  layouts: Record<string, TemplateLayout>;
  /** Called when user picks an alternate template that fits. */
  onPickTemplate: (templateId: string) => void;
}

/**
 * Inline warning + "designs that fit" picker for the custom-message field.
 * Renders nothing when the text is within the template's limit.
 */
export default function MessageOverflow({
  currentLength,
  maxChars,
  currentTemplateId,
  layouts,
  onPickTemplate,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const overshoot = currentLength - maxChars;

  // Templates whose custom_message capacity >= currentLength
  const [fits, setFits] = useState<EviteTemplate[]>([]);
  useEffect(() => {
    if (!showPicker) return;
    const list: EviteTemplate[] = [];
    for (const t of eviteTemplates) {
      if (t.id === currentTemplateId) continue;
      const cap = layoutCapacity(layouts[t.id]);
      const m = cap.custom_message;
      if (m && m >= currentLength) list.push(t);
    }
    setFits(list);
  }, [showPicker, currentLength, currentTemplateId, layouts]);

  if (overshoot <= 0) return null;

  return (
    <div className="mt-1 space-y-1">
      <p className="font-display text-[10px] text-yellow-400/80 tracking-wide">
        {overshoot} characters over this design's limit ({currentLength}/{maxChars}). Text
        beyond {maxChars} may be clipped or shrink awkwardly.
      </p>
      <button
        type="button"
        onClick={() => setShowPicker((v) => !v)}
        className="font-display text-[10px] tracking-[0.15em] uppercase text-[#9cb092] hover:text-[#adc4a3]"
      >
        {showPicker ? '× hide' : 'see designs that fit →'}
      </button>

      {showPicker && (
        <div className="mt-2 border border-white/10 bg-white/[0.03] p-3">
          {fits.length === 0 ? (
            <p className="font-display text-[10px] text-[#b2c3b1]/60">
              No annotated designs fit a {currentLength}-character message yet. You can shorten
              your message, or the message will be clipped on this design.
            </p>
          ) : (
            <>
              <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/60 mb-2">
                {fits.length} {fits.length === 1 ? 'design' : 'designs'} fit
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                {fits.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onPickTemplate(t.id);
                      setShowPicker(false);
                    }}
                    className="group relative aspect-[3/4] overflow-hidden border border-white/10 hover:border-[#9cb092] transition-colors"
                  >
                    <img
                      src={t.previewImage}
                      alt={t.name}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                      <p className="font-display text-[8px] tracking-wide text-white/80 truncate">
                        {t.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
