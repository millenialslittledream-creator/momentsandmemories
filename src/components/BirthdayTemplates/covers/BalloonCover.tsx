import { useMemo, useState } from 'react';
import type { BirthdayTheme } from '../birthdayThemes';
import type { BirthdayContent } from '../birthdayContent';

/* ── Bash opening: a room full of balloons.
   Click → balloons pop one-by-one with burst effects → confetti rains. ── */
type Stage = 'idle' | 'popping' | 'done';

interface Balloon {
  x: number; y: number;
  rx: number; ry: number;
  color: string;
  dur: number; del: number;
  popDel: number;
}

export default function BalloonCover({
  theme, content, onOpen,
}: {
  theme: BirthdayTheme; content: BirthdayContent; onOpen: () => void;
}) {
  const [stage, setStage] = useState<Stage>('idle');
  const [poppedIdx, setPoppedIdx] = useState<Set<number>>(new Set());

  const COLORS = [theme.accent, theme.gold, `${theme.gold}dd`, theme.accent, theme.gold];

  const balloons = useMemo<Balloon[]>(
    () => Array.from({ length: 11 }, (_, i) => ({
      x:      8 + (i * 8.5) + (Math.random() * 4 - 2),
      y:      15 + Math.random() * 60,
      rx:     14 + Math.random() * 10,
      ry:     18 + Math.random() * 14,
      color:  COLORS[i % COLORS.length],
      dur:    3 + Math.random() * 2.5,
      del:    -Math.random() * 3,
      popDel: i * 120 + Math.random() * 80,
    })),
    [],
  );

  const confetti = useMemo(
    () => Array.from({ length: 30 }, (_, i) => ({
      x: Math.random() * 100, size: 5 + Math.random() * 7,
      color: COLORS[i % COLORS.length], dur: 1.8 + Math.random() * 1.2,
      del: Math.random() * 0.8, rot: Math.random() * 360,
    })),
    [],
  );

  const open = () => {
    if (stage !== 'idle') return;
    setStage('popping');
    balloons.forEach((b, i) => {
      setTimeout(() => {
        setPoppedIdx((prev) => new Set([...prev, i]));
      }, b.popDel);
    });
    setTimeout(onOpen, 1800);
  };

  const allPopped = poppedIdx.size === balloons.length;

  return (
    <div className="absolute inset-0 z-30 overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${theme.pageBg} 0%, ${theme.deep} 100%)` }}>
      <style>{`
        @keyframes bal-float  { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-16px) rotate(1.5deg)} }
        @keyframes bal-pop    { 0%{transform:scale(1);opacity:1} 30%{transform:scale(1.3);opacity:1} 60%{transform:scale(0.1);opacity:0} 100%{transform:scale(0);opacity:0} }
        @keyframes bal-burst  { 0%{transform:scale(0);opacity:1} 60%{transform:scale(2.2);opacity:0.7} 100%{transform:scale(3.5);opacity:0} }
        @keyframes bal-confetti { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
        @keyframes bal-string { 0%,100%{d:path("M 0 0 Q 3 8 0 16")} 50%{d:path("M 0 0 Q -3 8 0 16")} }
      `}</style>

      {/* Streamers along ceiling */}
      <div className="absolute top-0 inset-x-0 flex justify-around pointer-events-none">
        {Array.from({length:10}).map((_,i)=>(
          <div key={i} style={{
            width:2, height:`${20+Math.random()*12}%`,
            background:`linear-gradient(180deg,${COLORS[i%COLORS.length]},${COLORS[i%COLORS.length]}44)`,
            transform:`rotate(${-5+i*1.2}deg)`,
            transformOrigin:'top',
          }}/>
        ))}
      </div>

      {/* Confetti fall (after all balloons pop) */}
      {allPopped && confetti.map((c,i)=>(
        <div key={i} className="absolute pointer-events-none"
          style={{
            left:`${c.x}%`, top:'-10px', width:c.size, height:c.size*0.6,
            background:c.color,
            transform:`rotate(${c.rot}deg)`,
            animation:`bal-confetti ${c.dur}s ease-in ${c.del}s both`,
          }}/>
      ))}

      {/* ── Balloons ── */}
      {balloons.map((b, i) => {
        const popped = poppedIdx.has(i);
        return (
          <div key={i} className="absolute pointer-events-none"
            style={{
              left:`${b.x}%`, top:`${b.y}%`,
              animation: stage === 'idle' ? `bal-float ${b.dur}s ease-in-out ${b.del}s infinite` : undefined,
            }}>
            {/* Burst halo */}
            {popped && (
              <div className="absolute rounded-full"
                style={{
                  width:b.rx*2+16, height:b.ry*2+16,
                  left:`-${b.rx+8}px`, top:`-${b.ry+8}px`,
                  background:`radial-gradient(circle, ${b.color}cc, ${b.color}00 70%)`,
                  animation:'bal-burst 0.5s ease-out both',
                }}/>
            )}
            {/* Balloon oval */}
            <div
              style={{
                width:b.rx*2, height:b.ry*2,
                background:`radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.35), ${b.color} 55%, ${b.color}cc)`,
                borderRadius:'50%',
                boxShadow:`inset -3px -4px 12px rgba(0,0,0,0.18), 0 2px 12px ${b.color}55`,
                animation: popped ? 'bal-pop 0.4s ease-out both' : undefined,
                position:'relative',
              }}>
              {/* Shine */}
              <div className="absolute rounded-full"
                style={{ top:'18%', left:'24%', width:'22%', height:'14%', background:'rgba(255,255,255,0.6)' }}/>
            </div>
            {/* String */}
            <svg width={6} height={22} style={{ display:'block', margin:`0 auto` }}>
              <path d="M 3 0 Q 1 11 3 22" stroke={`${b.color}bb`} strokeWidth={1} fill="none"/>
            </svg>
          </div>
        );
      })}

      {/* ── Center content ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6 z-10">
        <div style={{
          opacity: stage === 'idle' ? 1 : 0,
          transition: 'opacity 500ms ease',
        }}>
          <p style={{ color:`${theme.surface}99`, fontFamily:`'${theme.labelFont}', sans-serif`, fontSize:8, letterSpacing:'0.42em', textTransform:'uppercase', marginBottom:10 }}>
            You're Invited to Celebrate
          </p>
          {content.age && (
            <p style={{
              fontFamily:`'${theme.headingFont}', serif`,
              fontSize:'clamp(4rem,22vw,7rem)',
              fontWeight:700, lineHeight:1,
              color: theme.gold,
              textShadow:`0 4px 32px ${theme.gold}60`,
            }}>{content.age}</p>
          )}
          <p style={{
            fontFamily:`'${theme.scriptFont}', cursive`,
            fontSize:'clamp(2rem,11vw,3.2rem)', lineHeight:0.9,
            color:theme.surface, marginTop:4,
          }}>{content.honoree}</p>
        </div>
      </div>

      {/* ── Tap to pop button ── */}
      <button onClick={open}
        className="absolute inset-0 z-20 flex items-end justify-center pb-8"
        style={{ background:'transparent', opacity: stage === 'idle' ? 1 : 0, transition:'opacity 300ms ease' }}>
        <span style={{
          border:`1px solid ${theme.gold}bb`,
          color:theme.surface,
          fontFamily:`'${theme.labelFont}', sans-serif`,
          fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase',
          padding:'10px 24px',
          background:`${theme.gold}14`,
          display:'flex', alignItems:'center', gap:8,
        }}>
          🎈 Tap to Pop!
        </span>
      </button>
    </div>
  );
}
