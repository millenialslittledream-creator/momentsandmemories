// Decorative, animated primitives shared across the bespoke event-website
// designs. These are content-agnostic — they take colours/props, never the
// content model — so any design can compose them freely. The base motion
// primitives (Reveal, Countdown, Divider, FramedPhoto, WaxSeal, KenBurns,
// AnimStyles) are re-exported from the proven wedding invite parts.

import { useMemo, useState } from 'react';

export {
  AnimStyles,
  Reveal,
  Divider,
  Countdown,
  FramedPhoto,
  WaxSeal,
  KenBurns,
  type DesignProps,
} from '../WebsiteTemplates/inviteParts';
export type { InviteTheme, OrnamentStyle } from '../WebsiteTemplates/themes';
export type { InviteContent, EventItem } from '../WebsiteTemplates/inviteContent';

/* ── extra keyframes used by the decorative pieces below ─────────────────── */
export function EventAnimStyles() {
  return (
    <style>{`
      @keyframes ev-fall {
        0%   { transform: translateY(-12vh) rotate(0deg);   opacity: 0 }
        8%   { opacity: 1 }
        100% { transform: translateY(112vh) rotate(540deg); opacity: .9 }
      }
      @keyframes ev-rise {
        0%   { transform: translateY(10vh) scale(.7);  opacity: 0 }
        12%  { opacity: .85 }
        100% { transform: translateY(-115vh) scale(1); opacity: 0 }
      }
      @keyframes ev-sway {
        0%,100% { transform: translateX(0)     rotate(-3deg) }
        50%     { transform: translateX(6px)   rotate(3deg)  }
      }
      @keyframes ev-drift {
        0%   { transform: translateX(-8%) }
        100% { transform: translateX(108%) }
      }
      @keyframes ev-twinkle {
        0%,100% { opacity: .25; transform: scale(.85) }
        50%     { opacity: 1;   transform: scale(1.15) }
      }
      @keyframes ev-pop {
        0%   { transform: scale(0) rotate(-30deg); opacity: 0 }
        70%  { transform: scale(1.15) rotate(6deg) }
        100% { transform: scale(1) rotate(0deg);   opacity: 1 }
      }
      @keyframes ev-pulse-ring {
        0%   { transform: scale(.6); opacity: .7 }
        100% { transform: scale(2.4); opacity: 0 }
      }
      @keyframes ev-flicker {
        0%,100% { opacity: 1 }
        45%     { opacity: .78 }
        70%     { opacity: .92 }
      }
      @keyframes ev-shine {
        0%   { transform: translateX(-140%) skewX(-18deg) }
        60%,100% { transform: translateX(260%) skewX(-18deg) }
      }
      @keyframes ev-spin { to { transform: rotate(360deg) } }
    `}</style>
  );
}

type Sprite = { left: number; delay: number; dur: number; size: number; hue?: string; rot: number };

function useSprites(count: number, seed: number, colors: string[]): Sprite[] {
  return useMemo(() => {
    // deterministic pseudo-random so it stays stable across re-renders
    let s = seed;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    return Array.from({ length: count }, () => ({
      left: rnd() * 100,
      delay: -rnd() * 12,
      dur: 8 + rnd() * 10,
      size: 6 + rnd() * 12,
      hue: colors[Math.floor(rnd() * colors.length)],
      rot: rnd() * 360,
    }));
  }, [count, seed, colors]);
}

