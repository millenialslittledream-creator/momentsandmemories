import { useEffect, useState } from 'react';
import {
  AnimStyles, Reveal, Countdown, KenBurns, type DesignProps,
} from '../inviteParts';
import MagazineCover from '../covers/MagazineCover';

function Rule({ color }: { color: string }) {
  return <span className="block w-full h-px" style={{ background: `${color}1e` }} />;
}

function EHead({ n, title, theme }: { n: string; title: string; theme: DesignProps['theme'] }) {
  return (
    <div className="flex items-baseline gap-3 mb-6">
      <span
        className="text-[10px] font-semibold tracking-[0.24em] flex-shrink-0"
        style={{ color: theme.gold, fontFamily: `'${theme.labelFont}', sans-serif` }}>
        {n}
      </span>
      <Rule color={theme.ink} />
      <h2
        className="text-2xl flex-shrink-0"
        style={{ color: theme.accent, fontFamily: `'${theme.headingFont}', serif` }}>
        {title}
      </h2>
    </div>
  );
}

export default function EditorialDesign({ theme: baseTheme, content, autoOpen = false }: DesignProps) {
  /* Editorial always reads as the contemporary option — override body/label fonts */
  const theme = { ...baseTheme, bodyFont: 'Montserrat', labelFont: 'Montserrat' };
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  const dropFirst = content.storyBody.charAt(0);
  const dropRest  = content.storyBody.slice(1);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles />
      {!opened && (
        <MagazineCover theme={theme} content={content} onOpen={() => setOpened(true)} />
      )}

      <div
        data-lenis-prevent
        className="h-full overflow-y-auto scroll-smooth"
        style={{
          background: theme.surface,
          color: theme.ink,
          fontFamily: `'${theme.bodyFont}', sans-serif`,
          opacity:    opened ? 1 : 0,
          transition: 'opacity 800ms ease',
        }}>

        {/* ══ HERO — editorial masthead ════════════════════════════════════ */}
        <section className="px-6 pt-10 pb-6">
          <Reveal>
            <div className="flex items-baseline justify-between mb-1">
              <span
                className="text-[9px] uppercase tracking-[0.38em]"
                style={{ color: theme.muted, fontFamily: `'${theme.labelFont}', sans-serif` }}>
                The Wedding Of
              </span>
              <span
                className="text-[10px] tracking-[0.2em]"
                style={{ color: theme.gold, fontFamily: `'${theme.labelFont}', sans-serif` }}>
                {content.dateLabel}
              </span>
            </div>
            <Rule color={theme.ink} />
            <div className="mt-5">
              <h1
                className="leading-[0.9]"
                style={{
                  color: theme.accent,
                  fontFamily: `'${theme.headingFont}', serif`,
                  fontSize: 'clamp(2.8rem,14vw,4rem)',
                }}>
                {content.brideName}
              </h1>
              <div className="flex items-center gap-3 my-2">
                <Rule color={theme.ink} />
                <span
                  className="text-2xl flex-shrink-0"
                  style={{ color: theme.gold, fontFamily: `'${theme.scriptFont}', cursive` }}>
                  and
                </span>
                <Rule color={theme.ink} />
              </div>
              <h1
                className="leading-[0.9] text-right"
                style={{
                  color: theme.accent,
                  fontFamily: `'${theme.headingFont}', serif`,
                  fontSize: 'clamp(2.8rem,14vw,4rem)',
                }}>
                {content.groomName}
              </h1>
            </div>
          </Reveal>
          <Reveal delay={100} variant="blur">
            <KenBurns src={content.heroImageUrl} className="w-full aspect-[4/5] mt-6" />
          </Reveal>
        </section>

        {/* ══ INVITATION TEXT ══════════════════════════════════════════════ */}
        <section className="px-6 py-5" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <Rule color={theme.ink} />
            <p className="text-[12px] text-center italic leading-relaxed py-4" style={{ color: theme.muted }}>
              {content.intro}
            </p>
            <Rule color={theme.ink} />
          </Reveal>
        </section>

        {/* ══ COUNTDOWN ════════════════════════════════════════════════════ */}
        <section className="px-6 py-10">
          <Reveal>
            <div className="flex items-center gap-3 mb-7">
              <span
                className="text-[10px] uppercase tracking-[0.3em] flex-shrink-0"
                style={{ color: theme.gold, fontFamily: `'${theme.labelFont}', sans-serif` }}>
                Counting Down
              </span>
              <Rule color={theme.ink} />
            </div>
            <Countdown dateISO={content.dateISO} theme={theme} />
          </Reveal>
        </section>

        {/* ══ STORY — with drop cap ════════════════════════════════════════ */}
        <section className="px-6 py-10" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <EHead n="01" title={content.storyTitle} theme={theme} />
            <p className="leading-loose text-[13.5px]" style={{ color: theme.ink }}>
              {/* drop cap */}
              <span
                style={{
                  float: 'left',
                  fontSize: '3.8em',
                  lineHeight: 0.78,
                  marginRight: 6,
                  marginTop: 4,
                  color: theme.accent,
                  fontFamily: `'${theme.headingFont}', serif`,
                }}>
                {dropFirst}
              </span>
              {dropRest}
            </p>
          </Reveal>
        </section>

        {/* ══ EVENTS — clean ruled table ═══════════════════════════════════ */}
        <section className="px-6 py-10">
          <Reveal><EHead n="02" title={content.eventsTitle} theme={theme} /></Reveal>
          <div>
            {content.events.map((ev, i) => (
              <Reveal key={i} delay={i * 80} variant={i % 2 ? 'right' : 'left'}>
                <div
                  className="flex items-center justify-between py-4"
                  style={{ borderTop: `1px solid ${theme.ink}15` }}>
                  <div>
                    <p
                      className="text-base"
                      style={{ color: theme.accent, fontFamily: `'${theme.headingFont}', serif` }}>
                      {ev.name}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: theme.muted }}>{ev.venue}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p
                      className="text-[10px] uppercase tracking-[0.14em]"
                      style={{ color: theme.ink }}>
                      {ev.date}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: theme.gold }}>{ev.time}</p>
                  </div>
                </div>
              </Reveal>
            ))}
            <div style={{ borderTop: `1px solid ${theme.ink}15` }} />
          </div>
        </section>

        {/* ══ GALLERY — editorial 2×2 with alternate reveals ══════════════ */}
        <section className="py-10" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <div className="px-6">
              <EHead n="03" title={content.galleryTitle} theme={theme} />
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-px">
            {content.galleryImages.map((src, i) => (
              <Reveal key={i} delay={i * 65} variant={i % 2 ? 'right' : 'left'}>
                <img
                  src={src}
                  alt=""
                  className="w-full aspect-square object-cover hover:scale-[1.03] transition-transform duration-500"
                />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ VENUE ════════════════════════════════════════════════════════ */}
        <section className="px-6 py-10">
          <Reveal>
            <EHead n="04" title={content.venueTitle} theme={theme} />
            <p
              className="text-lg"
              style={{ color: theme.accent, fontFamily: `'${theme.headingFont}', serif` }}>
              {content.venueName}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: theme.muted }}>
              {content.venueAddress}
            </p>
            <a
              href={content.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-[11px] uppercase tracking-[0.2em]"
              style={{
                color: theme.accent,
                borderBottom: `1px solid ${theme.accent}`,
                fontFamily: `'${theme.labelFont}', sans-serif`,
              }}>
              View on map →
            </a>
          </Reveal>
        </section>

        {/* ══ RSVP — full-bleed black ══════════════════════════════════════ */}
        <section className="px-6 py-16 text-center" style={{ background: theme.ink }}>
          <Reveal>
            <p
              className="text-[9px] uppercase tracking-[0.44em] mb-4"
              style={{ color: `${theme.surface}66`, fontFamily: `'${theme.labelFont}', sans-serif` }}>
              RSVP
            </p>
            <h2
              className="text-3xl"
              style={{ color: theme.surface, fontFamily: `'${theme.headingFont}', serif` }}>
              {content.rsvpTitle}
            </h2>
            <div className="flex items-center justify-center gap-4 my-5">
              <span className="h-px flex-1" style={{ background: `${theme.surface}1e` }} />
              <span style={{ color: theme.gold }}>✦</span>
              <span className="h-px flex-1" style={{ background: `${theme.surface}1e` }} />
            </div>
            <p className="mx-auto max-w-xs text-[12px]" style={{ color: `${theme.surface}bb` }}>
              {content.rsvpNote}
            </p>
            <a
              href={`tel:${content.rsvpContact}`}
              className="inline-block mt-7 px-9 py-3 text-[11px] uppercase tracking-[0.26em]"
              style={{
                background: theme.surface,
                color: theme.ink,
                fontFamily: `'${theme.labelFont}', sans-serif`,
              }}>
              {content.rsvpContact}
            </a>
          </Reveal>
        </section>

        <footer className="px-6 py-10 text-center" style={{ background: theme.surface }}>
          <p
            className="text-4xl"
            style={{ color: theme.accent, fontFamily: `'${theme.headingFont}', serif` }}>
            {content.monogram}
          </p>
          <p
            className="mt-2 text-[10px] uppercase tracking-[0.22em]"
            style={{ color: theme.muted, fontFamily: `'${theme.labelFont}', sans-serif` }}>
            {content.footerNote}
          </p>
        </footer>
      </div>
    </div>
  );
}
