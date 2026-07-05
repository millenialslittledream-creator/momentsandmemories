import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, TapCover, Confetti, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Gender Reveal · "Bows or Bowties" — cute editorial with big playful icons and
   a versus layout. */
const BLUE = '#3d7bd0';
const PINK = '#e06b9c';

export default function RevealBowOrBowtie({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);
  const head = { color: theme.accent, fontFamily: `'${theme.headingFont}', serif` };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles /><EventAnimStyles />
      {!opened && (
        <TapCover
          bg={theme.deep} accent={theme.surface} gold={theme.gold}
          label="Bowties Or Bows?" title="Vote Now" sub={content.dateLabel}
          hint="Cast your guess" icon="🎀" onOpen={() => setOpened(true)}
          ornaments={<Confetti colors={[BLUE, PINK, theme.gold]} count={22} />}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', sans-serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        {/* HERO — versus */}
        <section className="px-6 pt-12 pb-10 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.4em] mb-4" style={{ color: theme.muted }}>Which will it be?</p>
            <div className="flex items-stretch justify-center gap-0 mx-auto max-w-sm">
              <div className="flex-1 py-6" style={{ background: `${BLUE}18` }}>
                <div className="text-5xl">🤵</div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: BLUE }}>Bowties</p>
              </div>
              <div className="flex items-center px-3 text-2xl" style={{ ...head }}>vs</div>
              <div className="flex-1 py-6" style={{ background: `${PINK}18` }}>
                <div className="text-5xl">👰</div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: PINK }}>Bows</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-8" style={{ ...head, fontSize: 'clamp(2.4rem,12vw,3.6rem)', lineHeight: 0.95 }}>{content.storyTitle}</h1>
            <p className="mt-3 mx-auto max-w-[260px] text-[12.5px] leading-relaxed italic" style={{ color: theme.muted }}>{content.intro}</p>
            <div className="mt-7 mx-auto max-w-[240px]" style={{ overflow: 'hidden', boxShadow: `0 16px 40px ${theme.accent}2e` }}>
              <img src={content.heroImageUrl} alt="" className="w-full aspect-[4/3] object-cover" />
            </div>
            <p className="mt-5 text-[13px] tracking-[0.16em]" style={head}>{content.dateLabel}</p>
          </Reveal>
        </section>

        <CountdownBlock theme={theme} content={content} label="Until the big reveal" bg={theme.surface} />
        <StoryBlock theme={theme} content={content} bg={theme.surfaceAlt} />
        <EventsBlock theme={theme} content={content} variant="ticket" />
        <GalleryBlock theme={theme} content={content} variant="strip" />
        <VenueBlock theme={theme} content={content} bg={theme.surfaceAlt} />
        <RsvpBlock theme={theme} content={content} />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