/* ── falling confetti — celebratory ─────────────────────────────────────── */
export function Confetti({ colors, count = 26 }: { colors: string[]; count?: number }) {
  const sprites = useSprites(count, 7, colors);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {sprites.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.55,
            background: p.hue,
            borderRadius: i % 3 === 0 ? '50%' : '1px',
            animation: `ev-fall ${p.dur}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── floating bubbles / balloons rising ─────────────────────────────────── */
export function FloatingOrbs({ colors, count = 14 }: { colors: string[]; count?: number }) {
  const sprites = useSprites(count, 13, colors);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {sprites.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size * 1.6,
            height: p.size * 1.9,
            background: `radial-gradient(circle at 35% 30%, #ffffffaa, ${p.hue} 60%)`,
            boxShadow: `0 4px 14px ${p.hue}55`,
            animation: `ev-rise ${p.dur + 6}s ease-in ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── drifting soft clouds ───────────────────────────────────────────────── */
export function Clouds({ tint = '#ffffff', count = 5 }: { tint?: string; count?: number }) {
  const rows = useMemo(() => Array.from({ length: count }, (_, i) => ({
    top: 6 + i * 16 + (i % 2) * 4,
    dur: 34 + i * 9,
    delay: -i * 7,
    scale: 0.7 + (i % 3) * 0.25,
    op: 0.5 - i * 0.05,
  })), [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {rows.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: `${c.top}%`,
            left: 0,
            opacity: c.op,
            transform: `scale(${c.scale})`,
            animation: `ev-drift ${c.dur}s linear ${c.delay}s infinite`,
          }}>
          <div
            style={{
              width: 120, height: 40, background: tint, borderRadius: 40,
              boxShadow: `28px 6px 0 -4px ${tint}, -26px 8px 0 -6px ${tint}`,
              filter: 'blur(1px)',
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ── twinkling star field ───────────────────────────────────────────────── */
export function Starfield({ color = '#ffffff', count = 40 }: { color?: string; count?: number }) {
  const stars = useSprites(count, 21, [color]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {stars.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${(p.rot / 360) * 100}%`,
            width: p.size * 0.4,
            height: p.size * 0.4,
            background: color,
            boxShadow: `0 0 ${p.size}px ${color}`,
            animation: `ev-twinkle ${2 + (i % 4)}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ── string / fairy lights across the top ───────────────────────────────── */
export function StringLights({ color = '#ffd88a', count = 14 }: { color?: string; count?: number }) {
  const bulbs = Array.from({ length: count });
  return (
    <div className="absolute top-0 left-0 right-0 h-10 pointer-events-none overflow-hidden" aria-hidden>
      <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="w-full h-10">
        <path d="M0 6 Q 100 34 200 8 T 400 6" fill="none" stroke={`${color}55`} strokeWidth="1" />
      </svg>
      <div className="absolute inset-0 flex justify-between px-3">
        {bulbs.map((_, i) => (
          <span
            key={i}
            className="block rounded-full mt-3"
            style={{
              width: 7, height: 9,
              background: color,
              boxShadow: `0 0 8px 2px ${color}bb`,
              transform: `translateY(${i % 2 ? 10 : 2}px)`,
              animation: `ev-flicker ${1.6 + (i % 5) * 0.3}s ease-in-out ${i * 0.12}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── generic "tap to open" cover used by the bespoke designs ─────────────── */
export function TapCover({
  bg, accent, gold, label, title, sub, hint, icon, onOpen, ornaments,
}: {
  bg: string; accent: string; gold: string;
  label: string; title: string; sub?: string; hint: string; icon: string;
  onOpen: () => void;
  ornaments?: React.ReactNode;
}) {
  const [leaving, setLeaving] = useState(false);
  const go = () => { if (leaving) return; setLeaving(true); setTimeout(onOpen, 620); };
  return (
    <button
      onClick={go}
      aria-label={hint}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 overflow-hidden"
      style={{
        background: bg,
        cursor: 'pointer',
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'scale(1.06)' : 'scale(1)',
        transition: 'opacity 600ms ease, transform 700ms cubic-bezier(.16,1,.3,1)',
      }}>
      {ornaments}
      <span
        className="text-4xl mb-4 relative"
        style={{ animation: 'ev-pop .8s cubic-bezier(.16,1,.3,1) both' }}>
        {icon}
        <span
          className="absolute inset-0 -z-10 rounded-full"
          style={{ boxShadow: `0 0 0 1px ${gold}55`, animation: 'ev-pulse-ring 2.8s ease-out infinite' }}
        />
      </span>
      <p className="text-[10px] uppercase tracking-[0.4em] mb-3" style={{ color: `${gold}cc` }}>
        {label}
      </p>
      <h1
        className="leading-[0.95] px-2"
        style={{ color: accent, fontFamily: `'Cormorant Garamond', serif`, fontSize: 'clamp(2.4rem,13vw,4rem)', fontWeight: 300 }}>
        {title}
      </h1>
      {sub && (
        <p className="mt-3 text-[12px] tracking-[0.18em]" style={{ color: `${accent}bb` }}>{sub}</p>
      )}
      <span
        className="mt-9 inline-flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase tracking-[0.32em]"
        style={{ border: `1px solid ${gold}`, color: gold, animation: 'ev-flicker 2.4s ease-in-out infinite' }}>
        {hint}
      </span>
    </button>
  );
}
