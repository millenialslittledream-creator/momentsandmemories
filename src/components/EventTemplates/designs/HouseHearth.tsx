import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, Divider, FramedPhoto, TapCover, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Housewarming · "Hearth" — rustic & handcrafted: framed hero, ticket schedule,
   an intimate, earthy feel. */
export default function HouseHearth({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);
  const head = { color: theme.accent, fontFamily: `'${theme.headingFont}', serif` };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles /><EventAnimStyles />
      {!opened && (
        <TapCover
          bg={`radial-gradient(circle at 50% 40%, ${theme.accent} 0%, ${theme.deep} 100%)`}
          accent={theme.surface} gold={theme.gold}
          label="Gather By The Hearth" title={content.brideName} sub="A Housewarming"
          hint="Enter" icon="🔥" onOpen={() => setOpened(true)}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        {/* HERO — bordered rustic frame */}
        <section className="px-5 pt-10 pb-12" style={{ background: `linear-gradient(180deg, ${theme.surfaceAlt} 0%, ${theme.surface} 100%)` }}>
          <div style={{ padding: 2, border: `1px solid ${theme.gold}` }}>
            <div className="text-center py-8 px-4" style={{ border: `1px solid ${theme.gold}38` }}>
              <Reveal>
                <p className="text-[9px] uppercase tracking-[0.4em] mb-4" style={{ color: theme.muted }}>Home is where you are</p>
                <h1 style={{ ...head, fontFamily: `'${theme.scriptFont}', cursive`, fontSize: 'clamp(2.6rem,14vw,4.4rem)', lineHeight: 0.9 }}>{content.brideName}</h1>
                <Divider ornament={theme.ornament} color={theme.gold} />
                <p className="mx-auto max-w-[240px] text-[12px] leading-loose italic" style={{ color: theme.muted }}>{content.intro}</p>
                <p className="mt-5 text-[13px] tracking-[0.14em]" style={head}>{content.dateLabel}</p>
              </Reveal>
            </div>
          </div>
          <Reveal delay={100}>
            <div className="mt-7"><FramedPhoto src={content.heroImageUrl} gold={theme.gold} ratio="aspect-[4/3]" withGlow /></div>
          </Reveal>
        </section>

        <CountdownBlock theme={theme} content={content} label="Until we open our doors" />
        <StoryBlock theme={theme} content={content} variant="quote" bg={theme.surfaceAlt} />
        <EventsBlock theme={theme} content={content} variant="ticket" />
        <GalleryBlock theme={theme} content={content} variant="polaroid" bg={theme.surfaceAlt} />
        <VenueBlock theme={theme} content={content} />
        <RsvpBlock theme={theme} content={content} />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
