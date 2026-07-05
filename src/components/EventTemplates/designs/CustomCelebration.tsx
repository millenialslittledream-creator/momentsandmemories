import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, Divider, WaxSeal, FramedPhoto, TapCover, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Others · "Celebration" — timeless & universal: wax seal, framed hero, golden
   elegance that suits any occasion. */
export default function CustomCelebration({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);
  const head = { color: theme.accent, fontFamily: `'${theme.headingFont}', serif` };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles /><EventAnimStyles />
      {!opened && (
        <TapCover
          bg={`linear-gradient(180deg, ${theme.deep} 0%, ${theme.accent} 100%)`}
          accent={theme.surface} gold={theme.gold}
          label="You're Invited" title={content.brideName} sub={content.dateLabel}
          hint="Open invitation" icon="✦" onOpen={() => setOpened(true)}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        <section className="px-5 pt-10 pb-12" style={{ background: `linear-gradient(180deg, ${theme.surfaceAlt} 0%, ${theme.surface} 100%)` }}>
          <div style={{ padding: 2, border: `1px solid ${theme.gold}` }}>
            <div className="text-center py-9 px-4" style={{ border: `1px solid ${theme.gold}38` }}>
              <Reveal variant="scale">
                <div className="flex justify-center mb-5"><WaxSeal monogram={content.monogram} gold={theme.gold} accent={theme.accent} scriptFont={theme.headingFont} size={70} /></div>
              </Reveal>
              <Reveal delay={60}>
                <p className="text-[9px] uppercase tracking-[0.4em] mb-3" style={{ color: theme.muted }}>Please join us for</p>
                <h1 style={{ ...head, fontFamily: `'${theme.scriptFont}', cursive`, fontSize: 'clamp(2.6rem,13vw,4.4rem)', lineHeight: 0.9 }}>{content.brideName}</h1>
                <Divider ornament={theme.ornament} color={theme.gold} />
                <p className="mx-auto max-w-[240px] text-[12px] leading-loose italic" style={{ color: theme.muted }}>{content.intro}</p>
                <p className="mt-5 text-[13px] tracking-[0.14em]" style={head}>{content.dateLabel}</p>
              </Reveal>
            </div>
          </div>
          <Reveal delay={100}><div className="mt-7"><FramedPhoto src={content.heroImageUrl} gold={theme.gold} ratio="aspect-[4/3]" withGlow /></div></Reveal>
        </section>

        <CountdownBlock theme={theme} content={content} label="Counting down" />
        <StoryBlock theme={theme} content={content} variant="quote" bg={theme.surfaceAlt} />
        <EventsBlock theme={theme} content={content} variant="card-left" />
        <GalleryBlock theme={theme} content={content} variant="polaroid" bg={theme.surfaceAlt} />
        <VenueBlock theme={theme} content={content} />
        <RsvpBlock theme={theme} content={content} />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
