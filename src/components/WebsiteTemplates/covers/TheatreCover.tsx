import { useMemo, useState } from 'react';
import type { InviteTheme } from '../themes';
import type { InviteContent } from '../inviteContent';

/* ── Grand Royal opening: heavy velvet theatre curtains part to reveal
   the couple's names lit by a golden spotlight. ── */
type Stage = 'idle' | 'opening' | 'done';

export default function TheatreCover({
  theme, content, onOpen,
}: {
  theme: InviteTheme; content: InviteContent; onOpen: () => void;
}) {
  const [stage, setStage] = useState<Stage>('idle');
  const open = () => {
    if (stage !== 'idle') return;
    setStage('opening');
    setTimeout(onOpen, 1500);
  };

  const opening = stage === 'opening';

  const sparkles = useMemo(
    () => Array.from({ length: 28 }, () => ({
      x: 20 + Math.random() * 60, y: 5 + Math.random() * 80,
      s: 4 + Math.random() * 8,
      dur: 2.5 + Math.random() * 3.5,
      del: -Math.random() * 4,
      op: 0.3 + Math.random() * 0.55,
    })),
    [],
  );

  /* Rich velvet fabric — two layered gradients create fold depth */
  const velvetLeft: React.CSSProperties = {
    background: `
      repeating-linear-gradient(180deg,
        rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px,
        transparent 1px, transparent 6px),
      repeating-linear-gradient(180deg,
        rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 3px,
        transparent 3px, transparent 16px),
      linear-gradient(170deg, ${theme.accent}cc 0%, ${theme.deep} 45%, ${theme.accent}88 70%, ${theme.deep} 100%)
    `,
    transform: opening ? 'translateX(-105%)' : 'translateX(0)',
    transition: 'transform 1200ms cubic-bezier(0.76,0,0.24,1)',
  };
  const velvetRight: React.CSSProperties = {
    background: `
      repeating-linear-gradient(180deg,
        rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px,
        transparent 1px, transparent 6px),
      repeating-linear-gradient(180deg,
        rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 3px,
        transparent 3px, transparent 16px),
      linear-gradient(190deg, ${theme.deep} 0%, ${theme.accent}88 30%, ${theme.deep} 55%, ${theme.accent}cc 100%)
    `,
    transform: opening ? 'translateX(105%)' : 'translateX(0)',
    transition: 'transform 1200ms cubic-bezier(0.76,0,0.24,1)',
  };

  return (
    <div className="absolute inset-0 z-30 overflow-hidden"
      style={{ background: '#05030a' }}>
      <style>{`
        @keyframes thtr-spot  { 0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:.9;transform:scale(1.08)} }
        @keyframes thtr-twinkle { 0%,100%{opacity:0;transform:scale(0.6)} 50%{opacity:1;transform:scale(1)} }
        @keyframes thtr-tassel  { 0%,100%{transform:rotate(-2deg)} 50%{transform:rotate(2deg)} }
        @keyframes thtr-title   { from{opacity:0;letter-spacing:0.08em} to{opacity:1;letter-spacing:0.14em} }
      `}</style>

      {/* ── Stage atmosphere — behind curtains ── */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse 80% 60% at 50% 55%, ${theme.gold}1a, transparent 65%)`,
        animation: 'thtr-spot 4s ease-in-out infinite',
      }}/>

      {/* Sparkles between curtains */}
      {sparkles.map((s, i) => (
        <span key={i} aria-hidden className="absolute select-none pointer-events-none text-center"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            fontSize: s.s,
            color: theme.gold,
            opacity: opening ? s.op : 0,
            animation: `thtr-twinkle ${s.dur}s ease-in-out ${s.del}s infinite`,
            transition: 'opacity 800ms ease 200ms',
          }}>✦</span>
      ))}

      {/* ── Couple's names — revealed as curtains open ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        {/* Theatre "billing" typography */}
        <p style={{
          color:`${theme.gold}cc`, fontFamily:`'${theme.labelFont}', sans-serif`,
          fontSize:8, letterSpacing:'0.52em', textTransform:'uppercase', marginBottom:16,
          opacity: opening ? 1 : 0, transition:'opacity 600ms ease 500ms',
        }}>
          Moments &amp; Memories presents
        </p>
        <p style={{
          color: theme.surface,
          fontFamily:`'${theme.scriptFont}', cursive`,
          fontSize:'clamp(2.4rem,13vw,3.8rem)',
          lineHeight: 0.9,
          opacity: opening ? 1 : 0,
          transform: opening ? 'translateY(0)' : 'translateY(12px)',
          transition:'opacity 700ms ease 600ms, transform 700ms cubic-bezier(0.16,1,0.3,1) 600ms',
        }}>{content.brideName}</p>
        <p style={{
          color:theme.gold, fontFamily:`'${theme.headingFont}', serif`,
          fontSize:'1.4rem', fontWeight:300, margin:'6px 0',
          opacity: opening ? 1 : 0, transition:'opacity 500ms ease 750ms',
        }}>&amp;</p>
        <p style={{
          color: theme.surface,
          fontFamily:`'${theme.scriptFont}', cursive`,
          fontSize:'clamp(2.4rem,13vw,3.8rem)',
          lineHeight: 0.9,
          opacity: opening ? 1 : 0,
          transform: opening ? 'translateY(0)' : 'translateY(12px)',
          transition:'opacity 700ms ease 700ms, transform 700ms cubic-bezier(0.16,1,0.3,1) 700ms',
        }}>{content.groomName}</p>
        <div style={{
          width:48, height:1, background:`${theme.gold}80`, margin:'14px auto',
          opacity: opening ? 1 : 0, transition:'opacity 500ms ease 900ms',
        }}/>
        <p style={{
          color:`${theme.gold}cc`, fontFamily:`'${theme.headingFont}', serif`,
          fontSize:11, letterSpacing:'0.16em',
          opacity: opening ? 1 : 0, transition:'opacity 500ms ease 1000ms',
        }}>{content.dateLabel}</p>
      </div>

      {/* ── LEFT CURTAIN ── */}
      <div className="absolute inset-y-0 left-0 w-[52%] z-20" style={velvetLeft}>
        {/* Gold trim — inner vertical edge */}
        <div className="absolute inset-y-0 right-0 w-px" style={{ background:`${theme.gold}cc` }}/>
        <div className="absolute inset-y-0 right-1 w-px" style={{ background:`${theme.gold}44` }}/>

        {/* Pelmet (top horizontal bar) */}
        <div className="absolute top-0 inset-x-0 h-[5%]" style={{
          background:`linear-gradient(180deg, ${theme.deep} 0%, ${theme.accent} 100%)`,
          borderBottom:`1px solid ${theme.gold}`,
        }}/>

        {/* Tassels at top edge */}
        {Array.from({length:7}).map((_,i)=>(
          <div key={i} className="absolute top-[5%]"
            style={{
              left:`${10 + i*13}%`,
              width:6, height:22,
              background:`linear-gradient(180deg,${theme.gold},${theme.gold}60)`,
              animation:'thtr-tassel 2.5s ease-in-out infinite',
              animationDelay:`${i*0.18}s`,
            }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
              style={{ width:8,height:8, background:theme.gold, marginBottom:-4 }}/>
          </div>
        ))}

        {/* Curtain tie-back swag */}
        <div className="absolute" style={{ top:'48%', right:'-8%', width:'40%', height:'16%' }}>
          <div className="w-full h-full rounded-full opacity-60"
            style={{ background:`radial-gradient(circle at 30% 50%, ${theme.accent}cc, ${theme.deep}80)` }}/>
        </div>
      </div>

      {/* ── RIGHT CURTAIN ── */}
      <div className="absolute inset-y-0 right-0 w-[52%] z-20" style={velvetRight}>
        <div className="absolute inset-y-0 left-0 w-px" style={{ background:`${theme.gold}cc` }}/>
        <div className="absolute inset-y-0 left-1 w-px" style={{ background:`${theme.gold}44` }}/>
        <div className="absolute top-0 inset-x-0 h-[5%]" style={{
          background:`linear-gradient(180deg,${theme.deep} 0%,${theme.accent} 100%)`,
          borderBottom:`1px solid ${theme.gold}`,
        }}/>
        {Array.from({length:7}).map((_,i)=>(
          <div key={i} className="absolute top-[5%]"
            style={{
              right:`${10+i*13}%`, width:6, height:22,
              background:`linear-gradient(180deg,${theme.gold},${theme.gold}60)`,
              animation:'thtr-tassel 2.5s ease-in-out infinite',
              animationDelay:`${i*0.22}s`,
            }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
              style={{ width:8,height:8, background:theme.gold, marginBottom:-4 }}/>
          </div>
        ))}
        <div className="absolute" style={{ top:'48%', left:'-8%', width:'40%', height:'16%' }}>
          <div className="w-full h-full rounded-full opacity-60"
            style={{ background:`radial-gradient(circle at 70% 50%, ${theme.accent}cc, ${theme.deep}80)` }}/>
        </div>
      </div>

      {/* ── Gold seam line between curtains ── */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px z-30 pointer-events-none"
        style={{ background:`${theme.gold}ee`, opacity: opening ? 0 : 1, transition:'opacity 400ms ease' }}/>

      {/* ── Idle cover content (hidden behind curtains) ── */}
      <button onClick={open}
        className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-8"
        style={{ background:'transparent', opacity: opening ? 0 : 1, transition:'opacity 300ms ease' }}>
        <div className="text-center">
          <p style={{
            color:`${theme.surface}cc`,
            fontFamily:`'${theme.labelFont}', sans-serif`,
            fontSize:9, letterSpacing:'0.38em', textTransform:'uppercase', marginBottom:6,
          }}>You Are Invited</p>
          <span style={{
            display:'block', color:`${theme.gold}bb`,
            animation:'inv-float 2.5s ease-in-out infinite',
            fontSize:18,
          }}>↑</span>
          <p style={{
            color:`${theme.surface}77`,
            fontFamily:`'${theme.labelFont}', sans-serif`,
            fontSize:8, letterSpacing:'0.28em', textTransform:'uppercase', marginTop:4,
          }}>Tap to open</p>
        </div>
      </button>
    </div>
  );
}
