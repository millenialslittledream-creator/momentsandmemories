import { useEffect, useState } from 'react';
import {
  AnimStyles, Reveal, Divider, Countdown, FramedPhoto, WaxSeal,
  type DesignProps,
} from '../inviteParts';
import EnvelopeCover from '../covers/EnvelopeCover';

export default function TimelessDesign({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  const label     = { color: theme.muted,   fontFamily: `'${theme.labelFont}', sans-serif` };
  const head      = { color: theme.accent,  fontFamily: `'${theme.headingFont}', serif` };
  const script    = { color: theme.accent,  fontFamily: `'${theme.scriptFont}', cursive` };
  const lbl = (t: string) => (
    <p className="text-[9px] uppercase tracking-[0.36em] mb-3" style={label}>{t}</p>
  );

  /* polaroid rotations — stable across renders */
  const ROTS = [-2.6, 1.9, -1.5, 2.4];

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles />
      {!opened && (
        <EnvelopeCover theme={theme} content={content} onOpen={() => setOpened(true)} />
      )}

      <div
        data-lenis-prevent
        className="h-full overflow-y-auto scroll-smooth"
        style={{
          background: theme.surface,
          color: theme.ink,
          fontFamily: `'${theme.bodyFont}', serif`,
          opacity:    opened ? 1 : 0,
          transition: 'opacity 900ms ease 200ms',
        }}>

        {/* ══ HERO — framed paper invitation ══════════════════════════════ */}
        <section
          className="px-4 pt-9 pb-10"
          style={{ background: `linear-gradient(180deg, ${theme.surfaceAlt} 0%, ${theme.surface} 100%)` }}>

          {/* outer gold rule */}
          <div style={{ padding: 2, border: `1px solid ${theme.gold}` }}>
            {/* inner inset rule */}
            <div
              className="text-center py-9 px-4"
              style={{ border: `1px solid ${theme.gold}38` }}>

              {/* wax seal */}
              <Reveal variant="scale">
                <div className="flex justify-center mb-5">
                  <WaxSeal
                    monogram={content.monogram}
                    gold={theme.gold}
                    accent={theme.accent}
                    scriptFont={theme.headingFont}
                    size={72}
                  />
                </div>
              </Reveal>

              <Reveal delay={60}>
                {lbl('Together with their families')}
                <h1 style={{ ...script, fontSize: 'clamp(2.8rem,14vw,4.6rem)', lineHeight: 0.92 }}>
                  {content.brideName}
                </h1>
                <div className="my-0.5 text-xl" style={{ color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>
                  &amp;
                </div>
                <h1 style={{ ...script, fontSize: 'clamp(2.8rem,14vw,4.6rem)', lineHeight: 0.92 }}>
                  {content.groomName}
                </h1>
                <Divider ornament={theme.ornament} color={theme.gold} />
                <p
                  className="mx-auto max-w-[230px] text-[12px] leading-loose italic"
                  style={{ color: theme.muted }}>
                  {content.intro}
                </p>
                <p className="mt-5 text-[13px] tracking-[0.14em]" style={head}>
                  {content.dateLabel}
                </p>
              </Reveal>
            </div>
          </div>

          {/* hero photo with corner brackets */}
          <Reveal delay={100}>
            <div className="mt-8">
              <FramedPhoto src={content.heroImageUrl} gold={theme.gold} ratio="aspect-[4/3]" withGlow />
            </div>
          </Reveal>
        </section>

        {/* ══ COUNTDOWN ════════════════════════════════════════════════════ */}
        <section className="px-5 py-11 text-center" style={{ background: theme.surface }}>
          <Reveal>
            {lbl('Counting Down To Forever')}
            <Countdown dateISO={content.dateISO} theme={theme} />
          </Reveal>
        </section>

        {/* ══ STORY ════════════════════════════════════════════════════════ */}
        <section className="px-6 py-12 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <h2 className="text-3xl" style={head}>{content.storyTitle}</h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
          </Reveal>
          <Reveal delay={80}>
            {/* decorative opening quote */}
            <div
              className="text-[4.5rem] leading-none mb-1 -mt-4 opacity-20"
              style={{ color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>
              "
            </div>
            <p
              className="mx-auto max-w-md leading-[1.9] text-[13px] text-center"
              style={{ color: theme.ink }}>
              {content.storyBody}
            </p>
          </Reveal>
        </section>

        {/* ══ EVENTS — cards with gold left-accent ═════════════════════════ */}
        <section className="px-5 py-12" style={{ background: theme.surface }}>
          <Reveal>
            <h2 className="text-3xl text-center" style={head}>{content.eventsTitle}</h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
          </Reveal>
          <div className="space-y-3 mx-auto max-w-sm">
            {content.events.map((ev, i) => (
              <Reveal key={i} delay={i * 90}>
                <div
                  style={{
                    borderLeft: `3px solid ${theme.gold}`,
                    background: `linear-gradient(90deg, ${theme.gold}0b, transparent 80%)`,
                  }}>
                  <div className="px-4 py-3.5">
                    <p
                      className="text-[9px] uppercase tracking-[0.22em]"
                      style={{ color: theme.gold, fontFamily: `'${theme.labelFont}', sans-serif` }}>
                      {ev.date} · {ev.time}
                    </p>
                    <p className="text-xl mt-0.5" style={head}>{ev.name}</p>
                    <p className="text-[12px]" style={{ color: theme.muted }}>{ev.venue}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ GALLERY — polaroid scrapbook ═════════════════════════════════ */}
        <section className="px-5 py-12" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <h2 className="text-3xl text-center" style={head}>{content.galleryTitle}</h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
          </Reveal>
          <div className="grid grid-cols-2 gap-4 mx-auto max-w-xs">
            {content.galleryImages.map((src, i) => {
              const rot = ROTS[i % ROTS.length];
              return (
                <Reveal key={i} delay={i * 75} variant="scale">
                  <div
                    style={{
                      background: '#fffef9',
                      padding: '6px 6px 28px',
                      transform: `rotate(${rot}deg)`,
                      boxShadow: '0 4px 18px rgba(0,0,0,.13), 0 1px 4px rgba(0,0,0,.08)',
                      transition: 'transform .45s cubic-bezier(.16,1,.3,1), box-shadow .45s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = 'rotate(0deg) scale(1.07)';
                      el.style.boxShadow = '0 16px 44px rgba(0,0,0,.22)';
                      el.style.zIndex    = '10';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = `rotate(${rot}deg) scale(1)`;
                      el.style.boxShadow = '0 4px 18px rgba(0,0,0,.13), 0 1px 4px rgba(0,0,0,.08)';
                      el.style.zIndex    = '';
                    }}>
                    <img src={src} alt="" className="w-full aspect-square object-cover block" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ══ VENUE ════════════════════════════════════════════════════════ */}
        <section className="px-6 py-12 text-center" style={{ background: theme.surface }}>
          <Reveal>
            <h2 className="text-3xl" style={head}>{content.venueTitle}</h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
            <p className="text-lg" style={head}>{content.venueName}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: theme.muted }}>
              {content.venueAddress}
            </p>
            <a
              href={content.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-8 py-2.5 text-[10px] uppercase tracking-[0.28em]"
              style={{
                border: `1px solid ${theme.accent}`,
                color: theme.accent,
                fontFamily: `'${theme.labelFont}', sans-serif`,
              }}>
              View on Map
            </a>
          </Reveal>
        </section>

        {/* ══ RSVP ═════════════════════════════════════════════════════════ */}
        <section className="px-6 py-16 text-center" style={{ background: theme.deep }}>
          <Reveal>
            <h2
              className="text-3xl"
              style={{ color: theme.surface, fontFamily: `'${theme.headingFont}', serif` }}>
              {content.rsvpTitle}
            </h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
            <p className="mx-auto max-w-xs text-[13px]" style={{ color: `${theme.surface}cc` }}>
              {content.rsvpNote}
            </p>
            <a
              href={`tel:${content.rsvpContact}`}
              className="inline-block mt-6 px-9 py-3 text-[11px] uppercase tracking-[0.28em]"
              style={{
                background: theme.gold,
                color: theme.deep,
                fontFamily: `'${theme.labelFont}', sans-serif`,
              }}>
              RSVP · {content.rsvpContact}
            </a>
          </Reveal>
        </section>

        <footer
          className="px-6 py-11 text-center"
          style={{ background: theme.deep, borderTop: `1px solid ${theme.gold}1e` }}>
          <p className="text-3xl" style={{ fontFamily: `'${theme.scriptFont}', cursive`, color: theme.gold }}>
            {content.monogram}
          </p>
          <p className="mt-2 text-[11px] tracking-[0.12em]" style={{ color: `${theme.surface}99` }}>
            {content.footerNote}
          </p>
        </footer>
      </div>
    </div>
  );
}
