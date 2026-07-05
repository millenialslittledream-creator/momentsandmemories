import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, Divider, TapCover, FloatingOrbs, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Others · "Soirée" — refined botanical: soft greenery world, rounded portrait,
   graceful and warm. */
export default function CustomSoiree({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  useEffect(() => setOpened(autoOpen), [autoOpen]);
  const head = { color: theme.accent, fontFamily: `'${theme.headingFont}', serif` };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles /><EventAnimStyles />
      {!opened && (
        <TapCover
          bg={`radial-gradient(circle at 50% 30%, ${theme.accent} 0%, ${theme.deep} 100%)`}
          accent={theme.surface} gold={theme.gold}
          label="An Evening To Remember" title={content.brideName} sub={content.dateLabel}
          hint="Open" icon="❦" onOpen={() => setOpened(true)}
          ornaments={<FloatingOrbs colors={[theme.accentSoft, theme.gold]} count={8} />}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        <section className="px-6 pt-12 pb-12 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.42em] mb-3" style={{ color: theme.muted }}>Together we celebrate</p>
            <h1 style={{ ...head, fontFamily: `'${theme.scriptFont}', cursive`, fontSize: 'clamp(2.8rem,15vw,4.6rem)', lineHeight: 0.9 }}>{content.brideName}</h1>
            <Divider ornament={theme.ornament} color={theme.gold} />
          </Reveal>
          <Reveal delay={120}>
            <div className="mx-auto max-w-[240px]" style={{ borderRadius: '50% 50% 50% 50% / 55% 55% 45% 45%', overflow: 'hidden', border: `3px solid ${theme.surface}`, boxShadow: `0 18px 44px ${theme.accent}2e` }}>
              <img src={content.heroImageUrl} alt="" className="w-full aspect-[4/5] object-cover" />
            </div>
            <p className="mt-6 mx-auto max-w-[260px] text-[12.5px] leading-loose italic" style={{ color: theme.muted }}>{content.intro}</p>
            <p className="mt-4 text-[13px] tracking-[0.16em]" style={head}>{content.dateLabel}</p>
          </Reveal>
        </section>

        <CountdownBlock theme={theme} content={content} label="Until the evening" />
        <StoryBlock theme={theme} content={content} variant="quote" />
        <EventsBlock theme={theme} content={content} bg={theme.surfaceAlt} variant="bubble" />
        <GalleryBlock theme={theme} content={content} variant="strip" />
        <VenueBlock theme={theme} content={content} pill />
        <RsvpBlock theme={theme} content={content} pill />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
