import { useEffect, useState } from 'react';
import {
  AnimStyles, Reveal, Countdown, FramedPhoto, WaxSeal,
  BirthdayDivider, type BirthdayDesignProps,
} from '../birthdayParts';
import FilmCover from '../covers/FilmCover';

/* Milestone — bold editorial.
   Iris reveal. HUGE faded age behind everything. Masthead-style header.
   Ruled horizontal event table. Stark contrast RSVP. */
export default function MilestoneDesign({ theme, content, autoOpen = false }: BirthdayDesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  const serif = { fontFamily: `'${theme.headingFont}', serif` };
  const label = { fontFamily: `'${theme.labelFont}', sans-serif` };
  const lbl   = (t: string) => (
    <p className="text-[9px] uppercase tracking-[0.42em] mb-3" style={{ ...label, color: theme.muted }}>{t}</p>
  );

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles />
      {!opened && (
        <FilmCover theme={theme} content={content} onOpen={() => setOpened(true)} />
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

        {/* ══ MASTHEAD ═════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden px-6 pt-10 pb-14"
          style={{ background: theme.surfaceAlt }}>

          {/* ENORMOUS age watermark */}
          {content.age && (
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
              style={{
                fontSize: 'clamp(14rem,80vw,24rem)',
                fontFamily: `'${theme.headingFont}', serif`,
                fontWeight: 900,
                color: `${theme.accent}07`,
                lineHeight: 1,
                letterSpacing: '-0.06em',
              }}>
              {content.age}
            </div>
          )}

          <div className="relative z-10">
            {/* top rule + date */}
            <Reveal variant="blur">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: theme.accent }} />
                <p className="text-[9px] uppercase tracking-[0.38em]" style={{ ...label, color: theme.muted }}>
                  {content.dateLabel}
                </p>
                <div className="flex-1 h-px" style={{ background: theme.accent }} />
              </div>

              {/* big centered name */}
              <div className="text-center">
                <h1
                  style={{
                    color: theme.accent,
                    fontFamily: `'${theme.scriptFont}', cursive`,
                    fontSize: 'clamp(3.5rem,18vw,5.6rem)',
                    lineHeight: 0.88,
                  }}>
                  {content.honoree}
                </h1>
                {content.age && (
                  <p
                    className="text-[5rem] font-black leading-none tracking-tighter mt-1"
                    style={{ ...serif, color: theme.gold }}>
                    {content.age}
                  </p>
                )}
                <p
                  className="mt-2 text-[12px] uppercase tracking-[0.3em]"
                  style={{ ...label, color: theme.muted }}>
                  {content.tagline}
                </p>
              </div>

              {/* bottom rule */}
              <div className="flex items-center gap-3 mt-5">
                <div className="flex-1 h-px" style={{ background: theme.accent }} />
                <span style={{ color: theme.gold, fontSize: '0.9rem' }}>★</span>
                <div className="flex-1 h-px" style={{ background: theme.accent }} />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ WAXSEAL + INTRO ══════════════════════════════════════════════ */}
        <section className="px-6 py-12 text-center" style={{ background: theme.surface }}>
          <Reveal>
            <WaxSeal monogram={content.monogram} gold={theme.gold} accent={theme.deep} />
            <p className="mx-auto max-w-sm leading-[1.9] text-[13px] mt-6" style={{ color: theme.muted }}>
              {content.intro}
            </p>
          </Reveal>
        </section>

        {/* ══ HERO PHOTO ═══════════════════════════════════════════════════ */}
        <Reveal delay={50}>
          <div className="px-5 pb-10 mx-auto max-w-sm">
            <FramedPhoto src={content.heroImageUrl} gold={theme.gold} ratio="aspect-[3/2]" withGlow />
          </div>
        </Reveal>

        {/* ══ COUNTDOWN ════════════════════════════════════════════════════ */}
        <section className="px-5 py-11 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            {lbl('Counting Down')}
            <Countdown dateISO={content.dateISO} theme={theme} />
          </Reveal>
        </section>

        {/* ══ ABOUT — editorial drop-cap style ═════════════════════════════ */}
        <section className="px-6 py-12" style={{ background: theme.surface }}>
          <Reveal>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: `${theme.accent}50` }} />
              <h2 className="text-xl text-center" style={{ ...serif, color: theme.accent }}>
                {content.aboutTitle}
              </h2>
              <div className="h-px flex-1" style={{ background: `${theme.accent}50` }} />
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="mx-auto max-w-sm">
              {/* editorial drop cap */}
              <span
                style={{
                  float: 'left',
                  fontSize: '3.8em',
                  lineHeight: 0.78,
                  marginRight: 6,
                  marginTop: 6,
                  fontFamily: `'${theme.headingFont}', serif`,
                  color: theme.gold,
                  fontWeight: 700,
                }}>
                {content.aboutBody.charAt(0)}
              </span>
              <span className="text-[13px] leading-[1.95]" style={{ color: theme.ink }}>
                {content.aboutBody.slice(1)}
              </span>
            </div>
          </Reveal>
        </section>

        {/* ══ SCHEDULE — ruled table ════════════════════════════════════════ */}
        <section className="px-6 py-12" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <h2 className="text-3xl text-center" style={{ ...serif, color: theme.accent }}>
              {content.scheduleTitle}
            </h2>
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
          </Reveal>

          <div className="mx-auto max-w-sm">
            {/* table header */}
            <div
              className="grid grid-cols-[4rem_1fr] gap-3 pb-2 mb-2"
              style={{ borderBottom: `2px solid ${theme.accent}` }}>
              <p className="text-[8px] uppercase tracking-[0.32em]" style={{ ...label, color: theme.muted }}>Time</p>
              <p className="text-[8px] uppercase tracking-[0.32em]" style={{ ...label, color: theme.muted }}>Event</p>
            </div>

            {content.events.map((ev, i) => (
              <Reveal key={i} delay={i * 80}>
                <div
                  className="grid grid-cols-[4rem_1fr] gap-3 py-3.5"
                  style={{ borderBottom: `1px solid ${theme.accent}22` }}>
                  <p
                    className="text-[10px] font-semibold leading-snug"
                    style={{ ...label, color: theme.gold }}>
                    {ev.time}
                  </p>
                  <div>
                    <p className="text-sm font-medium leading-snug" style={{ ...serif, color: theme.accent }}>
                      {ev.name}
                    </p>
                    <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: theme.muted }}>
                      {ev.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ GALLERY — 2-col asymmetric ═══════════════════════════════════ */}
        <section className="px-5 py-12" style={{ background: theme.surface }}>
          <Reveal>
            <h2 className="text-3xl text-center" style={{ ...serif, color: theme.accent }}>
              {content.galleryTitle}
            </h2>
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
          </Reveal>

          <div className="mx-auto max-w-sm space-y-2">
            {/* first image — full width */}
            {content.galleryImages[0] && (
              <Reveal delay={50}>
                <div className="overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={content.galleryImages[0]}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ transition: 'transform .6s ease' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')}
                  />
                </div>
              </Reveal>
            )}

            {/* remaining 3 — 3-col strip */}
            {content.galleryImages.slice(1).length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {content.galleryImages.slice(1).map((src, i) => (
                  <Reveal key={i} delay={i * 60 + 80} variant="scale">
                    <div className="overflow-hidden aspect-square">
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ transition: 'transform .5s ease' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')}
                      />
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ══ VENUE ════════════════════════════════════════════════════════ */}
        <section className="px-6 py-12 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <h2 className="text-3xl" style={{ ...serif, color: theme.accent }}>{content.venueTitle}</h2>
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
            <p className="text-lg" style={{ ...serif, color: theme.accent }}>{content.venueName}</p>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: theme.muted }}>{content.venueAddress}</p>
            <a
              href={content.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-5 px-8 py-2 text-[10px] uppercase tracking-[0.28em]"
              style={{ border: `1px solid ${theme.accent}`, color: theme.accent, ...label }}>
              Get Directions
            </a>
          </Reveal>
        </section>

        {/* ══ RSVP — stark full-dark panel ═════════════════════════════════ */}
        <section className="px-6 py-16 text-center" style={{ background: theme.ink }}>
          <Reveal>
            <div
              className="inline-flex items-center justify-center rounded-full mb-6"
              style={{
                width: 72, height: 72,
                border: `1px solid ${theme.gold}88`,
                color: theme.gold,
                fontFamily: `'${theme.headingFont}', serif`,
                fontSize: '1.4rem',
                background: `radial-gradient(circle, ${theme.gold}12, transparent 70%)`,
              }}>
              {content.monogram}
            </div>
            <h2 className="text-3xl" style={{ ...serif, color: theme.surface }}>
              {content.rsvpTitle}
            </h2>
            <div className="h-px w-12 mx-auto my-5" style={{ background: theme.gold }} />
            <p className="mx-auto max-w-xs text-[13px]" style={{ color: `${theme.surface}99` }}>
              {content.rsvpNote}
            </p>
            <a
              href={`tel:${content.rsvpContact}`}
              className="inline-block mt-7 px-9 py-3 text-[11px] uppercase tracking-[0.28em]"
              style={{ background: theme.gold, color: theme.ink, ...label }}>
              RSVP · {content.rsvpContact}
            </a>
          </Reveal>
        </section>

        <footer
          className="px-6 py-10 text-center"
          style={{ background: theme.ink, borderTop: `1px solid ${theme.gold}18` }}>
          <p className="text-2xl" style={{ fontFamily: `'${theme.scriptFont}', cursive`, color: theme.gold }}>
            {content.honoree}
          </p>
          <p className="mt-2 text-[11px] tracking-[0.12em]" style={{ color: `${theme.surface}66` }}>
            {content.footerNote}
          </p>
        </footer>
      </div>
    </div>
  );
}
