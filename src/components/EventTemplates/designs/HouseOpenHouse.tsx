import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, type DesignProps, TapCover } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Housewarming · "Open House" — modern architectural: full-bleed hero, grid
   lines, minimal sans masthead. */
export default function HouseOpenHouse({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles /><EventAnimStyles />
      {!opened && (
        <TapCover
          bg={theme.deep} accent={theme.surface} gold={theme.gold}
          label="Open House" title={content.brideName} sub={content.dateLabel}
          hint="Step inside" icon="🔑" onOpen={() => setOpened(true)}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', sans-serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        {/* HERO — full-bleed architectural */}
        <section className="relative h-[80vh] min-h-[450px] overflow-hidden flex items-end">
          <img src={content.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover inv-kb" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${theme.deep}ee 100%)` }} />
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(${theme.surface}14 1px, transparent 1px), linear-gradient(90deg, ${theme.surface}14 1px, transparent 1px)`, backgroundSize: '44px 44px' }} />
          <div className="relative px-6 pb-10 w-full">
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.5em] mb-2" style={{ color: theme.gold }}>You're invited</p>
              <h1 className="uppercase" style={{ color: theme.surface, fontFamily: `'${theme.headingFont}', serif`, fontSize: 'clamp(2.4rem,13vw,4rem)', lineHeight: 0.88 }}>{content.brideName}</h1>
              <div className="mt-3 h-px w-24" style={{ background: theme.gold }} />
              <p className="mt-4 max-w-[290px] text-[12.5px] leading-relaxed" style={{ color: `${theme.surface}dd` }}>{content.intro}</p>
              <p className="mt-4 text-[11px] uppercase tracking-[0.3em]" style={{ color: theme.gold }}>{content.dateLabel}</p>
            </Reveal>
          </div>
        </section>

        <CountdownBlock theme={theme} content={content} label="Until doors open" bg={theme.surface} />
        <StoryBlock theme={theme} content={content} bg={theme.surfaceAlt} />
        <EventsBlock theme={theme} content={content} variant="numbered" />
        <GalleryBlock theme={theme} content={content} variant="strip" />
        <VenueBlock theme={theme} content={content} bg={theme.surfaceAlt} />
        <RsvpBlock theme={theme} content={content} />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
