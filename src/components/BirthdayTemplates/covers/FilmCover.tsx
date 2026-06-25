import { useEffect, useState } from 'react';
import type { BirthdayTheme } from '../birthdayThemes';
import type { BirthdayContent } from '../birthdayContent';

/* ── Milestone opening: a vintage film countdown frame.
   The screen looks like 35mm film. Click → film burns from center out. ── */
type Stage = 'idle' | 'burning' | 'done';

export default function FilmCover({
  theme, content, onOpen,
}: {
  theme: BirthdayTheme; content: BirthdayContent; onOpen: () => void;
}) {
  const [stage, setStage] = useState<Stage>('idle');
  const [tick, setTick] = useState(0);   // 0=idle, 1=scratch flicker

  /* Subtle flicker on idle to sell the "old film" look */
  useEffect(() => {
    const id = setInterval(() => setTick((n) => (n + 1) % 8), 250);
    return () => clearInterval(id);
  }, []);

  const open = () => {
    if (stage !== 'idle') return;
    setStage('burning');
    setTimeout(onOpen, 1800);
  };

  const burning = stage === 'burning';

  /* Film sprocket holes — two vertical strips */
  const HOLES = Array.from({ length: 14 }, (_, i) => i);

  return (
    <div className="absolute inset-0 z-30 overflow-hidden"
      style={{ background: '#0a0800' }}>
      <style>{`
        @keyframes film-grain  { 0%{opacity:.04} 25%{opacity:.06} 50%{opacity:.03} 75%{opacity:.07} 100%{opacity:.04} }
        @keyframes film-flicker{ 0%,100%{opacity:1} 12%{opacity:.92} 24%{opacity:1} 38%{opacity:.87} }
        @keyframes film-burn   {
          0%   { clip-path: circle(0px at 50% 44%) }
          40%  { clip-path: circle(60px at 50% 44%) }
          100% { clip-path: circle(180% at 50% 44%) }
        }
        @keyframes film-char   { 0%,100%{filter:none} 50%{filter:brightness(1.6) saturate(0.3)} }
        @keyframes film-scratch{ 0%,80%,100%{opacity:0} 82%,85%{opacity:0.35} }
        @keyframes film-jitter { 0%,100%{transform:translateX(0)} 5%{transform:translateX(-1px)} 10%{transform:translateX(1px)} }
      `}</style>

      {/* ── Film grain texture ── */}
      <div className="absolute inset-0 pointer-events-none z-40"
        style={{
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.9'/%3E%3C/svg%3E")`,
          backgroundSize:'200px 200px',
          animation:'film-grain 0.18s steps(1) infinite',
          mixBlendMode:'overlay',
        }}/>

      {/* ── Random vertical scratch ── */}
      <div className="absolute inset-y-0 pointer-events-none z-50"
        style={{
          left:`${30 + (tick*13)%40}%`,
          width:1,
          background:`linear-gradient(180deg, transparent, ${theme.gold}88, transparent)`,
          animation:'film-scratch 2.1s linear infinite',
        }}/>

      {/* ── LEFT SPROCKET STRIP ── */}
      <div className="absolute inset-y-0 left-0 w-9 flex flex-col items-center justify-around py-4"
        style={{ background:`#111009`, borderRight:`1px solid #222015` }}>
        {HOLES.map((_, i) => (
          <div key={i} className="rounded-sm"
            style={{ width:14, height:10, background:'#000', boxShadow:'inset 0 1px 3px rgba(0,0,0,0.8)' }}/>
        ))}
      </div>

      {/* ── RIGHT SPROCKET STRIP ── */}
      <div className="absolute inset-y-0 right-0 w-9 flex flex-col items-center justify-around py-4"
        style={{ background:`#111009`, borderLeft:`1px solid #222015` }}>
        {HOLES.map((_, i) => (
          <div key={i} className="rounded-sm"
            style={{ width:14, height:10, background:'#000', boxShadow:'inset 0 1px 3px rgba(0,0,0,0.8)' }}/>
        ))}
      </div>

      {/* ── Film frame content ── */}
      <div className="absolute inset-y-0 left-9 right-9 flex flex-col items-center justify-center text-center px-4"
        style={{
          background:`linear-gradient(160deg, #1a1200 0%, #0f0a00 50%, #1a1200 100%)`,
          animation: burning ? undefined : 'film-flicker 4s ease-in-out infinite',
        }}>

        {/* Frame number / timestamp */}
        <div className="absolute top-3 inset-x-0 flex justify-between px-3">
          <span style={{ fontFamily:'monospace', fontSize:7, color:'#665533', letterSpacing:'0.2em' }}>
            {content.dateLabel.slice(0,4)}
          </span>
          <span style={{ fontFamily:'monospace', fontSize:7, color:'#665533' }}>FRAME 0001</span>
        </div>

        {/* "FEATURE PRESENTATION" */}
        <p style={{
          fontFamily:`'${theme.labelFont}', sans-serif`,
          fontSize:7, letterSpacing:'0.5em', textTransform:'uppercase',
          color:`#a0804466`, marginBottom:12,
        }}>Feature Presentation</p>

        {/* Decorative circle border */}
        <div className="relative flex items-center justify-center mb-4"
          style={{
            width:140, height:140,
            border:`1px solid ${theme.gold}44`,
            borderRadius:'50%',
          }}>
          <div className="absolute rounded-full" style={{ inset:8, border:`0.5px solid ${theme.gold}22` }}/>

          {/* Big age number */}
          {content.age ? (
            <p style={{
              fontFamily:'serif',
              fontSize:'clamp(3.5rem,18vw,5rem)',
              fontWeight:900, lineHeight:1,
              color: theme.gold,
              textShadow:`0 0 24px ${theme.gold}66`,
              letterSpacing:'-0.04em',
              filter: tick%4===0 ? 'brightness(1.4)' : undefined,
              transition:'filter 0.08s',
            }}>{content.age}</p>
          ) : (
            <p style={{
              fontFamily:`'${theme.scriptFont}', cursive`,
              fontSize:'clamp(2rem,10vw,3rem)', lineHeight:1,
              color:theme.gold,
            }}>{content.monogram}</p>
          )}
        </div>

        {/* Honoree name */}
        <p style={{
          fontFamily:`'${theme.scriptFont}', cursive`,
          fontSize:'clamp(1.6rem,9vw,2.4rem)', lineHeight:0.9,
          color:`${theme.surface}ee`,
        }}>{content.honoree}</p>

        <div style={{ width:48, height:1, background:`${theme.gold}50`, margin:'10px auto' }}/>

        <p style={{
          fontFamily:`'${theme.labelFont}', sans-serif`,
          fontSize:9, letterSpacing:'0.28em', textTransform:'uppercase',
          color:`${theme.gold}99`,
        }}>{content.dateLabel}</p>

        {/* Director-style credit */}
        <p style={{
          position:'absolute', bottom:20, left:0, right:0, textAlign:'center',
          fontFamily:'monospace', fontSize:7, letterSpacing:'0.22em',
          color:'#665533aa', textTransform:'uppercase',
        }}>Presented by · The {content.honoree.split(' ')[1] || 'Family'}</p>
      </div>

      {/* ── BURN REVEAL — expands from center on click ── */}
      {burning && (
        <>
          {/* Charred/bright edge ring */}
          <div className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background:`radial-gradient(circle at 50% 44%, ${theme.gold}cc 0%, orange 8%, transparent 14%)`,
              animation:'film-burn 1700ms cubic-bezier(0.4,0,0.2,1) both',
              clipPath:'circle(0px at 50% 44%)',
            }}/>
          {/* The bright white-out behind the burn */}
          <div className="absolute inset-0 z-[5] pointer-events-none"
            style={{
              background: theme.surface,
              animation:'film-burn 1700ms cubic-bezier(0.4,0,0.2,1) 60ms both',
              clipPath:'circle(0px at 50% 44%)',
            }}/>
        </>
      )}

      {/* ── Tap CTA ── */}
      <button onClick={open}
        className="absolute inset-0 z-20 flex items-end justify-center pb-8"
        style={{ background:'transparent', opacity: burning ? 0 : 1, transition:'opacity 200ms ease' }}>
        <div className="text-center">
          <span style={{
            display:'block',
            background:`linear-gradient(90deg,transparent,${theme.gold}66,transparent)`,
            backgroundSize:'200% 100%',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent',
            fontFamily:`'${theme.labelFont}', sans-serif`,
            fontSize:9, letterSpacing:'0.4em', textTransform:'uppercase',
            animation:'spl-shimmer 3s linear infinite',
          }}>▶ Play Invitation</span>
        </div>
      </button>
    </div>
  );
}
