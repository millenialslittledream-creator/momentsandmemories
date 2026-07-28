import { useState, useRef } from 'react';
import { eventTemplate, type EventKey } from './registry';
import type { InviteContent } from '../WebsiteTemplates/inviteContent';
import PremiumPublishBar from '@/components/PremiumPublishBar';

/* field primitives (mirrors the wedding editor styling) -------------------- */
const inputCls =
  'w-full bg-[#10171a] border border-white/12 focus:border-[#c19a4b] text-[#ece5d8] placeholder:text-white/25 px-3 h-9 text-sm rounded-sm outline-none transition-colors';

function Text({ label, value, onChange, area = false }: { label: string; value: string; onChange: (v: string) => void; area?: boolean }) {
  return (
    <label className="block space-y-1">
      <span className="text-[9px] uppercase tracking-[0.18em] text-[#9bb3a3]">{label}</span>
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={`${inputCls} h-auto py-2 resize-none leading-relaxed`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}
    </label>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1">
      <span className="text-[9px] uppercase tracking-[0.18em] text-[#9bb3a3]">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-12 h-12 flex-shrink-0 overflow-hidden border border-white/12 bg-[#10171a]">
          {value && <img src={value} alt="" className="w-full h-full object-cover" />}
        </div>
        <button onClick={() => ref.current?.click()} className="flex-1 h-9 text-[10px] uppercase tracking-[0.18em] border border-white/15 text-[#c19a4b] hover:border-[#c19a4b]/60 transition-colors">
          Replace image
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(URL.createObjectURL(f)); e.currentTarget.value = ''; }} />
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-t border-white/[0.07] pt-4">
      <p className="text-[10px] uppercase tracking-[0.28em] text-[#c19a4b]">{title}</p>
      {children}
    </div>
  );
}

