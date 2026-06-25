import { useMemo, useState } from 'react';
import type { InviteTheme } from './themes';
import type { InviteContent } from './inviteContent';

export type RevealStyle = 'iris' | 'doors' | 'curtain';
type Stage = 'idle' | 'lifting' | 'revealing';

/* The "first page" — an ambient animated cover with the couple's photo
   tinted behind atmospheric gradients. Tapping it runs a staged cinematic
   reveal then hands off to the invite. */
export default function CinematicCover({
  theme, content, reveal = 'iris', onOpen,
}: {
  theme: InviteTheme;
  content: InviteContent;
  reveal?: RevealStyle;
  onOpen: () => void;
}) {
  const [stage, setStage] = useState<Stage>('idle');
  const open = () => {
    if (stage !== 'idle') return;
    setStage('lifting');
    setTimeout(() => setStage('revealing'), 720);
    setTimeout(onOpen, 1850);
  };

  const lifting   = stage !== 'idle';
  const revealing = stage === 'revealing';

  /* theme-matched particle glyphs */
  const glyphs =
    theme.ornament === 'floral'  ? ['✿', '❧', '✾', '✦', '❁', '❋'] :
    theme.ornament === 'minimal' ? ['◇', '·', '✦', '·', '◇', '·'] :
                                   ['✦', '✧', '◇', '⋆', '✦', '✧'];

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        left:  Math.random() * 100,
        size:  6 + Math.random() * 17,
        dur:   9  + Math.random() * 14,
        delay: -Math.random() * 20,
        op:    0.18 + Math.random() * 0.48,
        glyph: glyphs[i % glyphs.length],
      })),
    [],
  );

  /* reveal transition on the cover wrapper */
  const wrapStyle: React.CSSProperties =
    reveal === 'curtain'
      ? { transform: revealing ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 1100ms cubic-bezier(.76,0,.24,1)' }
      : reveal === 'iris'
      ? { clipPath: revealing ? 'circle(0% at 50% 44%)' : 'circle(150% at 50% 44%)',
          transition: 'clip-path 1100ms cubic-bezier(.76,0,.24,1)' }
      : {}; /* doors handled separately below */

  return (
    <div className="absolute inset-0 z-30 overflow-hidden" style={wrapStyle}>

      {/* ── couple's photo tinted for atmosphere ──────────────────────── */}
      {content.heroImageUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={content.heroImageUrl}
            alt=""
            className="w-full h-full object-cover inv-kb"
            style={{ opacity: 0.22, mixBlendMode: 'luminosity' }}
          />
        </div>
      )}

      {/* ── background gradient world ─────────────────────────────────── */}
      <div className="absolute inset-0" style={{ background: theme.pageBg }} />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 65% at 50% 38%, ${theme.gold}2a, transparent 65%)`,
          animation: 'inv-glow 7s ease-in-out infinite',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 55% 45% at 18% 80%, ${theme.accent}30, transparent 60%)` }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 45% 38% at 82% 18%, ${theme.deep}55, transparent 60%)` }}
      />

      {/* ── door panels (only for reveal='doors') ─────────────────────── */}
      {reveal === 'doors' && (
        <>
          <div
            className="absolute inset-y-0 left-0 w-1/2 flex justify-end"
            style={{
              background: `linear-gradient(140deg, ${theme.deep}, ${theme.accent})`,
              transform: revealing ? 'translateX(-101%)' : 'translateX(0)',
              transition: 'transform 1100ms cubic-bezier(.76,0,.24,1)',
            }}>
            <span className="h-full w-px" style={{ background: `${theme.gold}bb` }} />
          </div>
          <div
            className="absolute inset-y-0 right-0 w-1/2 flex justify-start"
            style={{
              background: `linear-gradient(220deg, ${theme.deep}, ${theme.accent})`,
              transform: revealing ? 'translateX(101%)' : 'translateX(0)',
              transition: 'transform 1100ms cubic-bezier(.76,0,.24,1)',
            }}>
            <span className="h-full w-px" style={{ background: `${theme.gold}bb` }} />
          </div>
        </>
      )}

      {/* ── floating ambient particles ────────────────────────────────── */}
      {!revealing &&
        particles.map((p, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute bottom-0 select-none pointer-events-none"
            style={{
              left: `${p.left}%`,
              fontSize: p.size,
              color: theme.gold,
              opacity: lifting ? 0 : p.op,
              animation: `inv-drift ${p.dur}s linear ${p.delay}s infinite`,
              transition: 'opacity .6s ease',
            }}>
            {p.glyph}
          </span>
        ))}

      {/* ── cover content ─────────────────────────────────────────────── */}
      <button
        onClick={open}
        aria-label="Open invitation"
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center cursor-pointer"
        style={{
          opacity:    lifting ? 0 : 1,
          transform:  lifting ? 'translateY(-26px) scale(0.97)' : 'none',
          transition: 'opacity 680ms ease, transform 820ms cubic-bezier(.16,1,.3,1)',
        }}>

        <span
          className="text-[9px] uppercase tracking-[0.5em] mb-7 inv-rise"
          style={{
            color: `${theme.surface}bb`,
            fontFamily: `'${theme.labelFont}', sans-serif`,
            animationDelay: '.1s',
          }}>
          You Are Invited
        </span>

        {/* breathing monogram ring */}
        <span
          className="relative inline-flex items-center justify-center rounded-full mb-6"
          style={{
            width: 100, height: 100,
            border: `1px solid ${theme.gold}99`,
            color: theme.gold,
            fontFamily: `'${theme.headingFont}', serif`,
            fontSize: '1.8rem',
            background: `radial-gradient(circle, ${theme.gold}0d, transparent 70%)`,
            animation: 'inv-breathe 4.5s ease-in-out infinite, inv-halo 5s ease-in-out infinite',
          }}>
          <span
            className="absolute rounded-full"
            style={{ inset: 7, border: `1px solid ${theme.gold}2a` }}
          />
          {content.monogram}
        </span>

        <span
          className="inv-rise"
          style={{
            animationDelay: '.28s',
            color: theme.surface,
            fontFamily: `'${theme.scriptFont}', cursive`,
            fontSize: 'clamp(2.6rem,15vw,4.2rem)',
            lineHeight: 0.95,
          }}>
          {content.brideName}
        </span>
        <span
          className="inv-rise my-1 text-xl"
          style={{ animationDelay: '.38s', color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>
          &amp;
        </span>
        <span
          className="inv-rise"
          style={{
            animationDelay: '.48s',
            color: theme.surface,
            fontFamily: `'${theme.scriptFont}', cursive`,
            fontSize: 'clamp(2.6rem,15vw,4.2rem)',
            lineHeight: 0.95,
          }}>
          {content.groomName}
        </span>

        <span
          className="inv-rise mt-5 text-[11px] tracking-[0.28em]"
          style={{ animationDelay: '.58s', color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>
          {content.dateLabel}
        </span>

        {/* CTA with travelling sheen */}
        <span
          className="inv-rise relative overflow-hidden mt-8 px-9 py-3 rounded-full"
          style={{
            animationDelay: '.72s',
            border: `1px solid ${theme.gold}cc`,
            color: theme.surface,
            fontFamily: `'${theme.labelFont}', sans-serif`,
            fontSize: 10,
            letterSpacing: '0.34em',
            textTransform: 'uppercase',
            background: `linear-gradient(135deg, ${theme.gold}18, transparent)`,
          }}>
          <span
            className="absolute inset-y-0 w-1/3"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.gold}66, transparent)`,
              animation: 'inv-sheen 3.2s ease-in-out 1s infinite',
            }}
          />
          Open Invitation
        </span>

        <span
          className="mt-4 text-base"
          style={{ color: `${theme.surface}66`, animation: 'inv-float 2.5s ease-in-out infinite' }}>
          ﹀
        </span>
      </button>
    </div>
  );
}
