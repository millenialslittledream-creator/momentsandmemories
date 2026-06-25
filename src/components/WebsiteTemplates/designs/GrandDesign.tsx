import { useEffect, useState } from 'react';
import {
  AnimStyles, Reveal, Divider, Countdown, KenBurns, WaxSeal,
  type DesignProps,
} from '../inviteParts';
import TheatreCover from '../covers/TheatreCover';

export default function GrandDesign({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  const head = { color: theme.accent, fontFamily: `'${theme.headingFont}', serif` };
  const lbl  = (t: string, color = theme.muted) => (
    <p
      className="text-[9px] uppercase tracking-[0.36em] mb-3"
      style={{ color, fontFamily: `'${theme.labelFont}', sans-serif` }}>
      {t}
    </p>
  );

  /* first image is featured hero in gallery mosaic */
  const [feat, ...rest] = content.galleryImages;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles />
      {!opened && (
        <TheatreCover theme={theme} content={content} onOpen={() => setOpened(true)} />
      )}

      <div
        data-lenis-prevent
        className="h-full overflow-y-auto scroll-smooth"
        style={{
          background: theme.surface,
          color: theme.ink,
          fontFamily: `'${theme.bodyFont}', serif`,
          opacity:    opened ? 1 : 0,
          transition: 'opacity 800ms ease 300ms',
        }}>

        {/* ══ CINEMATIC HERO — full-bleed Ken Burns ════════════════════════ */}
        <section className="relative min-h-[580px] flex flex-col items-center justify-center text-center px-6 py-16 overflow-hidden">
          <KenBurns src={content.heroImageUrl} className="absolute inset-0 w-full h-full" />
          {/* layered gradients for cinematic depth */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg,
                ${theme.deep}ee 0%,
                transparent     30%,
                transparent     68%,
                ${theme.deep}ee 100%)`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse 75% 55% at 50% 50%, ${theme.deep}55, transparent)` }}
          />

          <div className="relative z-10 w-full">
            <Reveal variant="scale">
              <div className="flex justify-center mb-5">
                <WaxSeal
                  monogram={content.monogram}
                  gold={theme.gold}
                  accent={theme.accent}
                  scriptFont={theme.headingFont}
                  size={70}
                />
              </div>
              <p
                className="text-[9px] uppercase tracking-[0.46em] mb-4"
                style={{ color: `${theme.surface}cc`, fontFamily: `'${theme.labelFont}', sans-serif` }}>
                The Wedding Of
              </p>
              <h1 style={{
                color: theme.surface,
                fontFamily: `'${theme.scriptFont}', cursive`,
                fontSize: 'clamp(3rem,16vw,5.2rem)',
                lineHeight: 0.92,
              }}>
                {content.brideName}
              </h1>
              <div className="my-1.5 text-2xl" style={{ color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>
                &amp;
              </div>
              <h1 style={{
                color: theme.surface,
                fontFamily: `'${theme.scriptFont}', cursive`,
                fontSize: 'clamp(3rem,16vw,5.2rem)',
                lineHeight: 0.92,
              }}>
                {content.groomName}
              </h1>
              <p
                className="mt-6 text-[11px] tracking-[0.24em]"
                style={{ color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>
                {content.dateLabel}
              </p>
            </Reveal>
          </div>

          <span
            className="absolute z-10 bottom-5 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.3em]"
            style={{ color: `${theme.surface}66`, animation: 'inv-float 2.5s ease-in-out infinite' }}>
            ↓ scroll
          </span>
        </section>

        {/* ══ QUOTE BAND ═══════════════════════════════════════════════════ */}
        <section className="px-8 py-12 text-center" style={{ background: theme.deep }}>
          <Reveal>
            <div
              className="text-5xl leading-none mb-3 opacity-25"
              style={{ color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>
              "
            </div>
            <p
              className="text-xl italic leading-snug max-w-xs mx-auto"
              style={{ fontFamily: `'${theme.headingFont}', serif`, color: theme.surface }}>
              {content.intro}
            </p>
            <div
              className="text-5xl leading-none mt-3 opacity-25 rotate-180"
              style={{ color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>
              "
            </div>
          </Reveal>
        </section>

        {/* ══ COUNTDOWN ════════════════════════════════════════════════════ */}
        <section className="px-5 py-11 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            {lbl('Counting Down To Forever')}
            <Countdown dateISO={content.dateISO} theme={theme} />
          </Reveal>
        </section>

        {/* ══ STORY ════════════════════════════════════════════════════════ */}
        <section className="px-6 py-12" style={{ background: theme.surface }}>
          <Reveal>
            <img
              src={content.galleryImages[0] || content.heroImageUrl}
              alt=""
              className="w-full aspect-[3/2] object-cover mb-7"
              style={{ border: `1px solid ${theme.gold}28` }}
            />
            <h2 className="text-3xl text-center" style={head}>{content.storyTitle}</h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
            <p
              className="mx-auto max-w-md text-center leading-loose text-[14px]"
              style={{ color: theme.ink }}>
              {content.storyBody}
            </p>
          </Reveal>
        </section>

        {/* ══ EVENTS — centered alternating timeline ═══════════════════════ */}
        <section className="px-5 py-12" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <h2 className="text-3xl text-center" style={head}>{content.eventsTitle}</h2>
            <Divider ornament={theme.ornament} color={theme.gold} />
          </Reveal>
          <div className="relative mx-auto max-w-md">
            <span
              className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px"
              style={{ background: `${theme.gold}40` }}
            />
            {content.events.map((ev, i) => (
              <Reveal key={i} delay={i * 90} variant={i % 2 ? 'right' : 'left'}>
                <div
                  className={`relative w-[47%] pb-8 ${i % 2 ? 'ml-auto pl-5 text-left' : 'pr-5 text-right'}`}>
                  <span
                    className="absolute top-1.5 w-3 h-3 rounded-full"
                    style={{
                      background: theme.gold,
                      boxShadow: `0 0 0 3px ${theme.surfaceAlt}, 0 0 0 5px ${theme.gold}44`,
                      [i % 2 ? 'left' : 'right']: -6,
                    } as React.CSSProperties}
                  />
                  <p
                    className="text-[9px] uppercase tracking-[0.18em]"
                    style={{ color: theme.gold, fontFamily: `'${theme.labelFont}', sans-serif` }}>
                    {ev.date} · {ev.time}
                  </p>
                  <p className="text-lg mt-0.5" style={head}>{ev.name}</p>
                  <p className="text-[11px]" style={{ color: theme.muted }}>{ev.venue}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ GALLERY — bento mosaic (featured + grid) ═════════════════════ */}
        <section className="py-12" style={{ background: theme.surface }}>
          <Reveal>
            <div className="px-6">
              <h2 className="text-3xl text-center" style={head}>{content.galleryTitle}</h2>
              <Divider ornament={theme.ornament} color={theme.gold} />
            </div>
          </Reveal>
          <div className="px-5 space-y-1">
            {/* featured wide photo */}
            {feat && (
              <Reveal variant="blur">
                <div style={{ border: `1px solid ${theme.gold}1e` }}>
                  <img
                    src={feat}
                    alt=""
                    className="w-full aspect-[16/9] object-cover hover:scale-[1.025] transition-transform duration-700"
                  />
                </div>
              </Reveal>
            )}
            {/* remaining in 2-col grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-2 gap-1">
                {rest.map((src, i) => (
                  <Reveal key={i} delay={i * 65} variant={i % 2 ? 'right' : 'left'}>
                    <div style={{ border: `1px solid ${theme.gold}1e` }}>
                      <img
                        src={src}
                        alt=""
                        className="w-full aspect-square object-cover hover:scale-[1.04] transition-transform duration-500"
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
              className="inline-block mt-6 px-8 py-2.5 text-[10px] uppercase tracking-[0.26em]"
              style={{
                border: `1px solid ${theme.accent}`,
                color: theme.accent,
                fontFamily: `'${theme.labelFont}', sans-serif`,
              }}>
              View on Map
            </a>
          </Reveal>
        </section>

        {/* ══ RSVP — luxury full-bleed band ════════════════════════════════ */}
        <section className="px-6 py-18 text-center" style={{ background: theme.deep }}>
          <Reveal>
            <div className="flex justify-center mb-5 gap-3">
              {['✦', '✦', '✦'].map((g, i) => (
                <span
                  key={i}
                  style={{
                    color: theme.gold,
                    opacity: 0.4 + i * 0.15,
                    fontFamily: `'${theme.headingFont}', serif`,
                    fontSize: '0.8rem',
                  }}>
                  {g}
                </span>
              ))}
            </div>
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
              className="inline-block mt-7 px-10 py-3.5 text-[11px] uppercase tracking-[0.28em]"
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
          className="px-6 py-10 text-center"
          style={{ background: theme.deep, borderTop: `1px solid ${theme.gold}1e` }}>
          <p className="text-3xl" style={{ fontFamily: `'${theme.scriptFont}', cursive`, color: theme.gold }}>
            {content.monogram}
          </p>
          <p className="mt-2 text-[11px] tracking-[0.12em]" style={{ color: `${theme.surface}88` }}>
            {content.footerNote}
          </p>
        </footer>
      </div>
    </div>
  );
}
