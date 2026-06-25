import { useState } from 'react';
import type { InviteTheme } from '../themes';
import type { InviteContent } from '../inviteContent';

/* ── Timeless opening: a real linen envelope sealed with wax.
   Click → seal cracks → V-flap folds upward → invitation card rises. ── */
type Stage = 'idle' | 'cracking' | 'folding' | 'rising';

export default function EnvelopeCover({
  theme, content, onOpen,
}: {
  theme: InviteTheme; content: InviteContent; onOpen: () => void;
}) {
  const [stage, setStage] = useState<Stage>('idle');
  const open = () => {
    if (stage !== 'idle') return;
    setStage('cracking');
    setTimeout(() => setStage('folding'),   360);
    setTimeout(() => setStage('rising'),    880);
    setTimeout(onOpen,                     1700);
  };

  const cracking = stage === 'cracking';
  const folding  = stage === 'folding' || stage === 'rising';
  const rising   = stage === 'rising';

  return (
    <div className="absolute inset-0 z-30 overflow-hidden flex items-center justify-center"
      style={{ background: theme.pageBg }}>
      <style>{`
        @keyframes env-crack  { 0%{transform:scale(1) rotate(0)} 30%{transform:scale(1.12) rotate(-4deg)} 60%{transform:scale(1.05) rotate(3deg)} 85%{transform:scale(1.08) rotate(-1deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes env-jitter { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes env-fold   { 0%{transform:scaleY(1) translateY(0)} 100%{transform:scaleY(0) translateY(-40%)} }
        @keyframes env-rise   { 0%{transform:translateY(110%)} 100%{transform:translateY(0)} }
      `}</style>

      {/* ── Envelope body — the whole visual stage ── */}
      <div className="absolute inset-4 shadow-2xl overflow-hidden"
        style={{
          background: `
            repeating-linear-gradient(45deg, rgba(0,0,0,0.012) 0,rgba(0,0,0,0.012) 1px,transparent 1px,transparent 9px),
            repeating-linear-gradient(-45deg,rgba(0,0,0,0.012) 0,rgba(0,0,0,0.012) 1px,transparent 1px,transparent 9px),
            linear-gradient(160deg, ${theme.surface} 0%, ${theme.surfaceAlt} 100%)
          `,
          boxShadow: `0 8px 64px rgba(0,0,0,0.45), inset 0 0 60px ${theme.gold}08`,
        }}>

        {/* Corner postmarks */}
        {[{t:'4%',l:'4%'},{t:'4%',r:'4%'},{b:'4%',l:'4%'},{b:'4%',r:'4%'}].map((pos,i)=>(
          <div key={i} className="absolute w-8 h-8"
            style={{ ...pos, border:`1.5px solid ${theme.gold}60`, opacity: 0.6 }} />
        ))}

        {/* Address lines — subtle */}
        <div className="absolute bottom-[14%] left-[8%] space-y-1.5">
          {[40,60,48].map((w,i)=>(
            <div key={i} className="h-px rounded" style={{ width: w, background:`${theme.gold}40` }} />
          ))}
        </div>

        {/* Diagonal envelope seam — center diamond */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, ${theme.gold}08 25%, transparent 25%),
                         linear-gradient(225deg, ${theme.gold}08 25%, transparent 25%),
                         linear-gradient(315deg, ${theme.gold}08 25%, transparent 25%),
                         linear-gradient(45deg,  ${theme.gold}08 25%, transparent 25%)`,
          }}/>
        </div>

        {/* ── TOP FLAP — V-shape that folds away ── */}
        <div className="absolute inset-x-0 top-0"
          style={{
            height: '55%',
            transformOrigin: 'top center',
            animation: folding ? 'env-fold 700ms cubic-bezier(0.4,0,0.2,1) both' : undefined,
            zIndex: 20,
          }}>
          <div className="w-full h-full relative"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 50% 80%)',
              background: `linear-gradient(165deg, ${theme.surface} 0%, ${theme.surfaceAlt} 55%, ${theme.accentSoft}50 100%)`,
              boxShadow: `inset 0 -4px 24px ${theme.gold}25`,
            }}>
            {/* Flap crease line */}
            <div className="absolute bottom-0 inset-x-0 h-px" style={{ background:`${theme.gold}30` }} />
          </div>
        </div>

        {/* ── WAX SEAL — sits on the flap fold line ── */}
        <div className="absolute z-30 pointer-events-none"
          style={{
            top: '47%', left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: folding ? 0 : 1,
            transition: 'opacity 0.22s ease',
            animation: cracking ? 'env-crack 0.36s ease-in-out' : undefined,
          }}>
          <div className="relative flex items-center justify-center rounded-full"
            style={{
              width: 80, height: 80,
              background: `radial-gradient(circle at 35% 30%, ${theme.accent}ee, ${theme.deep})`,
              boxShadow: `0 4px 28px ${theme.accent}60, 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.12)`,
            }}>
            {/* Decorative ring */}
            <div className="absolute rounded-full" style={{ inset: 6, border:`1px solid ${theme.gold}88` }} />
            <div className="absolute rounded-full" style={{ inset: 10, border:`0.5px solid ${theme.gold}44` }} />
            <span style={{
              color: theme.surface,
              fontFamily: `'${theme.headingFont}', serif`,
              fontSize: '1.7rem',
              fontWeight: 300,
              position: 'relative',
              zIndex: 1,
            }}>{content.monogram}</span>
          </div>
        </div>

        {/* ── INVITATION CARD — rises from inside the envelope ── */}
        <div className="absolute inset-x-6 bottom-0 z-10"
          style={{
            top: '15%',
            animation: rising ? 'env-rise 850ms cubic-bezier(0.16,1,0.3,1) both' : undefined,
            opacity: rising ? 1 : 0,
          }}>
          <div className="relative w-full h-full flex flex-col items-center justify-center text-center px-6"
            style={{
              background: theme.surface,
              boxShadow: `0 -6px 40px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.12)`,
            }}>
            {/* Double border */}
            <div className="absolute inset-3 pointer-events-none" style={{ border:`1px solid ${theme.gold}70` }}/>
            <div className="absolute inset-[14px] pointer-events-none" style={{ border:`0.5px solid ${theme.gold}35` }}/>

            <p style={{ color:theme.muted, fontFamily:`'${theme.labelFont}', sans-serif`, fontSize:8, letterSpacing:'0.44em', textTransform:'uppercase', marginBottom:12 }}>
              You Are Cordially Invited
            </p>
            <p style={{ color:theme.accent, fontFamily:`'${theme.scriptFont}', cursive`, fontSize:'clamp(1.8rem,9vw,2.8rem)', lineHeight:0.9 }}>
              {content.brideName}
            </p>
            <p style={{ color:theme.gold, fontFamily:`'${theme.headingFont}', serif`, margin:'6px 0', fontSize:'1.1rem', fontWeight:300 }}>
              &amp;
            </p>
            <p style={{ color:theme.accent, fontFamily:`'${theme.scriptFont}', cursive`, fontSize:'clamp(1.8rem,9vw,2.8rem)', lineHeight:0.9 }}>
              {content.groomName}
            </p>
            <div style={{ width:40, height:1, background:`${theme.gold}70`, margin:'12px auto' }}/>
            <p style={{ color:theme.muted, fontFamily:`'${theme.headingFont}', serif`, fontSize:10, letterSpacing:'0.16em' }}>
              {content.dateLabel}
            </p>
          </div>
        </div>
      </div>

      {/* ── idle state click target ── */}
      <button onClick={open} className="absolute inset-0 z-40 flex flex-col items-end justify-end p-8"
        style={{ background:'transparent', opacity: folding ? 0 : 1, transition:'opacity 0.3s ease' }}>
        <span style={{
          color: theme.muted,
          fontFamily: `'${theme.labelFont}', sans-serif`,
          fontSize: 9, letterSpacing:'0.36em', textTransform:'uppercase',
        }}>
          Tap to Open
        </span>
      </button>

      {/* Upper label (above the envelope) */}
      {stage === 'idle' && (
        <div className="absolute top-[3%] inset-x-0 text-center px-8 z-50 pointer-events-none">
          <p style={{ color:`${theme.surface}88`, fontFamily:`'${theme.labelFont}', sans-serif`, fontSize:8, letterSpacing:'0.42em', textTransform:'uppercase' }}>
            {content.brideName} & {content.groomName} · {content.dateLabel}
          </p>
        </div>
      )}
    </div>
  );
}
