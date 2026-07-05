import { useEffect, useState } from 'react';
import { AnimStyles, EventAnimStyles, Reveal, TapCover, Confetti, type DesignProps } from '../eventParts';
import { CountdownBlock, StoryBlock, EventsBlock, GalleryBlock, VenueBlock, RsvpBlock, FooterBlock } from '../sections';

/* Gender Reveal · "The Big Reveal" — a split blue-vs-pink hero with a live
   "cast your vote" toggle and a confetti burst. Playful suspense. */
const BLUE = '#3d7bd0';
const PINK = '#e06b9c';

export default function RevealBigReveal({ theme, content, autoOpen = false }: DesignProps) {
  const [opened, setOpened] = useState(autoOpen);
  const [vote, setVote] = useState<'boy' | 'girl' | null>(null);
  useEffect(() => setOpened(autoOpen), [autoOpen]);
  const head = { color: theme.accent, fontFamily: `'${theme.headingFont}', serif` };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: theme.pageBg }}>
      <AnimStyles /><EventAnimStyles />
      {!opened && (
        <TapCover
          bg={`linear-gradient(115deg, ${BLUE} 0%, ${BLUE} 48%, ${PINK} 52%, ${PINK} 100%)`}
          accent="#ffffff" gold="#ffffff"
          label="Boy Or Girl?" title="The Big Reveal" sub={content.dateLabel}
          hint="Find out" icon="🎈" onOpen={() => setOpened(true)}
          ornaments={<Confetti colors={['#ffffff', BLUE, PINK]} count={26} />}
        />
      )}
      <div data-lenis-prevent className="h-full overflow-y-auto scroll-smooth"
        style={{ background: theme.surface, color: theme.ink, fontFamily: `'${theme.bodyFont}', sans-serif`, opacity: opened ? 1 : 0, transition: 'opacity 900ms ease 200ms' }}>

        {/* HERO — split blue/pink */}
        <section className="relative overflow-hidden text-center px-6 pt-12 pb-14"
          style={{ background: `linear-gradient(110deg, ${BLUE}22 0%, ${BLUE}22 48%, ${PINK}22 52%, ${PINK}22 100%)` }}>
          {vote && <Confetti colors={vote === 'boy' ? ['#ffffff', BLUE] : ['#ffffff', PINK]} count={22} />}
          <Reveal variant="scale">
            <p className="text-[10px] uppercase tracking-[0.4em] mb-3" style={{ color: theme.muted }}>The wait is almost over</p>
            <h1 style={{ fontFamily: `'${theme.headingFont}', serif`, fontSize: 'clamp(2.6rem,13vw,4rem)', lineHeight: 0.92, color: theme.accent }}>
              <span style={{ color: BLUE }}>He</span> <span className="opacity-50">or</span> <span style={{ color: PINK }}>She?</span>
            </h1>
            <p className="mt-4 mx-auto max-w-[260px] text-[12.5px] leading-relaxed italic" style={{ color: theme.muted }}>{content.intro}</p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-7 flex items-center justify-center gap-3">
              {(['boy', 'girl'] as const).map((g) => (
                <button key={g} onClick={() => setVote(g)}
                  className="px-6 py-2.5 text-[11px] uppercase tracking-[0.24em] transition-all"
                  style={{
                    background: vote === g ? (g === 'boy' ? BLUE : PINK) : 'transparent',
                    color: vote === g ? '#fff' : (g === 'boy' ? BLUE : PINK),
                    border: `1.5px solid ${g === 'boy' ? BLUE : PINK}`,
                    borderRadius: 999, transform: vote === g ? 'scale(1.06)' : 'scale(1)',
                  }}>
                  Team {g === 'boy' ? 'Blue' : 'Pink'}
                </button>
              ))}
            </div>
            {vote && <p className="mt-3 text-[11px]" style={{ color: vote === 'boy' ? BLUE : PINK }}>You're on Team {vote === 'boy' ? 'Blue' : 'Pink'}! 🎉</p>}
            <div className="mt-7 mx-auto max-w-[240px]" style={{ borderRadius: 20, overflow: 'hidden', boxShadow: `0 18px 44px ${theme.accent}33` }}>
              <img src={content.heroImageUrl} alt="" className="w-full aspect-[4/3] object-cover" />
            </div>
            <p className="mt-5 text-[13px] tracking-[0.16em]" style={head}>{content.dateLabel}</p>
          </Reveal>
        </section>

        <CountdownBlock theme={theme} content={content} label="Until the confetti flies" />
        <StoryBlock theme={theme} content={content} />
        <EventsBlock theme={theme} content={content} bg={theme.surfaceAlt} variant="timeline" />
        <GalleryBlock theme={theme} content={content} variant="rounded" />
        <VenueBlock theme={theme} content={content} pill />
        <RsvpBlock theme={theme} content={content} pill />
        <FooterBlock theme={theme} content={content} />
      </div>
    </div>
  );
}
