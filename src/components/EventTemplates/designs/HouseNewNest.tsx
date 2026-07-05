import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, Divider, TapCover, StringLights, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Housewarming · "New Nest" — warm & cozy: string lights, a framed doorway
   hero, hearth-toned cards. */
export default function HouseNewNest({ theme, content, autoOpen = false }: DesignProps) {
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
          label="We've Found Home" title={content.brideName} sub="Housewarming"
          hint="Come on in" icon="🏡" onOpen={() => setOpened(true)}
          ornaments={<StringLights color={theme.gold} count={16} />}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        {/* HERO — lit doorway */}
        <section className="relative px-6 pt-14 pb-12 text-center" style={{ background: theme.surfaceAlt }}>
          <StringLights color={theme.gold} count={14} />
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.42em] mb-3 mt-4" style={{ color: theme.muted }}>Please join us to warm our new home</p>
            <h1 style={{ ...head, fontFamily: `'${theme.scriptFont}', cursive`, fontSize: 'clamp(2.8rem,15vw,4.6rem)', lineHeight: 0.9 }}>{content.brideName}</h1>
            <Divider ornament={theme.ornament} color={theme.gold} />
          </Reveal>
          <Reveal delay={120}>
            <div className="mx-auto max-w-[240px] relative" style={{ borderRadius: '120px 120px 8px 8px', overflow: 'hidden', border: `3px solid ${theme.gold}55`, boxShadow: `0 18px 44px ${theme.accent}33` }}>
              <img src={content.heroImageUrl} alt="" className="w-full aspect-[3/4] object-cover" />
            </div>
            <p className="mt-6 mx-auto max-w-[260px] text-[12.5px] leading-loose italic" style={{ color: theme.muted }}>{content.intro}</p>
            <p className="mt-4 text-[13px] tracking-[0.16em]" style={head}>{content.dateLabel}</p>
          </Reveal>
        </section>

        <CountdownBlock theme={theme} content={content} label="Until we gather" />
        <StoryBlock theme={theme} content={content} variant="quote" />
        <EventsBlock theme={theme} content={content} bg={theme.surfaceAlt} variant="card-left" />
        <GalleryBlock theme={theme} content={content} variant="rounded" />
        <VenueBlock theme={theme} content={content} pill />
        <RsvpBlock theme={theme} content={content} pill />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
