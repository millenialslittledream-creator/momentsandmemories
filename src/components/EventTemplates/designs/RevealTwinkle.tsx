import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, Divider, TapCover, Starfield, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Gender Reveal · "Twinkle Twinkle" — starry night, "little star" theme,
   dreamy and gentle. */
export default function RevealTwinkle({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles /><EventAnimStyles />
      {!opened && (
        <TapCover
          bg={`radial-gradient(circle at 50% 20%, ${theme.accent} 0%, ${theme.deep} 70%, ${theme.pageBg} 100%)`}
          accent={theme.surface} gold={theme.gold}
          label="Twinkle Twinkle Little Star" title="What Will You Be?" sub={content.dateLabel}
          hint="Make a wish" icon="⭐" onOpen={() => setOpened(true)}
          ornaments={<Starfield color={theme.surface} count={40} />}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        {/* HERO — night sky */}
        <section className="relative px-6 pt-14 pb-12 text-center overflow-hidden" style={{ background: theme.deep }}>
          <Starfield color={theme.surface} count={26} />
          <Reveal variant="scale">
            <p className="text-[10px] uppercase tracking-[0.42em] mb-3" style={{ color: theme.gold }}>Our little star arrives</p>
            <h1 style={{ color: theme.surface, fontFamily: `'${theme.scriptFont}', cursive`, fontSize: 'clamp(3rem,16vw,5rem)', lineHeight: 0.88 }}>{content.brideName}</h1>
            <Divider ornament={theme.ornament} color={theme.gold} />
            <p className="mx-auto max-w-[260px] text-[12.5px] leading-loose italic" style={{ color: `${theme.surface}cc` }}>{content.intro}</p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 mx-auto max-w-[230px]" style={{ borderRadius: 999, overflow: 'hidden', border: `3px solid ${theme.gold}66`, boxShadow: `0 0 50px ${theme.gold}44`, animation: 'inv-float 6s ease-in-out infinite' }}>
              <img src={content.heroImageUrl} alt="" className="w-full aspect-square object-cover" />
            </div>
            <p className="mt-6 text-[13px] tracking-[0.16em]" style={{ color: theme.gold }}>{content.dateLabel}</p>
          </Reveal>
        </section>

        <CountdownBlock theme={theme} content={content} label="Until we know" />
        <StoryBlock theme={theme} content={content} variant="quote" />
        <EventsBlock theme={theme} content={content} bg={theme.surfaceAlt} variant="numbered" />
        <GalleryBlock theme={theme} content={content} variant="polaroid" />
        <VenueBlock theme={theme} content={content} pill />
        <RsvpBlock theme={theme} content={content} pill />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
