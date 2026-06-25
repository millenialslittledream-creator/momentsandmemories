import { useMemo, useState } from 'react';
import type { BirthdayTheme } from './birthdayThemes';
import type { BirthdayContent } from './birthdayContent';

export type BirthdayReveal = 'iris' | 'doors' | 'curtain';
type Stage = 'idle' | 'lifting' | 'revealing';

export default function BirthdayCover({
  theme, content, reveal = 'iris', onOpen,
}: {
  theme: BirthdayTheme;
  content: BirthdayContent;
  reveal?: BirthdayReveal;
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

  /* theme-matched birthday particles */
  const glyphSet =
    theme.partyStyle === 'star'     ? ['★', '✦', '✧', '⋆', '✩', '★'] :
    theme.partyStyle === 'confetti' ? ['◆', '●', '▲', '◇', '■', '◆'] :
                                      ['·', '◇', '○', '·', '◇', '·'];

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left:  Math.random() * 100,
        size:  6 + Math.random() * 18,
        dur:   8 + Math.random() * 13,
        delay: -Math.random() * 18,
        op:    0.18 + Math.random() * 0.5,
        glyph: glyphSet[i % glyphSet.length],
        rotate: Math.random() * 360,
      })),
    [],
  );

  const wrapStyle: React.CSSProperties =
    reveal === 'curtain'
      ? { transform: revealing ? 'translateY(-100%)' : 'translateY(0)', transition: 'transform 1100ms cubic-bezier(.76,0,.24,1)' }
      : reveal === 'iris'
      ? { clipPath: revealing ? 'circle(0% at 50% 44%)' : 'circle(150% at 50% 44%)', transition: 'clip-path 1100ms cubic-bezier(.76,0,.24,1)' }
      : {};

  return (
    <div className="absolute inset-0 z-30 overflow-hidden" style={wrapStyle}>

      {/* hero photo tinted for atmosphere */}
      {content.heroImageUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={content.heroImageUrl}
            alt=""
            className="w-full h-full object-cover inv-kb"
            style={{ opacity: 0.2, mixBlendMode: 'luminosity' }}
          />
        </div>
      )}

      {/* background layers */}
      <div className="absolute inset-0" style={{ background: theme.pageBg }} />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 85% 65% at 50% 38%, ${theme.gold}28, transparent 65%)`,
          animation: 'inv-glow 6s ease-in-out infinite',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 55% 45% at 15% 80%, ${theme.accent}28, transparent 58%)` }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 45% 38% at 85% 18%, ${theme.deep}55, transparent 55%)` }}
      />

      {/* door panels */}
      {reveal === 'doors' && (
        <>
          <div
            className="absolute inset-y-0 left-0 w-1/2 flex justify-end"
            style={{
              background: `linear-gradient(140deg, ${theme.deep}, ${theme.accent})`,
              transform: revealing ? 'translateX(-101%)' : 'translateX(0)',
              transition: 'transform 1100ms cubic-bezier(.76,0,.24,1)',
            }}>
            <span className="h-full w-px" style={{ background: `${theme.gold}aa` }} />
          </div>
          <div
            className="absolute inset-y-0 right-0 w-1/2 flex justify-start"
            style={{
              background: `linear-gradient(220deg, ${theme.deep}, ${theme.accent})`,
              transform: revealing ? 'translateX(101%)' : 'translateX(0)',
              transition: 'transform 1100ms cubic-bezier(.76,0,.24,1)',
            }}>
            <span className="h-full w-px" style={{ background: `${theme.gold}aa` }} />
          </div>
        </>
      )}

      {/* floating birthday particles */}
      {!revealing &&
        particles.map((p, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute bottom-0 select-none pointer-events-none"
            style={{
              left: `${p.left}%`,
              fontSize: p.size,
              color: i % 3 === 0 ? theme.accent : i % 3 === 1 ? theme.gold : theme.surface,
              opacity: lifting ? 0 : p.op,
              animation: `inv-drift ${p.dur}s linear ${p.delay}s infinite`,
              transition: 'opacity .55s ease',
              transform: `rotate(${p.rotate}deg)`,
            }}>
            {p.glyph}
          </span>
        ))}

      {/* cover content */}
      <button
        onClick={open}
        aria-label="Open birthday invitation"
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center cursor-pointer"
        style={{
          opacity:    lifting ? 0 : 1,
          transform:  lifting ? 'translateY(-26px) scale(0.97)' : 'none',
          transition: 'opacity 680ms ease, transform 820ms cubic-bezier(.16,1,.3,1)',
        }}>

        <span
          className="text-[9px] uppercase tracking-[0.5em] mb-6 inv-rise"
          style={{
            color: `${theme.surface}bb`,
            fontFamily: `'${theme.labelFont}', sans-serif`,
            animationDelay: '.1s',
          }}>
          You're Invited to Celebrate
        </span>

        {/* pulsing monogram ring */}
        <span
          className="relative inline-flex items-center justify-center rounded-full mb-5"
          style={{
            width: 88, height: 88,
            border: `1px solid ${theme.gold}99`,
            color: theme.gold,
            fontFamily: `'${theme.headingFont}', serif`,
            fontSize: '1.6rem',
            background: `radial-gradient(circle, ${theme.gold}0e, transparent 70%)`,
            animation: 'inv-breathe 4s ease-in-out infinite, inv-halo 5s ease-in-out infinite',
          }}>
          <span className="absolute rounded-full" style={{ inset: 6, border: `1px solid ${theme.gold}28` }} />
          {content.monogram}
        </span>

        {/* age — big vibrant display */}
        {content.age && (
          <span
            className="inv-rise block leading-none font-bold"
            style={{
              animationDelay: '.22s',
              color: theme.gold,
              fontFamily: `'${theme.headingFont}', serif`,
              fontSize: 'clamp(3.5rem,18vw,5.5rem)',
              lineHeight: 0.9,
            }}>
            {content.age}
          </span>
        )}

        <span
          className="inv-rise mt-2"
          style={{
            animationDelay: '.33s',
            color: theme.surface,
            fontFamily: `'${theme.scriptFont}', cursive`,
            fontSize: 'clamp(2.2rem,12vw,3.6rem)',
            lineHeight: 0.95,
          }}>
          {content.honoree}
        </span>

        <span
          className="inv-rise mt-3 text-[11px] italic"
          style={{ animationDelay: '.44s', color: `${theme.surface}99`, fontFamily: `'${theme.bodyFont}', serif` }}>
          {content.tagline}
        </span>

        <span
          className="inv-rise mt-2 text-[11px] tracking-[0.24em]"
          style={{ animationDelay: '.54s', color: theme.gold, fontFamily: `'${theme.headingFont}', serif` }}>
          {content.dateLabel}
        </span>

        {/* CTA */}
        <span
          className="inv-rise relative overflow-hidden mt-7 px-9 py-3 rounded-full"
          style={{
            animationDelay: '.68s',
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
          Let's Celebrate
        </span>

        <span
          className="mt-3 text-base"
          style={{ color: `${theme.surface}55`, animation: 'inv-float 2.5s ease-in-out infinite' }}>
          ﹀
        </span>
      </button>
    </div>
  );
}
