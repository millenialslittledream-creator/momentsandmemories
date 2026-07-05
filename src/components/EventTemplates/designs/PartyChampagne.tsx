import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, TapCover, Starfield, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Pre-Wedding · "Champagne" — noir glam: black masthead, gold sheen, numbered
   itinerary. Sophisticated night-out energy. */
export default function PartyChampagne({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles /><EventAnimStyles />
      {!opened && (
        <TapCover
          bg={theme.pageBg} accent={theme.gold} gold={theme.gold}
          label="Pop, Fizz, Clink" title={content.brideName} sub="A Glamorous Send-Off"
          hint="Enter the night" icon="🍾" onOpen={() => setOpened(true)}
          ornaments={<Starfield color={theme.gold} count={30} />}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', sans-serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        {/* HERO — dark masthead with gold sheen */}
        <section className="relative px-6 pt-14 pb-12 text-center overflow-hidden" style={{ background: theme.pageBg }}>
          <Starfield color={theme.gold} count={18} />
          <Reveal variant="scale">
            <p className="text-[10px] uppercase tracking-[0.5em] mb-3" style={{ color: theme.gold }}>Here's to the bride</p>
            <h1 className="relative inline-block overflow-hidden" style={{ color: theme.surface, fontFamily: `'${theme.headingFont}', serif`, fontSize: 'clamp(3rem,16vw,5rem)', lineHeight: 0.9 }}>
              {content.brideName}
              <span className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(120deg, transparent 30%, ${theme.gold}55 50%, transparent 70%)`, animation: 'ev-shine 4.5s ease-in-out infinite' }} />
            </h1>
            <p className="mt-4 inline-block px-5 py-1.5 text-[11px] uppercase tracking-[0.32em]" style={{ border: `1px solid ${theme.gold}66`, color: theme.gold }}>{content.dateLabel}</p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 mx-auto max-w-[250px]" style={{ boxShadow: `0 20px 50px rgba(0,0,0,.5)` }}>
              <img src={content.heroImageUrl} alt="" className="w-full aspect-[4/5] object-cover" />
            </div>
            <p className="mt-6 mx-auto max-w-[260px] text-[12.5px] leading-relaxed italic" style={{ color: `${theme.surface}bb` }}>{content.intro}</p>
          </Reveal>
        </section>

        <CountdownBlock theme={theme} content={content} label="Until the celebration" bg={theme.surfaceAlt} />
        <StoryBlock theme={theme} content={content} />
        <EventsBlock theme={theme} content={content} bg={theme.surfaceAlt} variant="numbered" />
        <GalleryBlock theme={theme} content={content} variant="grid" />
        <VenueBlock theme={theme} content={content} />
        <RsvpBlock theme={theme} content={content} />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
