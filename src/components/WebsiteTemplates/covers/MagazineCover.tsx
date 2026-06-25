import { useState } from 'react';
import type { InviteTheme } from '../themes';
import type { InviteContent } from '../inviteContent';

/* ── Editorial opening: a high-fashion magazine front cover.
   Click → top half slides up, bottom half slides down (split-page reveal). ── */
type Stage = 'idle' | 'splitting' | 'done';

export default function MagazineCover({
  theme, content, onOpen,
}: {
  theme: InviteTheme; content: InviteContent; onOpen: () => void;
}) {
  const [stage, setStage] = useState<Stage>('idle');
  const open = () => {
    if (stage !== 'idle') return;
    setStage('splitting');
    setTimeout(onOpen, 1400);
  };

  const splitting = stage === 'splitting';

  /* Shared magazine-page styling */
  const pageBg  = theme.surface;
  const ink     = theme.ink;
  const rule    = { width:'100%', height:1, background:`${ink}18`, display:'block' as const };
  const hrStyle = { ...rule, margin:'8px 0' };

  /* The magazine cover is split into TWO halves.
     On click: top goes up, bottom goes down, reveal happens in the gap. */
  const half: React.CSSProperties = {
    position: 'absolute' as const,
    left: 0, right: 0,
    overflow: 'hidden',
    transition: 'transform 1000ms cubic-bezier(0.76,0,0.24,1)',
  };

  return (
    <div className="absolute inset-0 z-30 overflow-hidden" style={{ background: theme.pageBg }}>
      <style>{`
        @keyframes mag-blink { 0%,100%{opacity:1} 49%{opacity:1} 50%{opacity:0} 51%{opacity:0} }
        @keyframes mag-pulse  { 0%,100%{border-color:${theme.accent}40} 50%{border-color:${theme.accent}bb} }
      `}</style>

      {/* ── Behind the magazine — invite environment ── */}
      <div className="absolute inset-0" style={{
        background:`linear-gradient(160deg, ${theme.deep} 0%, ${theme.accent}30 50%, ${theme.deep} 100%)`,
      }}/>

      {/* ── TOP HALF of magazine cover ── */}
      <div style={{
        ...half,
        top: 0,
        height: '50%',
        transform: splitting ? 'translateY(-110%)' : 'translateY(0)',
      }}>
        <div className="w-full h-full relative flex flex-col justify-between px-5 py-4"
          style={{ background: pageBg }}>

          {/* Magazine masthead */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span style={{
                fontFamily:`'${theme.headingFont}', serif`,
                fontSize:7, letterSpacing:'0.55em', textTransform:'uppercase', color:ink,
              }}>Vol. I · No. 1</span>
              <span style={{
                fontFamily:`'${theme.labelFont}', sans-serif`,
                fontSize:7, letterSpacing:'0.3em', color:`${ink}66`,
              }}>COLLECTOR'S EDITION</span>
            </div>
            <span style={rule}/>

            <p style={{
              fontFamily:`'${theme.headingFont}', serif`,
              fontSize:'clamp(1.4rem,8vw,1.9rem)',
              letterSpacing:'0.12em',
              fontWeight:700,
              textTransform:'uppercase',
              color:ink,
              lineHeight:1,
              margin:'6px 0 2px',
            }}>Moments &amp;<br/>Memories</p>

            <span style={rule}/>
            <div className="flex justify-between mt-1">
              <span style={{ fontFamily:`'${theme.labelFont}', sans-serif`, fontSize:7, color:`${ink}55`, letterSpacing:'0.2em' }}>
                {content.dateLabel.split(',')[0]?.toUpperCase()}
              </span>
              <span style={{ fontFamily:`'${theme.labelFont}', sans-serif`, fontSize:7, color:`${theme.accent}bb`, letterSpacing:'0.2em' }}>
                ✦ WEDDING EDITION ✦
              </span>
            </div>
          </div>

          {/* The "hero" couple mention */}
          <div className="flex-1 flex items-center justify-center flex-col text-center py-3">
            <span style={{
              fontFamily:`'${theme.scriptFont}', cursive`,
              fontSize:'clamp(1.8rem,9vw,2.6rem)',
              color:theme.accent,
              lineHeight: 0.88,
            }}>{content.brideName}</span>
            <span style={{
              fontFamily:`'${theme.headingFont}', serif`,
              fontSize:'0.75rem', letterSpacing:'0.1em',
              color:theme.gold, margin:'4px 0',
            }}>&amp;</span>
            {/* Incomplete — second name in bottom half */}
          </div>
        </div>
      </div>

      {/* ── BOTTOM HALF of magazine cover ── */}
      <div style={{
        ...half,
        top: '50%',
        height: '50%',
        transform: splitting ? 'translateY(110%)' : 'translateY(0)',
      }}>
        <div className="w-full h-full relative flex flex-col justify-between px-5 py-4"
          style={{ background: pageBg }}>

          {/* Continuation of the headline */}
          <div className="flex flex-col items-center justify-start text-center pt-1">
            <span style={{
              fontFamily:`'${theme.scriptFont}', cursive`,
              fontSize:'clamp(1.8rem,9vw,2.6rem)',
              color:theme.accent,
              lineHeight: 0.88,
            }}>{content.groomName}</span>
          </div>

          {/* Subheadlines — editorial sidebar style */}
          <div className="flex-1 py-3 space-y-2">
            <span style={hrStyle}/>
            <div className="flex gap-3">
              <div className="w-1 self-stretch" style={{ background:theme.accent }}/>
              <p style={{
                fontFamily:`'${theme.headingFont}', serif`,
                fontSize:11, color:ink, lineHeight:1.5, flex:1,
              }}>
                "<em style={{fontStyle:'italic',color:theme.accent}}>An exclusive invitation</em> to witness the union of two souls."
              </p>
            </div>
            <span style={hrStyle}/>
            <div className="grid grid-cols-3 gap-1">
              {[content.dateLabel.split(',')[0],'Venue Inside','RSVP Required'].map((t,i)=>(
                <p key={i} style={{
                  fontFamily:`'${theme.labelFont}', sans-serif`,
                  fontSize:7, color:`${ink}66`, letterSpacing:'0.15em',
                  textTransform:'uppercase', textAlign:'center', lineHeight:1.4,
                }}>{t}</p>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div>
            <span style={rule}/>
            <div className="flex items-center justify-between mt-2">
              <span style={{ fontFamily:`'${theme.labelFont}', sans-serif`, fontSize:7, color:`${ink}44` }}>
                MOMENTS & MEMORIES™
              </span>
              <button onClick={open}
                className="flex items-center gap-1"
                style={{
                  border:`1px solid ${theme.accent}`,
                  color:theme.accent,
                  fontFamily:`'${theme.labelFont}', sans-serif`,
                  fontSize:7,
                  letterSpacing:'0.22em',
                  textTransform:'uppercase',
                  padding:'3px 8px',
                  animation:'mag-pulse 2s ease-in-out infinite',
                }}>
                Open ▶
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Split seam line (visible while idle) ── */}
      <div className="absolute inset-x-0 z-40 pointer-events-none"
        style={{
          top:'50%', height:2,
          background:`linear-gradient(90deg, transparent, ${theme.accent}60, ${theme.gold}, ${theme.accent}60, transparent)`,
          opacity: splitting ? 0 : 1,
          transition:'opacity 200ms ease',
        }}/>

      {/* ── Main click overlay (idle only) ── */}
      <div className="absolute inset-0 z-50 pointer-events-none"
        style={{
          opacity: splitting ? 0 : 0,
        }}/>
    </div>
  );
}