/* editor ------------------------------------------------------------------- */
export default function EventInviteEditor({
  eventKey, initialDesignId, onBack,
}: {
  eventKey: EventKey; initialDesignId?: string; onBack?: () => void;
}) {
  const def = eventTemplate(eventKey);
  const [designId, setDesignId] = useState(initialDesignId ?? def.designs[0].id);
  const [themeId, setThemeId] = useState(def.themes[0].id);
  const [content, setContent] = useState<InviteContent>(def.defaultContent);

  const theme = def.themes.find((t) => t.id === themeId) ?? def.themes[0];
  const Design = (def.designs.find((d) => d.id === designId) ?? def.designs[0]).Component;

  const set = <K extends keyof InviteContent>(k: K, v: InviteContent[K]) => setContent((c) => ({ ...c, [k]: v }));
  const setEvent = (i: number, k: keyof InviteContent['events'][number], v: string) =>
    setContent((c) => ({ ...c, events: c.events.map((e, j) => (j === i ? { ...e, [k]: v } : e)) }));
  const setGallery = (i: number, url: string) =>
    setContent((c) => ({ ...c, galleryImages: c.galleryImages.map((g, j) => (j === i ? url : g)) }));

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0c1013]">
      {/* top bar */}
      <div className="flex items-center justify-between gap-4 px-5 py-2.5 border-b border-white/[0.07] bg-[#10161a] flex-wrap">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 border border-white/12 text-[#9bb3a3] hover:text-[#c19a4b] hover:border-[#c19a4b]/40 transition-all text-[10px] uppercase tracking-[0.18em]">
              <span className="material-icons text-sm">arrow_back</span>Back
            </button>
          )}
          <span className="material-icons text-[#c19a4b] text-lg">{def.icon}</span>
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#9bb3a3]">{def.label} Website</p>
            <p className="text-sm text-[#ece5d8] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Design your shareable link</p>
          </div>
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#9bb3a3] mr-1 hidden lg:block">Design</span>
            {def.designs.map((d) => (
              <button key={d.id} onClick={() => setDesignId(d.id)} title={d.blurb}
                className={`px-2.5 py-1.5 rounded-sm border text-[10px] tracking-wide transition-all ${designId === d.id ? 'border-[#c19a4b] bg-[#c19a4b]/10 text-[#ece5d8]' : 'border-white/12 text-[#9bb3a3] hover:border-white/25'}`}>
                {d.name}
              </button>
            ))}
          </div>
          <span className="h-6 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#9bb3a3] mr-1 hidden lg:block">Theme</span>
            {def.themes.map((t) => (
              <button key={t.id} onClick={() => setThemeId(t.id)} title={t.name}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-sm border transition-all ${themeId === t.id ? 'border-[#c19a4b] bg-white/[0.04]' : 'border-white/12 hover:border-white/25'}`}>
                <span className="flex gap-0.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: t.accent }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: t.gold }} />
                  <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: t.surface }} />
                </span>
                <span className="text-[10px] tracking-wide text-[#ece5d8] hidden xl:block">{t.name}</span>
              </button>
            ))}
          </div>

          <span className="h-6 w-px bg-white/10 hidden sm:block" />
          <PremiumPublishBar
            eventKey={eventKey}
            designId={designId}
            themeId={themeId}
            content={content}
            slugSeed={def.label}
          />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* LEFT — live preview in a device frame */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-6 overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 30%, #16201f, #0c1013)' }}>
          <div className="relative" style={{ aspectRatio: '390 / 844', height: 844, maxHeight: '100%', maxWidth: '100%' }}>
            <div className="absolute inset-0 rounded-[44px] overflow-hidden shadow-2xl" style={{ border: '10px solid #1b2227' }}>
              <Design theme={theme} content={content} autoOpen={false} key={designId} />
            </div>
          </div>
        </div>

        {/* RIGHT — content fields */}
        <div data-lenis-prevent className="w-[340px] md:w-[380px] flex-shrink-0 border-l border-white/[0.07] bg-[#10161a] overflow-y-auto px-5 py-5 space-y-4">
          <Group title="The Headline">
            <Text label={def.fieldLabels.primaryName} value={content.brideName} onChange={(v) => set('brideName', v)} />
            {def.fieldLabels.secondaryName && (
              <Text label={def.fieldLabels.secondaryName} value={content.groomName} onChange={(v) => set('groomName', v)} />
            )}
            <Text label={def.fieldLabels.monogram} value={content.monogram} onChange={(v) => set('monogram', v)} />
            <Text label="Invitation line" value={content.intro} onChange={(v) => set('intro', v)} area />
            <Text label="Date label" value={content.dateLabel} onChange={(v) => set('dateLabel', v)} />
            <Text label="Date & time (for countdown)" value={content.dateISO} onChange={(v) => set('dateISO', v)} />
            <ImageField label="Hero photo" value={content.heroImageUrl} onChange={(v) => set('heroImageUrl', v)} />
          </Group>

          <Group title="The Story">
            <Text label="Heading" value={content.storyTitle} onChange={(v) => set('storyTitle', v)} />
            <Text label="Story" value={content.storyBody} onChange={(v) => set('storyBody', v)} area />
          </Group>

          <Group title="Schedule">
            <Text label="Heading" value={content.eventsTitle} onChange={(v) => set('eventsTitle', v)} />
            {content.events.map((ev, i) => (
              <div key={i} className="space-y-2 p-2.5 rounded-sm bg-[#0c1013] border border-white/[0.06]">
                <div className="grid grid-cols-2 gap-2">
                  <Text label="Item" value={ev.name} onChange={(v) => setEvent(i, 'name', v)} />
                  <Text label="Date" value={ev.date} onChange={(v) => setEvent(i, 'date', v)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Text label="Time" value={ev.time} onChange={(v) => setEvent(i, 'time', v)} />
                  <Text label="Venue" value={ev.venue} onChange={(v) => setEvent(i, 'venue', v)} />
                </div>
              </div>
            ))}
          </Group>

          <Group title="Gallery">
            <Text label="Heading" value={content.galleryTitle} onChange={(v) => set('galleryTitle', v)} />
            <div className="grid grid-cols-2 gap-2">
              {content.galleryImages.map((g, i) => (
                <ImageField key={i} label={`Photo ${i + 1}`} value={g} onChange={(url) => setGallery(i, url)} />
              ))}
            </div>
          </Group>

          <Group title="Venue">
            <Text label="Heading" value={content.venueTitle} onChange={(v) => set('venueTitle', v)} />
            <Text label="Venue name" value={content.venueName} onChange={(v) => set('venueName', v)} />
            <Text label="Address" value={content.venueAddress} onChange={(v) => set('venueAddress', v)} area />
            <Text label="Map link" value={content.mapUrl} onChange={(v) => set('mapUrl', v)} />
          </Group>

          <Group title="RSVP">
            <Text label="Heading" value={content.rsvpTitle} onChange={(v) => set('rsvpTitle', v)} />
            <Text label="Note" value={content.rsvpNote} onChange={(v) => set('rsvpNote', v)} area />
            <Text label="Contact" value={content.rsvpContact} onChange={(v) => set('rsvpContact', v)} />
          </Group>

          <Group title="Footer">
            <Text label="Sign-off" value={content.footerNote} onChange={(v) => set('footerNote', v)} />
          </Group>
        </div>
      </div>
    </div>
  );
}
