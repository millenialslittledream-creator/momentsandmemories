import { useEffect, useRef, useState } from 'react';
import type { InviteTheme, OrnamentStyle } from './themes';

/* keyframes -------------------------------------------------------------- */
export function AnimStyles() {
  return (
    <style>{`
      @keyframes inv-kenburns {
        0%   { transform: scale(1.05) translate(0%, 0%) }
        100% { transform: scale(1.18) translate(-2%, -1.5%) }
      }
      @keyframes inv-shimmer {
        0%   { background-position: -220% 0 }
        100% { background-position: 320%  0 }
      }
      @keyframes inv-float {
        0%, 100% { transform: translateY(0) }
        50%       { transform: translateY(-8px) }
      }
      @keyframes inv-drift {
        0%   { transform: translateY(10vh) rotate(0deg) scale(0.8); opacity: 0 }
        10%  { opacity: .7 }
        90%  { opacity: .45 }
        100% { transform: translateY(-112vh) rotate(210deg) scale(1.1); opacity: 0 }
      }
      @keyframes inv-glow {
        0%, 100% { opacity: .18; transform: scale(1) }
        50%       { opacity: .52; transform: scale(1.15) }
      }
      @keyframes inv-breathe {
        0%, 100% { transform: scale(1) }
        50%       { transform: scale(1.07) }
      }
      @keyframes inv-sheen {
        0%        { transform: translateX(-130%) }
        55%, 100% { transform: translateX(260%) }
      }
      @keyframes inv-rise {
        from { opacity: 0; transform: translateY(30px); filter: blur(5px) }
        to   { opacity: 1; transform: none;             filter: blur(0)  }
      }
      @keyframes inv-halo {
        0%, 100% { box-shadow: 0 0 0 0px  rgba(193,154,75,0)    }
        50%       { box-shadow: 0 0 0 14px rgba(193,154,75,0.07) }
      }
      @keyframes inv-wax-in {
        0%   { transform: scale(0.45) rotate(-22deg); opacity: 0; filter: blur(12px) }
        65%  { transform: scale(1.10) rotate(4deg) }
        100% { transform: scale(1) rotate(0deg);    opacity: 1; filter: blur(0)  }
      }
      @keyframes inv-num-in {
        0%   { transform: translateY(-110%); opacity: 0; filter: blur(3px) }
        100% { transform: translateY(0);     opacity: 1; filter: blur(0)  }
      }
      @keyframes inv-line-grow {
        from { transform: scaleX(0); transform-origin: left center }
        to   { transform: scaleX(1); transform-origin: left center }
      }
      .inv-kb   { animation: inv-kenburns 24s ease-in-out infinite alternate }
      .inv-rise { animation: inv-rise .9s cubic-bezier(.16,1,.3,1) both }
      .inv-line { animation: inv-line-grow .85s cubic-bezier(.16,1,.3,1) both }
      @media (prefers-reduced-motion: reduce) {
        .inv-kb, .inv-rise, .inv-line { animation: none }
      }
    `}</style>
  );
}

/* reveal-on-scroll ------------------------------------------------------- */
type RevealVariant = 'up' | 'left' | 'right' | 'scale' | 'blur';
const HIDDEN_T: Record<RevealVariant, string> = {
  up:    'translateY(34px)',
  left:  'translateX(-34px)',
  right: 'translateX(34px)',
  scale: 'scale(0.90)',
  blur:  'translateY(14px)',
};
const HIDDEN_F: Record<RevealVariant, string> = {
  up:    'blur(5px)',
  left:  'blur(4px)',
  right: 'blur(4px)',
  scale: 'blur(6px)',
  blur:  'blur(12px)',
};

export function Reveal({
  children, delay = 0, variant = 'up',
}: {
  children: React.ReactNode; delay?: number; variant?: RevealVariant;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current; if (!node) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setShown(true); return; }
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setShown(true), io.disconnect()),
      { threshold: 0.10 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        transform: shown ? 'none' : HIDDEN_T[variant],
        filter: shown ? 'blur(0px)' : HIDDEN_F[variant],
        opacity: shown ? 1 : 0,
        transition: 'opacity 1100ms cubic-bezier(.16,1,.3,1), transform 1100ms cubic-bezier(.16,1,.3,1), filter 1100ms cubic-bezier(.16,1,.3,1)',
      }}>
      {children}
    </div>
  );
}

/* wax seal --------------------------------------------------------------- */
export function WaxSeal({
  monogram, gold, accent, scriptFont = 'Cormorant Garamond', size = 80,
}: {
  monogram: string; gold: string; accent: string; scriptFont?: string; size?: number;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full relative select-none"
      style={{
        width: size, height: size, flexShrink: 0,
        background: `radial-gradient(circle at 36% 32%, ${accent}dd 0%, ${accent} 80%)`,
        boxShadow: `0 0 0 2.5px ${gold}bb, 0 0 0 5px ${gold}1a, 0 8px 32px ${accent}44, 0 2px 8px rgba(0,0,0,.28)`,
        animation: 'inv-wax-in 1.35s cubic-bezier(.16,1,.3,1) .35s both, inv-halo 5.5s ease-in-out 1.7s infinite',
      }}>
      <span
        className="absolute rounded-full pointer-events-none"
        style={{ inset: 5, border: `1px solid ${gold}40` }}
      />
      <span style={{
        color: gold,
        fontFamily: `'${scriptFont}', serif`,
        fontSize: size * 0.36,
        lineHeight: 1,
        position: 'relative',
        textShadow: `0 1px 5px rgba(0,0,0,.3)`,
      }}>
        {monogram}
      </span>
    </span>
  );
}

