// Themeable section blocks composed by the bespoke designs. Each design brings
// its own hero, cover and decorative motif (the parts users actually notice);
// these lower sections are shared but offer distinct visual *variants* so no two
// designs render the schedule / gallery / rsvp the same way.
import type { InviteTheme } from '../WebsiteTemplates/themes';
import type { InviteContent } from '../WebsiteTemplates/inviteContent';
import { Reveal, Divider, Countdown } from './eventParts';

type T = InviteTheme;

const headStyle = (t: T) => ({ color: t.accent, fontFamily: `'${t.headingFont}', serif` });

export function SectionHead({ theme, title, light = false }: { theme: T; title: string; light?: boolean }) {
  return (
    <Reveal>
      <h2 className="text-3xl text-center" style={{ color: light ? theme.surface : theme.accent, fontFamily: `'${theme.headingFont}', serif` }}>
        {title}
      </h2>
      <Divider ornament={theme.ornament} color={theme.gold} />
    </Reveal>
  );
}

export function CountdownBlock({ theme, content, label, bg }: { theme: T; content: InviteContent; label: string; bg?: string }) {
  return (
    <section className="px-5 py-11 text-center" style={{ background: bg ?? theme.surfaceAlt }}>
      <Reveal>
        <p className="text-[9px] uppercase tracking-[0.36em] mb-4" style={{ color: theme.muted }}>{label}</p>
        <Countdown dateISO={content.dateISO} theme={theme} />
      </Reveal>
    </section>
  );
}

