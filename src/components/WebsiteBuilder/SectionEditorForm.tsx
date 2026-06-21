import { api } from '@/lib/api';
import type { WebsiteSection, ScheduleItem, FaqItem, SectionContent } from './types';

interface SectionEditorFormProps {
  section: WebsiteSection;
  onChange: (content: SectionContent) => void;
}

const inputClass =
  'w-full bg-[#192116] border border-white/[0.1] text-[#e4eee1] text-sm px-2.5 py-1.5 focus:outline-none focus:border-[#9cb092]/50';
const labelClass = 'font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 block mb-1.5 mt-4';

export default function SectionEditorForm({ section, onChange }: SectionEditorFormProps) {
  const set = (patch: Partial<SectionContent>) => onChange({ ...section.content, ...patch });

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const uploaded = await api.uploadMedia(file);
      set({ coverImageUrl: uploaded.public_url });
    } catch (err) {
      console.error('Cover upload failed', err);
    }
  };

  if (section.type === 'hero') {
    return (
      <div>
        <label className={labelClass}>Heading</label>
        <input className={inputClass} value={section.content.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
        <label className={labelClass}>Subtitle</label>
        <input className={inputClass} value={section.content.subtitle || ''} onChange={(e) => set({ subtitle: e.target.value })} />
        <label className={labelClass}>Date</label>
        <input className={inputClass} value={section.content.date || ''} onChange={(e) => set({ date: e.target.value })} />
        <label className={labelClass}>Cover Image</label>
        <input type="file" accept="image/*" className="text-xs text-[#b2c3b1]/70" onChange={handleCoverUpload} />
      </div>
    );
  }

  if (section.type === 'our_story' || section.type === 'custom_text') {
    return (
      <div>
        <label className={labelClass}>Heading</label>
        <input className={inputClass} value={section.content.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
        <label className={labelClass}>Text</label>
        <textarea
          className={`${inputClass} h-32 resize-none`}
          value={section.content.body || ''}
          onChange={(e) => set({ body: e.target.value })}
        />
      </div>
    );
  }

  if (section.type === 'schedule') {
    const items = (section.content.items as ScheduleItem[]) || [];
    return (
      <div>
        <label className={labelClass}>Heading</label>
        <input className={inputClass} value={section.content.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
        <label className={labelClass}>Items</label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="border border-white/[0.08] p-2 space-y-1.5">
              <input
                className={inputClass}
                placeholder="Event name"
                value={item.name}
                onChange={(e) => set({ items: items.map((it, idx) => (idx === i ? { ...it, name: e.target.value } : it)) })}
              />
              <input
                className={inputClass}
                placeholder="Time"
                value={item.time}
                onChange={(e) => set({ items: items.map((it, idx) => (idx === i ? { ...it, time: e.target.value } : it)) })}
              />
              <input
                className={inputClass}
                placeholder="Location"
                value={item.location}
                onChange={(e) => set({ items: items.map((it, idx) => (idx === i ? { ...it, location: e.target.value } : it)) })}
              />
              <button
                onClick={() => set({ items: items.filter((_, idx) => idx !== i) })}
                className="text-[10px] text-[#b2c3b1]/50 hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => set({ items: [...items, { name: '', time: '', location: '' }] })}
            className="w-full py-1.5 border border-dashed border-[#9cb092]/30 text-[#9cb092] text-[11px] hover:border-[#9cb092]"
          >
            + Add schedule item
          </button>
        </div>
      </div>
    );
  }

  if (section.type === 'faq') {
    const items = (section.content.items as FaqItem[]) || [];
    return (
      <div>
        <label className={labelClass}>Heading</label>
        <input className={inputClass} value={section.content.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
        <label className={labelClass}>Questions</label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="border border-white/[0.08] p-2 space-y-1.5">
              <input
                className={inputClass}
                placeholder="Question"
                value={item.question}
                onChange={(e) => set({ items: items.map((it, idx) => (idx === i ? { ...it, question: e.target.value } : it)) })}
              />
              <textarea
                className={`${inputClass} h-16 resize-none`}
                placeholder="Answer"
                value={item.answer}
                onChange={(e) => set({ items: items.map((it, idx) => (idx === i ? { ...it, answer: e.target.value } : it)) })}
              />
              <button
                onClick={() => set({ items: items.filter((_, idx) => idx !== i) })}
                className="text-[10px] text-[#b2c3b1]/50 hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => set({ items: [...items, { question: '', answer: '' }] })}
            className="w-full py-1.5 border border-dashed border-[#9cb092]/30 text-[#9cb092] text-[11px] hover:border-[#9cb092]"
          >
            + Add question
          </button>
        </div>
      </div>
    );
  }

  if (section.type === 'map') {
    return (
      <div>
        <label className={labelClass}>Heading</label>
        <input className={inputClass} value={section.content.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
        <label className={labelClass}>Address</label>
        <input className={inputClass} value={section.content.address || ''} onChange={(e) => set({ address: e.target.value })} />
        <label className={labelClass}>Map Embed URL (optional)</label>
        <input className={inputClass} value={section.content.mapEmbedUrl || ''} onChange={(e) => set({ mapEmbedUrl: e.target.value })} />
      </div>
    );
  }

  if (section.type === 'rsvp' || section.type === 'gallery') {
    return (
      <div>
        <label className={labelClass}>Heading</label>
        <input className={inputClass} value={section.content.heading || ''} onChange={(e) => set({ heading: e.target.value })} />
        {section.type === 'rsvp' && (
          <>
            <label className={labelClass}>Message</label>
            <textarea
              className={`${inputClass} h-20 resize-none`}
              value={section.content.body || ''}
              onChange={(e) => set({ body: e.target.value })}
            />
          </>
        )}
        {section.type === 'gallery' && (
          <p className="font-display text-[9px] tracking-[0.18em] text-[#b2c3b1]/40 mt-2">
            This section will automatically show guest-shared photos once that feature is enabled for this event.
          </p>
        )}
      </div>
    );
  }

  return null;
}