/* slow-zoom photo -------------------------------------------------------- */
export function KenBurns({
  src, className = '', imgClass = '',
}: {
  src: string; className?: string; imgClass?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <img src={src} alt="" className={`w-full h-full object-cover inv-kb ${imgClass}`} />
    </div>
  );
}

/* ornamental divider (shimmer on gold line) ------------------------------ */
export function Divider({
  ornament, color, className = '',
}: {
  ornament: OrnamentStyle; color: string; className?: string;
}) {
  const shimmer = (dir: 'l' | 'r'): React.CSSProperties => ({
    backgroundImage: `linear-gradient(90deg,
      ${dir === 'l' ? 'transparent' : color},
      ${dir === 'l' ? color : 'transparent'},
      ${dir === 'l' ? 'transparent' : color})`,
    backgroundSize: '250% 100%',
    animation: 'inv-shimmer 4.5s linear infinite',
  });

  if (ornament === 'minimal') {
    return (
      <div className={`flex items-center justify-center gap-3 my-7 ${className}`} aria-hidden>
        <span style={shimmer('l')} className="h-px w-16" />
        <span style={{ borderColor: color }} className="h-1.5 w-1.5 rotate-45 border" />
        <span style={shimmer('r')} className="h-px w-16" />
      </div>
    );
  }
  if (ornament === 'floral') {
    return (
      <div
        className={`flex items-center justify-center gap-2 my-7 text-xl leading-none ${className}`}
        style={{ color }}
        aria-hidden>
        <span className="opacity-40">❧</span>
        <span style={{ animation: 'inv-float 4s ease-in-out infinite' }}>✿</span>
        <span className="opacity-40 scale-x-[-1]">❧</span>
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-center gap-3 my-7 ${className}`} style={{ color }} aria-hidden>
      <span style={shimmer('l')} className="h-px w-20" />
      <span className="text-base" style={{ animation: 'inv-float 5s ease-in-out infinite' }}>✦</span>
      <span style={shimmer('r')} className="h-px w-20" />
    </div>
  );
}

/* live countdown — digits animate on change ------------------------------ */
export function Countdown({
  dateISO, theme, light = false,
}: {
  dateISO: string; theme: InviteTheme; light?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(dateISO).getTime() - now);
  const cells = [
    { v: Math.floor(diff / 86400000), l: 'Days' },
    { v: Math.floor((diff % 86400000) / 3600000), l: 'Hrs' },
    { v: Math.floor((diff % 3600000) / 60000), l: 'Min' },
    { v: Math.floor((diff % 60000) / 1000), l: 'Sec' },
  ];
  const numColor   = light ? theme.surface : theme.accent;
  const labelColor = light ? `${theme.surface}88` : theme.muted;
  return (
    <div className="flex justify-center gap-3 md:gap-5">
      {cells.map((c) => (
        <div key={c.l} className="flex flex-col items-center">
          <div
            className="relative overflow-hidden flex items-center justify-center"
            style={{
              width: 62, height: 62,
              border: `1px solid ${theme.gold}50`,
              background: light ? 'rgba(255,255,255,.07)' : theme.surfaceAlt,
              color: numColor,
              fontFamily: `'${theme.headingFont}', serif`,
              fontSize: '1.4rem',
              boxShadow: `inset 0 1px 0 ${theme.gold}1a, 0 4px 16px rgba(0,0,0,.06)`,
            }}>
            {/* key on value so React remounts the span → CSS animation fires on change */}
            <span
              key={`${c.l}-${c.v}`}
              style={{ animation: 'inv-num-in .32s cubic-bezier(.16,1,.3,1) both' }}>
              {String(c.v).padStart(2, '0')}
            </span>
          </div>
          <span
            className="mt-1.5 text-[8px] uppercase tracking-[0.28em]"
            style={{ color: labelColor, fontFamily: `'${theme.labelFont}', sans-serif` }}>
            {c.l}
          </span>
        </div>
      ))}
    </div>
  );
}

/* corner-framed photo ---------------------------------------------------- */
export function FramedPhoto({
  src, gold, ratio = 'aspect-[4/3]', withGlow = false,
}: {
  src: string; gold: string; ratio?: string; withGlow?: boolean;
}) {
  return (
    <div className="relative mx-auto w-full">
      <KenBurns src={src} className={`w-full ${ratio}`} />
      {([
        '-top-2.5 -left-2.5 border-t-2 border-l-2',
        '-top-2.5 -right-2.5 border-t-2 border-r-2',
        '-bottom-2.5 -left-2.5 border-b-2 border-l-2',
        '-bottom-2.5 -right-2.5 border-b-2 border-r-2',
      ] as const).map((c) => (
        <span key={c} className={`absolute w-7 h-7 ${c}`} style={{ borderColor: gold }} />
      ))}
      {withGlow && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: `inset 0 0 50px ${gold}18` }}
        />
      )}
    </div>
  );
}

/* shared props ----------------------------------------------------------- */
export interface DesignProps {
  theme: InviteTheme;
  content: import('./inviteContent').InviteContent;
  autoOpen?: boolean;
}
