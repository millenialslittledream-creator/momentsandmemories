import { useState } from 'react';
import type { BirthdayTheme } from '../birthdayThemes';
import type { BirthdayContent } from '../birthdayContent';

/* ── Soirée opening: a single spotlight on a dark stage.
   Click → spotlight expands and bleaches to reveal the invite. ── */
type Stage = 'idle' | 'expanding' | 'done';

export default function SpotlightCover({
  theme, content, onOpen,
}: {
  theme: BirthdayTheme; content: BirthdayContent; onOpen: () => void;
}) {
  const [stage, setStage] = useState<Stage>('idle');
  const open = () => {
    if (stage !== 'idle') return;
    setStage('expanding');
    setTimeout(onOpen, 1600);
  };

  const expanding = stage === 'expanding';

  return (
    <div className="absolute inset-0 z-30 overflow-hidden" style={{ background: '#000' }}>
      <style>{`
        @keyframes spl-pulse    { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
        @keyframes spl-halo     { 0%,100%{box-shadow:0 0 0 0px transparent} 50%{box-shadow:0 0 0 30px ${theme.gold}12} }
        @keyframes spl-shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes spl-expand   {
          0%   { clip-path: circle(120px at 50% 42%) }
          100% { clip-path: circle(160% at 50% 42%) }
        }
        @keyframes spl-text-out { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(1.2)} }
      `}</style>

      {/* ── Absolute darkness ── */}
      <div className="absolute inset-0" style={{ background:'#000' }}/>

      {/* ── Dust motes in spotlight beam ── */}
      {Array.from({length: 16}).map((_,i) => (
        <div key={i} className="absolute rounded-full pointer-events-none"
          style={{
            left:`${38 + Math.random()*24}%`,
            top:`${20 + Math.random()*44}%`,
            width: 1 + Math.random()*2,
            height: 1 + Math.random()*2,
            background:`${theme.gold}`,
            opacity: expanding ? 0 : 0.25 + Math.random() * 0.35,
            animation:`spl-pulse ${2.5+Math.random()*2}s ease-in-out ${-Math.random()*3}s infinite`,
            transition:'opacity 400ms ease',
          }}/>
      ))}

      {/* ── Expanding light reveal ── */}
      <div className="absolute inset-0"
        style={{
          background:`
            radial-gradient(ellipse 65% 80% at 50% 42%,
              ${theme.gold}20 0%,
              ${theme.gold}08 40%,
              transparent 70%),
            #000
          `,
          animation: expanding ? 'spl-expand 1500ms cubic-bezier(0.4,0,0.2,1) both' : undefined,
          clipPath: expanding ? undefined : 'circle(120px at 50% 42%)',
        }}>
        <div className="absolute inset-0" style={{
          background:`radial-gradient(ellipse 90% 85% at 50% 42%, ${theme.surface}e0, ${theme.surface} 60%)`,
          opacity: expanding ? 1 : 0,
          transition:'opacity 400ms ease 800ms',
        }}/>
      </div>

      {/* ── Spotlight ring + content (idle state) ── */}
      <div className="absolute inset-0 flex flex-col items-center"
        style={{
          justifyContent:'flex-start',
          paddingTop:'28%',
          opacity: expanding ? 0 : 1,
          animation: expanding ? 'spl-text-out 400ms ease both' : undefined,
        }}>

        {/* Spotlight floor ring */}
        <div className="relative flex items-center justify-center"
          style={{
            width: 160, height: 160,
            borderRadius:'50%',
            background:`radial-gradient(circle at 50% 38%, ${theme.gold}2a, ${theme.gold}08 55%, transparent 70%)`,
            animation:'spl-halo 3.5s ease-in-out infinite',
          }}>

          {/* Inner glow circle */}
          <div className="absolute rounded-full"
            style={{
              inset:20,
              background:`radial-gradient(circle at 40% 35%, ${theme.gold}18, transparent 65%)`,
              border:`0.5px solid ${theme.gold}40`,
              animation:'spl-pulse 3s ease-in-out infinite',
            }}/>

          {/* Honoree info in spotlight */}
          <div className="relative z-10 text-center px-4">
            {content.age && (
              <p style={{
                fontFamily:`'${theme.headingFont}', serif`,
                fontSize:'clamp(2.2rem,12vw,3.4rem)',
                fontWeight:700, lineHeight:0.9,
                color:theme.gold,
                textShadow:`0 0 30px ${theme.gold}aa, 0 0 60px ${theme.gold}44`,
              }}>{content.age}</p>
            )}
            <p style={{
              fontFamily:`'${theme.scriptFont}', cursive`,
              fontSize:'clamp(1.4rem,8vw,2rem)', lineHeight:0.9,
              color:theme.surface,
              marginTop: 4,
              textShadow:`0 0 20px ${theme.surface}66`,
            }}>{content.honoree}</p>
          </div>
        </div>

        {/* Beam lines coming from above */}
        <div className="absolute pointer-events-none" style={{ top:0, left:'50%', transform:'translateX(-50%)', width:280, height:'32%', overflow:'hidden' }}>
          {[-22,-11,0,11,22].map((deg,i)=>(
            <div key={i} className="absolute bottom-0 left-1/2"
              style={{
                width:1, height:'100%',
                background:`linear-gradient(180deg, transparent 0%, ${theme.gold}30 100%)`,
                transform:`rotate(${deg}deg)`,
                transformOrigin:'bottom center',
                opacity: 0.6 - Math.abs(i-2)*0.12,
              }}/>
          ))}
        </div>

        {/* Monogram label */}
        <p style={{
          marginTop:16,
          color:`${theme.surface}55`,
          fontFamily:`'${theme.labelFont}', sans-serif`,
          fontSize:8, letterSpacing:'0.44em', textTransform:'uppercase',
        }}>
          {content.tagline}
        </p>
      </div>

      {/* ── Tap to illuminate ── */}
      <button onClick={open}
        className="absolute inset-0 z-20 flex items-end justify-center pb-9"
        style={{ background:'transparent', opacity: expanding ? 0 : 1, transition:'opacity 300ms ease' }}>
        <div className="text-center">
          <span style={{
            display:'block',
            color:`${theme.surface}44`,
            fontSize:18, marginBottom:6,
            animation:'inv-float 2.8s ease-in-out infinite',
          }}>☀</span>
          <span style={{
            color:`${theme.surface}55`,
            fontFamily:`'${theme.labelFont}', sans-serif`,
            fontSize:8, letterSpacing:'0.38em', textTransform:'uppercase',
          }}>Tap to reveal</span>
        </div>
      </button>
    </div>
  );
}