export function StoryBlock({ theme, content, bg, variant = 'centered' }: { theme: T; content: InviteContent; bg?: string; variant?: 'centered' | 'quote' }) {
  return (
    <section className="px-6 py-12 text-center" style={{ background: bg ?? theme.surface }}>
      <SectionHead theme={theme} title={content.storyTitle} />
      <Reveal delay={80}>
        {variant === 'quote' && (
          <div className="text-[4.5rem] leading-none -mt-3 mb-1 opacity-20" style={{ color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>“</div>
        )}
        <p className="mx-auto max-w-md leading-[1.95] text-[13px]" style={{ color: theme.ink }}>{content.storyBody}</p>
      </Reveal>
    </section>
  );
}

type EventsVariant = 'card-left' | 'bubble' | 'timeline' | 'numbered' | 'ticket';
export function EventsBlock({ theme, content, bg, variant = 'card-left' }: { theme: T; content: InviteContent; bg?: string; variant?: EventsVariant }) {
  const head = headStyle(theme);
  return (
    <section className="px-5 py-12" style={{ background: bg ?? theme.surface }}>
      <SectionHead theme={theme} title={content.eventsTitle} />
      <div className={`mx-auto max-w-sm ${variant === 'timeline' ? '' : 'space-y-3'}`} style={variant === 'timeline' ? { borderLeft: `2px solid ${theme.gold}55`, paddingLeft: 18 } : undefined}>
        {content.events.map((ev, i) => {
          const meta = `${ev.date} · ${ev.time}`;
          if (variant === 'bubble') return (
            <Reveal key={i} delay={i * 90} variant={i % 2 ? 'right' : 'left'}>
              <div className="px-5 py-4" style={{ background: theme.surface, borderRadius: 22, boxShadow: `0 8px 22px ${theme.accent}18` }}>
                <p className="text-[9px] uppercase tracking-[0.22em]" style={{ color: theme.gold }}>{meta}</p>
                <p className="text-xl mt-0.5" style={head}>{ev.name}</p>
                <p className="text-[12px]" style={{ color: theme.muted }}>{ev.venue}</p>
              </div>
            </Reveal>
          );
          if (variant === 'timeline') return (
            <Reveal key={i} delay={i * 90}>
              <div className="relative pb-6">
                <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full" style={{ background: theme.gold, boxShadow: `0 0 0 4px ${theme.surface}` }} />
                <p className="text-[9px] uppercase tracking-[0.22em]" style={{ color: theme.gold }}>{meta}</p>
                <p className="text-xl mt-0.5" style={head}>{ev.name}</p>
                <p className="text-[12px]" style={{ color: theme.muted }}>{ev.venue}</p>
              </div>
            </Reveal>
          );
          if (variant === 'numbered') return (
            <Reveal key={i} delay={i * 90} variant="left">
              <div className="flex items-center gap-4 px-2 py-3" style={{ borderBottom: `1px solid ${theme.gold}2e` }}>
                <span className="text-3xl leading-none opacity-70" style={{ color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-xl" style={head}>{ev.name}</p>
                  <p className="text-[11px]" style={{ color: theme.muted }}>{meta} · {ev.venue}</p>
                </div>
              </div>
            </Reveal>
          );
          if (variant === 'ticket') return (
            <Reveal key={i} delay={i * 90} variant="scale">
              <div className="flex items-stretch overflow-hidden" style={{ background: theme.surface, border: `1px solid ${theme.gold}44` }}>
                <div className="flex flex-col items-center justify-center px-4" style={{ background: theme.accent, color: theme.surface }}>
                  <span className="text-[9px] uppercase tracking-[0.2em] opacity-80">{ev.date.split(',')[0]}</span>
                  <span className="text-lg leading-none" style={{ fontFamily: `'${theme.headingFont}', serif` }}>{ev.time.replace(/\s?[AP]M/i, '')}</span>
                </div>
                <div className="px-4 py-3 flex-1">
                  <p className="text-lg" style={head}>{ev.name}</p>
                  <p className="text-[11px]" style={{ color: theme.muted }}>{ev.venue}</p>
                </div>
              </div>
            </Reveal>
          );
          // card-left (default)
          return (
            <Reveal key={i} delay={i * 90}>
              <div style={{ borderLeft: `3px solid ${theme.gold}`, background: `linear-gradient(90deg, ${theme.gold}0d, transparent 80%)` }}>
                <div className="px-4 py-3.5">
                  <p className="text-[9px] uppercase tracking-[0.22em]" style={{ color: theme.gold }}>{meta}</p>
                  <p className="text-xl mt-0.5" style={head}>{ev.name}</p>
                  <p className="text-[12px]" style={{ color: theme.muted }}>{ev.venue}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

type GalleryVariant = 'grid' | 'polaroid' | 'rounded' | 'strip';
export function GalleryBlock({ theme, content, bg, variant = 'grid' }: { theme: T; content: InviteContent; bg?: string; variant?: GalleryVariant }) {
  const ROTS = [-2.6, 1.9, -1.5, 2.4];
  if (variant === 'strip') return (
    <section className="py-12" style={{ background: bg ?? theme.surfaceAlt }}>
      <div className="px-5"><SectionHead theme={theme} title={content.galleryTitle} /></div>
      <div data-lenis-prevent className="flex gap-3 overflow-x-auto px-5 pb-3 scrollbar-subtle snap-x">
        {content.galleryImages.map((src, i) => (
          <div key={i} className="snap-center shrink-0" style={{ width: 190 }}>
            <img src={src} alt="" className="w-full aspect-[3/4] object-cover" style={{ boxShadow: `0 8px 22px ${theme.accent}22` }} />
          </div>
        ))}
      </div>
    </section>
  );
  return (
    <section className="px-5 py-12" style={{ background: bg ?? theme.surfaceAlt }}>
      <SectionHead theme={theme} title={content.galleryTitle} />
      <div className="grid grid-cols-2 gap-3 mx-auto max-w-xs">
        {content.galleryImages.map((src, i) => {
          if (variant === 'polaroid') return (
            <Reveal key={i} delay={i * 70} variant="scale">
              <div style={{ background: '#fffef9', padding: '6px 6px 26px', transform: `rotate(${ROTS[i % 4]}deg)`, boxShadow: '0 4px 18px rgba(0,0,0,.14)' }}>
                <img src={src} alt="" className="w-full aspect-square object-cover block" />
              </div>
            </Reveal>
          );
          const radius = variant === 'rounded' ? 20 : 0;
          return (
            <Reveal key={i} delay={i * 70} variant="scale">
              <div style={{ borderRadius: radius, overflow: 'hidden', boxShadow: `0 8px 20px ${theme.accent}22` }}>
                <img src={src} alt="" className="w-full aspect-square object-cover" />
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function VenueBlock({ theme, content, bg, pill = false }: { theme: T; content: InviteContent; bg?: string; pill?: boolean }) {
  const head = headStyle(theme);
  return (
    <section className="px-6 py-12 text-center" style={{ background: bg ?? theme.surface }}>
      <SectionHead theme={theme} title={content.venueTitle} />
      <Reveal delay={60}>
        <p className="text-lg" style={head}>{content.venueName}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: theme.muted }}>{content.venueAddress}</p>
        <a href={content.mapUrl} target="_blank" rel="noreferrer"
          className="inline-block mt-6 px-8 py-2.5 text-[10px] uppercase tracking-[0.28em]"
          style={{ border: `1px solid ${theme.accent}`, color: theme.accent, borderRadius: pill ? 999 : 0 }}>
          View on Map
        </a>
      </Reveal>
    </section>
  );
}

export function RsvpBlock({ theme, content, pill = false }: { theme: T; content: InviteContent; pill?: boolean }) {
  return (
    <section className="px-6 py-16 text-center" style={{ background: theme.deep }}>
      <SectionHead theme={theme} title={content.rsvpTitle} light />
      <Reveal delay={60}>
        <p className="mx-auto max-w-xs text-[13px]" style={{ color: `${theme.surface}cc` }}>{content.rsvpNote}</p>
        <a href={`tel:${content.rsvpContact}`}
          className="inline-block mt-6 px-9 py-3 text-[11px] uppercase tracking-[0.26em]"
          style={{ background: theme.gold, color: theme.deep, borderRadius: pill ? 999 : 0 }}>
          RSVP · {content.rsvpContact}
        </a>
      </Reveal>
    </section>
  );
}

export function FooterBlock({ theme, content }: { theme: T; content: InviteContent }) {
  return (
    <footer className="px-6 py-10 text-center" style={{ background: theme.deep, borderTop: `1px solid ${theme.gold}22` }}>
      <p className="text-4xl" style={{ fontFamily: `'${theme.scriptFont}', cursive`, color: theme.gold }}>{content.monogram}</p>
      <p className="mt-2 text-[11px] tracking-[0.12em]" style={{ color: `${theme.surface}99` }}>{content.footerNote}</p>
    </footer>
  );
}
