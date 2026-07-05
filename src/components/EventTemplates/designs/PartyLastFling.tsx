import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, TapCover, Confetti, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Pre-Wedding · "Last Fling" — high-energy party: confetti, marquee headline,
   ticket-style itinerary. */
export default function PartyLastFling({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles /><EventAnimStyles />
      {!opened && (
        <TapCover
          bg={`linear-gradient(150deg, ${theme.deep} 0%, ${theme.accent} 100%)`}
          accent={theme.surface} gold={theme.gold}
          label="One Last Fling Before The Ring" title={content.brideName} sub="Bachelorette Bash"
          hint="Let's go" icon="🥂" onOpen={() => setOpened(true)}
          ornaments={<Confetti colors={[theme.gold, theme.accentSoft, theme.surface]} count={30} />}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', sans-serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        {/* HERO — marquee */}
        <section className="relative px-6 pt-14 pb-12 text-center overflow-hidden" style={{ background: theme.deep }}>
          <Confetti colors={[theme.gold, theme.accentSoft, theme.accent]} count={18} />
          <Reveal variant="scale">
            <p className="text-[10px] uppercase tracking-[0.4em] mb-3" style={{ color: theme.gold }}>The bride-to-be</p>
            <h1 style={{ color: theme.surface, fontFamily: `'${theme.scriptFont}', cursive`, fontSize: 'clamp(3.4rem,18vw,5.6rem)', lineHeight: 0.85 }}>{content.brideName}</h1>
            <p className="mt-4 inline-block px-5 py-1.5 text-[11px] uppercase tracking-[0.3em]" style={{ border: `1px solid ${theme.gold}`, color: theme.gold }}>{content.dateLabel}</p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 mx-auto max-w-[250px] relative" style={{ boxShadow: `0 20px 50px ${theme.accent}55` }}>
              <img src={content.heroImageUrl} alt="" className="w-full aspect-[4/5] object-cover" />
              <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 0 6px ${theme.surface}55` }} />
            </div>
            <p className="mt-6 mx-auto max-w-[260px] text-[12.5px] leading-relaxed italic" style={{ color: `${theme.surface}cc` }}>{content.intro}</p>
          </Reveal>
        </section>

        <CountdownBlock theme={theme} content={content} label="Until the party starts" />
        <StoryBlock theme={theme} content={content} />
        <EventsBlock theme={theme} content={content} bg={theme.surfaceAlt} variant="ticket" />
        <GalleryBlock theme={theme} content={content} variant="polaroid" />
        <VenueBlock theme={theme} content={content} />
        <RsvpBlock theme={theme} content={content} />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
