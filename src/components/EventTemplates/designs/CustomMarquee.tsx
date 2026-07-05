import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, TapCover, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Others · "Marquee" — bold modern editorial: giant masthead, ink & pearl,
   strong grid. */
export default function CustomMarquee({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles /><EventAnimStyles />
      {!opened && (
        <TapCover
          bg={theme.pageBg} accent={theme.surface} gold={theme.gold}
          label="Save The Date" title={content.brideName} sub={content.dateLabel}
          hint="Enter" icon="—" onOpen={() => setOpened(true)}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', sans-serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        {/* HERO — oversized masthead */}
        <section className="px-6 pt-12 pb-10" style={{ background: theme.surface, borderBottom: `1px solid ${theme.ink}22` }}>
          <Reveal>
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.28em] pb-4" style={{ color: theme.muted }}>
              <span>The Invitation</span><span>{content.dateLabel}</span>
            </div>
            <h1 className="uppercase" style={{ color: theme.accent, fontFamily: `'${theme.headingFont}', serif`, fontSize: 'clamp(2.8rem,16vw,5rem)', lineHeight: 0.84, letterSpacing: '-0.02em' }}>{content.brideName}</h1>
            <p className="mt-5 max-w-[320px] text-[13px] leading-relaxed" style={{ color: theme.ink }}>{content.intro}</p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-7 overflow-hidden"><img src={content.heroImageUrl} alt="" className="w-full aspect-[16/10] object-cover inv-kb" /></div>
          </Reveal>
        </section>

        <CountdownBlock theme={theme} content={content} label="Time remaining" bg={theme.surfaceAlt} />
        <StoryBlock theme={theme} content={content} />
        <EventsBlock theme={theme} content={content} bg={theme.surfaceAlt} variant="numbered" />
        <GalleryBlock theme={theme} content={content} variant="grid" />
        <VenueBlock theme={theme} content={content} bg={theme.surfaceAlt} />
        <RsvpBlock theme={theme} content={content} />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
