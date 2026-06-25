import { useEffect, useState } from 'react';
import {
  AnimStyles, Reveal, Countdown, FramedPhoto,
  BirthdayDivider, type BirthdayDesignProps,
} from '../birthdayParts';
import BalloonCover from '../covers/BalloonCover';

/* Bash — high-energy party card.
   Giant faded age as background text, colourful event cards,
   polaroid gallery, bright RSVP. */
export default function BashDesign({ theme, content, autoOpen = false }: BirthdayDesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  const head  = { color: theme.accent,  fontFamily: `'${theme.headingFont}', serif` };
  const label = { color: theme.muted,   fontFamily: `'${theme.labelFont}', sans-serif` };
  const lbl   = (t: string) => (
    <p className="text-[9px] uppercase tracking-[0.38em] mb-3" style={label}>{t}</p>
  );

  const POLAROID_ROTS = [-2.8, 1.9, -1.6, 2.5];

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles />
      {!opened && (
        <BalloonCover theme={theme} content={content} onOpen={() => setOpened(true)} />
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

        {/* ══ HERO — giant faded age as background ═════════════════════════ */}
        <section
          className="relative overflow-hidden px-5 pt-10 pb-10 text-center"
          style={{ background: `linear-gradient(180deg, ${theme.surfaceAlt} 0%, ${theme.surface} 100%)` }}>
          {/* giant faded age watermark */}
          {content.age && (
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
              style={{
                fontSize: 'clamp(10rem,50vw,16rem)',
                fontFamily: `'${theme.headingFont}', serif`,
                fontWeight: 700,
                color: `${theme.accent}09`,
                lineHeight: 1,
              }}>
              {content.age}
            </div>
          )}

          <div className="relative z-10">
            <Reveal variant="blur">
              {lbl('Happy Birthday')}
              <h1
                style={{
                  color: theme.accent,
                  fontFamily: `'${theme.scriptFont}', cursive`,
                  fontSize: 'clamp(3rem,15vw,4.8rem)',
                  lineHeight: 0.92,
                }}>
                {content.honoree}
              </h1>
              {content.age && (
                <p
                  className="text-[2.5rem] font-bold mt-1 leading-tight"
                  style={{ color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>
                  {content.age}
                </p>
              )}
              <p className="mt-2 text-[13px] italic" style={{ color: theme.muted }}>{content.tagline}</p>
              <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
              <p className="mx-auto max-w-xs text-[12px] italic leading-relaxed" style={{ color: theme.muted }}>
                {content.intro}
              </p>
              <p className="mt-4 text-[13px] tracking-[0.14em]" style={head}>{content.dateLabel}</p>
            </Reveal>
          </div>

          <Reveal delay={90}>
            <div className="mt-7 relative z-10">
              <FramedPhoto src={content.heroImageUrl} gold={theme.gold} ratio="aspect-[4/3]" withGlow />
            </div>
          </Reveal>
        </section>

        {/* ══ COUNTDOWN ════════════════════════════════════════════════════ */}
        <section className="px-5 py-11 text-center" style={{ background: theme.surface }}>
          <Reveal>
            {lbl('Until the Party')}
            <Countdown dateISO={content.dateISO} theme={theme} />
          </Reveal>
        </section>

        {/* ══ ABOUT ════════════════════════════════════════════════════════ */}
        <section className="px-6 py-12 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <h2 className="text-3xl" style={head}>{content.aboutTitle}</h2>
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
          </Reveal>
          <Reveal delay={70}>
            <div
              className="text-[4rem] leading-none mb-1 -mt-3 opacity-20"
              style={{ color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>
              "
            </div>
            <p className="mx-auto max-w-md leading-[1.9] text-[13px] text-center" style={{ color: theme.ink }}>
              {content.aboutBody}
            </p>
          </Reveal>
        </section>

        {/* ══ SCHEDULE — coloured left-border cards ════════════════════════ */}
        <section className="px-5 py-12" style={{ background: theme.surface }}>
          <Reveal>
            <h2 className="text-3xl text-center" style={head}>{content.scheduleTitle}</h2>
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
          </Reveal>
          <div className="space-y-3 mx-auto max-w-sm">
            {content.events.map((ev, i) => (
              <Reveal key={i} delay={i * 80}>
                <div
                  style={{
                    borderLeft: `3px solid ${theme.gold}`,
                    background: `linear-gradient(90deg, ${theme.gold}0c, transparent 75%)`,
                  }}>
                  <div className="px-4 py-3.5">
                    <p
                      className="text-[9px] uppercase tracking-[0.24em]"
                      style={{ color: theme.gold, fontFamily: `'${theme.labelFont}', sans-serif` }}>
                      {ev.time}
                    </p>
                    <p className="text-xl mt-0.5" style={head}>{ev.name}</p>
                    <p className="text-[12px]" style={{ color: theme.muted }}>{ev.description}</p>
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
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
          </Reveal>
          <div className="grid grid-cols-2 gap-4 mx-auto max-w-xs">
            {content.galleryImages.map((src, i) => {
              const rot = POLAROID_ROTS[i % POLAROID_ROTS.length];
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
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
            <p className="text-lg" style={head}>{content.venueName}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: theme.muted }}>{content.venueAddress}</p>
            <a
              href={content.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-8 py-2.5 text-[10px] uppercase tracking-[0.28em]"
              style={{ border: `1px solid ${theme.accent}`, color: theme.accent, fontFamily: `'${theme.labelFont}', sans-serif` }}>
              Get Directions
            </a>
          </Reveal>
        </section>

        {/* ══ RSVP ═════════════════════════════════════════════════════════ */}
        <section className="px-6 py-16 text-center" style={{ background: theme.deep }}>
          <Reveal>
            <h2 className="text-3xl" style={{ color: theme.surface, fontFamily: `'${theme.headingFont}', serif` }}>
              {content.rsvpTitle}
            </h2>
            <BirthdayDivider partyStyle={theme.partyStyle} color={theme.gold} />
            <p className="mx-auto max-w-xs text-[13px]" style={{ color: `${theme.surface}cc` }}>
              {content.rsvpNote}
            </p>
            <a
              href={`tel:${content.rsvpContact}`}
              className="inline-block mt-6 px-9 py-3 text-[11px] uppercase tracking-[0.28em]"
              style={{ background: theme.gold, color: theme.deep, fontFamily: `'${theme.labelFont}', sans-serif` }}>
              RSVP · {content.rsvpContact}
            </a>
          </Reveal>
        </section>

        <footer
          className="px-6 py-10 text-center"
          style={{ background: theme.deep, borderTop: `1px solid ${theme.gold}20` }}>
          <p className="text-3xl" style={{ fontFamily: `'${theme.scriptFont}', cursive`, color: theme.gold }}>
            {content.honoree}
          </p>
          <p className="mt-2 text-[11px] tracking-[0.12em]" style={{ color: `${theme.surface}99` }}>
            {content.footerNote}
          </p>
        </footer>
      </div>
    </div>
  );
}
