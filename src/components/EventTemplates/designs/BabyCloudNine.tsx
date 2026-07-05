import { useEffect, useState } from 'react';
import {
  AnimStyles, EventAnimStyles, Reveal, Divider, Countdown,
  Clouds, FloatingOrbs, TapCover, type DesignProps,
} from '../eventParts';

/* Baby Shower · "Cloud Nine" — a dreamy pastel sky: drifting clouds, rising
   bubbles, soft rounded cards. Tender and whimsical. */
export default function BabyCloudNine({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  const head = { color: theme.accent, fontFamily: `'${theme.headingFont}', serif` };
  const script = { color: theme.accent, fontFamily: `'${theme.scriptFont}', cursive` };
  const orbHues = [theme.accentSoft, theme.gold, theme.surfaceAlt];

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles />
      <EventAnimStyles />

      {!opened && (
        <TapCover
          bg={`linear-gradient(180deg, ${theme.deep} 0%, ${theme.accent} 55%, ${theme.accentSoft} 100%)`}
          accent={theme.surface} gold={theme.gold}
          label="A Little One Is On The Way" title={content.brideName}
          sub={content.dateLabel} hint="Tap to open" icon="☁️"
          onOpen={() => setOpened(true)}
          ornaments={<Clouds tint={theme.surface} count={6} />}
        />
      )}

      <div
        data-lenis-prevent
        className="h-full overflow-y-auto scroll-smooth"
        style={{
          background: theme.surface, color: theme.ink,
          fontFamily: `'${theme.bodyFont}', serif`,
          opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms',
        }}>

        {/* HERO — sky with clouds + floating photo cloud */}
        <section className="relative px-5 pt-12 pb-14 text-center overflow-hidden"
          style={{ background: `linear-gradient(180deg, ${theme.accentSoft} 0%, ${theme.surface} 100%)` }}>
          <Clouds tint="#ffffff" count={5} />
          <FloatingOrbs colors={orbHues} count={10} />
          <div className="relative">
            <Reveal variant="scale">
              <p className="text-[10px] uppercase tracking-[0.4em] mb-4" style={{ color: theme.muted }}>
                Please join us to shower
              </p>
              <h1 style={{ ...script, fontSize: 'clamp(3rem,16vw,5rem)', lineHeight: 0.9 }}>
                {content.brideName}
              </h1>
              <Divider ornament={theme.ornament} color={theme.gold} />
              <p className="mx-auto max-w-[250px] text-[12.5px] leading-loose italic" style={{ color: theme.muted }}>
                {content.intro}
              </p>
            </Reveal>
            <Reveal delay={140}>
              <div className="mt-8 mx-auto max-w-[240px]"
                style={{ borderRadius: '48% 48% 48% 48% / 60% 60% 40% 40%', overflow: 'hidden', boxShadow: `0 24px 60px ${theme.accent}33`, animation: 'inv-float 6s ease-in-out infinite' }}>
                <img src={content.heroImageUrl} alt="" className="w-full aspect-[4/5] object-cover" />
              </div>
            </Reveal>
            <Reveal delay={80}>
              <p className="mt-6 text-[13px] tracking-[0.16em]" style={head}>{content.dateLabel}</p>
            </Reveal>
          </div>
        </section>

        {/* COUNTDOWN */}
        <section className="px-5 py-11 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <p className="text-[9px] uppercase tracking-[0.36em] mb-4" style={{ color: theme.muted }}>
              Counting down to cuddles
            </p>
            <Countdown dateISO={content.dateISO} theme={theme} />
          </Reveal>
        </section>

        {/* STORY */}
        <section className="px-6 py-12 text-center" style={{ background: theme.surface }}>
          <Reveal>
            <h2 className="text-3xl" style={head}>{content.storyTitle}</h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
            <p className="mx-auto max-w-md leading-[1.95] text-[13px]" style={{ color: theme.ink }}>
              {content.storyBody}
            </p>
          </Reveal>
        </section>

        {/* EVENTS — rounded pastel bubbles */}
        <section className="px-5 py-12" style={{ background: theme.accentSoft }}>
          <Reveal>
            <h2 className="text-3xl text-center" style={head}>{content.eventsTitle}</h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
          </Reveal>
          <div className="space-y-3 mx-auto max-w-sm">
            {content.events.map((ev, i) => (
              <Reveal key={i} delay={i * 90} variant={i % 2 ? 'right' : 'left'}>
                <div className="px-5 py-4" style={{ background: theme.surface, borderRadius: 22, boxShadow: `0 8px 22px ${theme.accent}18` }}>
                  <p className="text-[9px] uppercase tracking-[0.22em]" style={{ color: theme.gold }}>
                    {ev.date} · {ev.time}
                  </p>
                  <p className="text-xl mt-0.5" style={head}>{ev.name}</p>
                  <p className="text-[12px]" style={{ color: theme.muted }}>{ev.venue}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* GALLERY */}
        <section className="px-5 py-12" style={{ background: theme.surface }}>
          <Reveal>
            <h2 className="text-3xl text-center" style={head}>{content.galleryTitle}</h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
          </Reveal>
          <div className="grid grid-cols-2 gap-3 mx-auto max-w-xs">
            {content.galleryImages.map((src, i) => (
              <Reveal key={i} delay={i * 70} variant="scale">
                <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: `0 8px 20px ${theme.accent}22` }}>
                  <img src={src} alt="" className="w-full aspect-square object-cover" />
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* VENUE */}
        <section className="px-6 py-12 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <h2 className="text-3xl" style={head}>{content.venueTitle}</h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
            <p className="text-lg" style={head}>{content.venueName}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: theme.muted }}>{content.venueAddress}</p>
            <a href={content.mapUrl} target="_blank" rel="noreferrer"
              className="inline-block mt-6 px-8 py-2.5 text-[10px] uppercase tracking-[0.28em]"
              style={{ background: theme.accent, color: theme.surface, borderRadius: 999 }}>
              View on Map
            </a>
          </Reveal>
        </section>

        {/* RSVP */}
        <section className="relative px-6 py-16 text-center overflow-hidden" style={{ background: theme.deep }}>
          <FloatingOrbs colors={[theme.accentSoft, theme.gold]} count={8} />
          <Reveal>
            <h2 className="text-3xl relative" style={{ color: theme.surface, fontFamily: `'${theme.headingFont}', serif` }}>
              {content.rsvpTitle}
            </h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
            <p className="mx-auto max-w-xs text-[13px]" style={{ color: `${theme.surface}cc` }}>{content.rsvpNote}</p>
            <a href={`tel:${content.rsvpContact}`}
              className="inline-block mt-6 px-9 py-3 text-[11px] uppercase tracking-[0.24em]"
              style={{ background: theme.gold, color: theme.deep, borderRadius: 999 }}>
              RSVP · {content.rsvpContact}
            </a>
          </Reveal>
        </section>

        <footer className="px-6 py-10 text-center" style={{ background: theme.deep, borderTop: `1px solid ${theme.gold}22` }}>
          <p className="text-4xl">{content.monogram}</p>
          <p className="mt-2 text-[11px] tracking-[0.12em]" style={{ color: `${theme.surface}99` }}>{content.footerNote}</p>
        </footer>
      </div>
    </div>
  );
}
