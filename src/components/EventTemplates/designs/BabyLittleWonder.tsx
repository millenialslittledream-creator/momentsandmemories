import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, Divider, TapCover, FloatingOrbs, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Baby Shower · "Little Wonder" — a storybook arch window framing the hero,
   soft numbered timeline, gentle rising bubbles. */
export default function BabyLittleWonder({ theme, content, autoOpen = false }: DesignProps) {
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
          label="Once Upon A Tiny Dream" title={content.brideName} sub="A Baby Shower"
          hint="Open the story" icon="🧸" onOpen={() => setOpened(true)}
          ornaments={<FloatingOrbs colors={[theme.accentSoft, theme.gold]} count={10} />}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        {/* HERO — arched storybook window */}
        <section className="px-6 pt-12 pb-12 text-center" style={{ background: theme.surfaceAlt }}>
          <Reveal variant="scale">
            <div className="mx-auto max-w-[230px] relative" style={{ borderRadius: '150px 150px 20px 20px', overflow: 'hidden', border: `4px solid ${theme.surface}`, boxShadow: `0 20px 50px ${theme.accent}33` }}>
              <img src={content.heroImageUrl} alt="" className="w-full aspect-[3/4] object-cover" />
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-7 text-[10px] uppercase tracking-[0.4em]" style={{ color: theme.muted }}>Please shower with love</p>
            <h1 className="mt-2" style={{ ...head, fontFamily: `'${theme.scriptFont}', cursive`, fontSize: 'clamp(2.8rem,15vw,4.4rem)', lineHeight: 0.9 }}>{content.brideName}</h1>
            <Divider ornament={theme.ornament} color={theme.gold} />
            <p className="mx-auto max-w-[250px] text-[12.5px] leading-loose italic" style={{ color: theme.muted }}>{content.intro}</p>
            <p className="mt-5 text-[13px] tracking-[0.16em]" style={head}>{content.dateLabel}</p>
          </Reveal>
        </section>

        <CountdownBlock theme={theme} content={content} label="Almost time to meet baby" />
        <StoryBlock theme={theme} content={content} variant="quote" />
        <EventsBlock theme={theme} content={content} bg={theme.accentSoft} variant="numbered" />
        <GalleryBlock theme={theme} content={content} variant="rounded" />
        <VenueBlock theme={theme} content={content} pill />
        <RsvpBlock theme={theme} content={content} pill />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
