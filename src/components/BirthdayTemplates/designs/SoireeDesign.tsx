import { useEffect, useState } from 'react';
import {
  AnimStyles, Reveal, Countdown, KenBurns,
  BirthdayDivider, type BirthdayDesignProps,
} from '../birthdayParts';
import SpotlightCover from '../covers/SpotlightCover';

/* Soirée — elegant, full-bleed photo-first.
   Doors reveal, cinematic hero, bento gallery, muted luxury palette. */
export default function SoireeDesign({ theme, content, autoOpen = false }: BirthdayDesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  const serif = { fontFamily: `'${theme.headingFont}', serif` };
  const label = { fontFamily: `'${theme.labelFont}', sans-serif`, color: theme.muted };
  const lbl   = (t: string) => (
    <p className="text-[9px] uppercase tracking-[0.42em] mb-3" style={label}>{t}</p>
  );

  const [feat, ...rest] = content.galleryImages;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles />
      {!opened && (
        <SpotlightCover theme={theme} content={content} onOpen={() => setOpened(true)} />
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

        {/* ══ FULL-BLEED HERO PHOTO ════════════════════════════════════════ */}
        <section className="relative h-[70vh] min-h-[420px] overflow-hidden">
          <KenBurns src={content.heroImageUrl} />
          {/* multi-layer gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg,
                ${theme.pageBg}bb 0%,
                transparent 28%,
                transparent 62%,
                ${theme.pageBg}ee 100%)`,
            }}
          />
          {/* radial vignette */}
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, ${theme.pageBg}99 100%)` }}
          />

          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-10 text-center px-6">
            <Reveal variant="blur">
              <span
                className="text-[8px] uppercase tracking-[0.55em] block mb-4"
                style={{ ...label, color: `${theme.gold}cc` }}>
                An Intimate Celebration
              </span>
              <h1
                style={{
                  color: theme.surface,
                  fontFamily: `'${theme.scriptFont}', cursive`,
                  fontSize: 'clamp(3.2rem,16vw,5rem)',
                  lineHeight: 0.9,
                  textShadow: `0 2px 24px ${theme.pageBg}cc`,
                }}>
                {content.honoree}
              </h1>
              {content.age && (
                <p
                  className="text-[2rem] font-light mt-1"
                  style={{ ...serif, color: theme.gold, letterSpacing: '0.06em' }}>
                  Turns {content.age}
                </p>
              )}
              <p
                className="mt-2 text-[12px] italic"
                style={{ color: `${theme.surface}bb`, fontFamily: `'${theme.bodyFont}', serif` }}>
                {content.tagline}
              </p>
              <p
                className="mt-3 text-[11px] tracking-[0.2em]"
                style={{ ...serif, color: theme.gold }}>
                {content.dateLabel}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ══ ABOUT — centred, elegant ══════════════════════════════════════ */}
        <section className="px-7 py-14 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            {lbl('The Guest of Honour')}
            <h2 className="text-3xl" style={{ ...serif, color: theme.accent }}>{content.aboutTitle}</h2>
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
          </Reveal>
          <Reveal delay={70}>
            <p className="mx-auto max-w-sm leading-[2] text-[13px] italic" style={{ color: theme.muted }}>
              {content.aboutBody}
            </p>
          </Reveal>
        </section>

        {/* ══ COUNTDOWN ════════════════════════════════════════════════════ */}
        <section className="px-5 py-12 text-center" style={{ background: theme.surface }}>
          <Reveal>
            {lbl('The Countdown')}
            <Countdown dateISO={content.dateISO} theme={theme} />
          </Reveal>
        </section>

        {/* ══ SCHEDULE — ruled table ════════════════════════════════════════ */}
        <section className="px-6 py-14" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <h2 className="text-3xl text-center" style={{ ...serif, color: theme.accent }}>
              {content.scheduleTitle}
            </h2>
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
          </Reveal>

          <div className="mx-auto max-w-sm">
            {content.events.map((ev, i) => (
              <Reveal key={i} delay={i * 80}>
                <div
                  className="flex gap-4 py-4"
                  style={{ borderBottom: `1px solid ${theme.gold}28` }}>
                  <div className="shrink-0 pt-0.5">
                    <p
                      className="text-[9px] uppercase tracking-[0.22em] w-14 text-right leading-snug"
                      style={{ color: theme.gold, fontFamily: `'${theme.labelFont}', sans-serif` }}>
                      {ev.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-snug" style={{ ...serif, color: theme.accent }}>{ev.name}</p>
                    <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: theme.muted }}>{ev.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ GALLERY — bento grid ═════════════════════════════════════════ */}
        <section className="px-5 py-12" style={{ background: theme.surface }}>
          <Reveal>
            <h2 className="text-3xl text-center" style={{ ...serif, color: theme.accent }}>
              {content.galleryTitle}
            </h2>
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
          </Reveal>

          {feat && (
            <Reveal delay={50}>
              <div className="mx-auto max-w-sm mb-3 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <img
                  src={feat}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ transition: 'transform .6s ease' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')}
                />
              </div>
            </Reveal>
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mx-auto max-w-sm">
              {rest.map((src, i) => (
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
        </section>

        {/* ══ VENUE ════════════════════════════════════════════════════════ */}
        <section className="px-6 py-14 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <h2 className="text-3xl" style={{ ...serif, color: theme.accent }}>{content.venueTitle}</h2>
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
            <p className="text-lg" style={{ ...serif, color: theme.accent }}>{content.venueName}</p>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: theme.muted }}>{content.venueAddress}</p>
            <a
              href={content.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-6 px-8 py-2.5 text-[10px] uppercase tracking-[0.28em]"
              style={{
                border: `1px solid ${theme.gold}`,
                color: theme.gold,
                fontFamily: `'${theme.labelFont}', sans-serif`,
              }}>
              Get Directions
            </a>
          </Reveal>
        </section>

        {/* ══ RSVP ═════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden px-6 py-16 text-center"
          style={{ background: theme.deep }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${theme.gold}14, transparent 70%)` }}
          />
          <Reveal>
            <p
              className="text-[8px] uppercase tracking-[0.5em] mb-4"
              style={{ color: `${theme.gold}99`, fontFamily: `'${theme.labelFont}', sans-serif` }}>
              You Are Invited
            </p>
            <h2
              className="text-3xl"
              style={{ ...serif, color: theme.surface }}>
              {content.rsvpTitle}
            </h2>
            <div className="h-px w-16 mx-auto my-5" style={{ background: `${theme.gold}60` }} />
            <p className="mx-auto max-w-xs text-[13px] italic" style={{ color: `${theme.surface}aa` }}>
              {content.rsvpNote}
            </p>
            <a
              href={`tel:${content.rsvpContact}`}
              className="inline-flex items-center gap-2 mt-7 px-9 py-3 text-[10px] uppercase tracking-[0.32em]"
              style={{
                border: `1px solid ${theme.gold}`,
                color: theme.gold,
                fontFamily: `'${theme.labelFont}', sans-serif`,
              }}>
              RSVP · {content.rsvpContact}
            </a>
          </Reveal>
        </section>

        <footer
          className="px-6 py-12 text-center"
          style={{ background: theme.deep, borderTop: `1px solid ${theme.gold}18` }}>
          <div
            className="inline-flex items-center justify-center rounded-full mb-4"
            style={{
              width: 60, height: 60,
              border: `1px solid ${theme.gold}55`,
              color: theme.gold,
              fontFamily: `'${theme.headingFont}', serif`,
              fontSize: '1.2rem',
            }}>
            {content.monogram}
          </div>
          <p className="text-[11px] tracking-[0.14em]" style={{ color: `${theme.surface}77` }}>
            {content.footerNote}
          </p>
        </footer>
      </div>
    </div>
  );
}
