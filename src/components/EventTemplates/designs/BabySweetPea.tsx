import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, TapCover, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Baby Shower · "Sweet Pea" — modern editorial: oversized type, full-bleed hero,
   a minimal masthead. Clean and contemporary. */
export default function BabySweetPea({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles /><EventAnimStyles />
      {!opened && (
        <TapCover
          bg={theme.deep} accent={theme.surface} gold={theme.gold}
          label="Baby Shower" title={content.brideName} sub={content.dateLabel}
          hint="Enter" icon="🌸" onOpen={() => setOpened(true)}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', sans-serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        {/* HERO — full-bleed image with masthead overlay */}
        <section className="relative h-[78vh] min-h-[440px] overflow-hidden flex items-end">
          <img src={content.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover inv-kb" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${theme.deep}22 0%, ${theme.deep}dd 100%)` }} />
          <div className="relative px-6 pb-9 w-full">
            <Reveal>
              <p className="text-[10px] uppercase tracking-[0.5em] mb-2" style={{ color: theme.surface }}>The sweetest little</p>
              <h1 className="uppercase" style={{ color: theme.surface, fontFamily: `'${theme.headingFont}', serif`, fontSize: 'clamp(2.6rem,15vw,4.4rem)', lineHeight: 0.86, letterSpacing: '-0.01em' }}>{content.brideName}</h1>
              <div className="mt-4 h-px w-24" style={{ background: theme.gold }} />
              <p className="mt-4 max-w-[280px] text-[12.5px] leading-relaxed" style={{ color: `${theme.surface}dd` }}>{content.intro}</p>
              <p className="mt-4 text-[11px] uppercase tracking-[0.3em]" style={{ color: theme.gold }}>{content.dateLabel}</p>
            </Reveal>
          </div>
        </section>

        <CountdownBlock theme={theme} content={content} label="The countdown" bg={theme.surface} />
        <StoryBlock theme={theme} content={content} bg={theme.surfaceAlt} />
        <EventsBlock theme={theme} content={content} variant="timeline" />
        <GalleryBlock theme={theme} content={content} variant="strip" />
        <VenueBlock theme={theme} content={content} bg={theme.surfaceAlt} />
        <RsvpBlock theme={theme} content={content} />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
