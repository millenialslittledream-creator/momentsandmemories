const SAGE = '#9cb092';
const IVORY = '#fdfaf5';
const GOLD = '#a8893d';

// A colored hairline alone can vanish against a same-toned photo (sage border on
// foliage, ivory border on a light dress). Bracket every colored line with a thin
// dark ring on one side and a thin light ring on the other so it stays readable
// against any photo, like a passe-partout mat rather than a flat tinted line.
function contrastBracket(colorShadow: string) {
  return `inset 0 0 0 1px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.5), ${colorShadow}`;
}

function SageHairline() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        boxShadow: contrastBracket(`inset 0 0 0 3px ${SAGE}, inset 0 0 0 9px rgba(156,176,146,0.18)`),
      }}
    />
  );
}

function IvoryDoubleBorder() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ padding: 10 }}>
      <div className="absolute" style={{ inset: 6, boxShadow: contrastBracket(`inset 0 0 0 3px ${IVORY}`) }} />
      <div className="absolute" style={{ inset: 14, boxShadow: contrastBracket(`inset 0 0 0 3px ${IVORY}`) }} />
    </div>
  );
}

function BotanicalCornerSvg({ rotation }: { rotation: number }) {
  // A wider, soft white stroke laid under the thin gold/sage linework so the motif
  // stays legible against light photos, the same way the hairline frames are bracketed.
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <g stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round">
        <path d="M4 4 C 4 22, 10 34, 26 38 C 16 40, 6 48, 4 60" fill="none" />
        <path d="M4 4 L 22 4" />
        <path d="M4 4 L 4 22" />
      </g>
      <path
        d="M4 4 C 4 22, 10 34, 26 38 C 16 40, 6 48, 4 60"
        stroke={GOLD}
        strokeWidth="1.1"
        fill="none"
      />
      <path d="M4 4 L 22 4" stroke={GOLD} strokeWidth="1.1" />
      <path d="M4 4 L 4 22" stroke={GOLD} strokeWidth="1.1" />
      <circle cx="20" cy="20" r="2.2" fill={GOLD} opacity="0.85" />
      <circle cx="11" cy="32" r="1.4" fill={SAGE} opacity="0.9" />
    </svg>
  );
}

function BotanicalCorner() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-0">
        <BotanicalCornerSvg rotation={0} />
      </div>
      <div className="absolute top-0 right-0">
        <BotanicalCornerSvg rotation={90} />
      </div>
      <div className="absolute bottom-0 right-0">
        <BotanicalCornerSvg rotation={180} />
      </div>
      <div className="absolute bottom-0 left-0">
        <BotanicalCornerSvg rotation={270} />
      </div>
    </div>
  );
}

export interface FrameOverlayProps {
  frame?: string;
}

export default function FrameOverlay({ frame }: FrameOverlayProps) {
  switch (frame) {
    case 'sage-hairline':
      return <SageHairline />;
    case 'ivory-double':
      return <IvoryDoubleBorder />;
    case 'botanical-corner':
      return <BotanicalCorner />;
    default:
      return null;
  }
}
