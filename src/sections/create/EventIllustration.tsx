// Soft line-art illustrations for each event-type picker card, echoing the
// reference board (cake, arch, pram, champagne, gift + balloons, house,
// gifts). Each scene is drawn in a warm "ink" outline with a wash of the
// event's own accent colour so the cards feel illustrated, not icon-y.

interface Props {
  id: string;
  color: string;
  className?: string;
}

const INK = '#7a6a52';

export default function EventIllustration({ id, color, className }: Props) {
  // Shared props for outline strokes.
  const stroke = { stroke: INK, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const wash = { fill: color, opacity: 0.22 };

  const svg = (children: React.ReactNode) => (
    <svg viewBox="0 0 120 100" className={className} role="img" aria-hidden="true">
      {children}
    </svg>
  );

  switch (id) {
    case 'birthday':
      return svg(
        <>
          {/* balloons */}
          <circle cx="26" cy="26" r="10" {...wash} />
          <circle cx="26" cy="26" r="10" {...stroke} />
          <circle cx="96" cy="22" r="9" fill={color} opacity="0.32" />
          <circle cx="96" cy="22" r="9" {...stroke} />
          <path d="M26 36 q3 8 -1 14M96 31 q-3 7 1 12" {...stroke} />
          {/* plate */}
          <line x1="34" y1="88" x2="96" y2="88" {...stroke} />
          {/* cake */}
          <rect x="44" y="60" width="42" height="28" rx="3" {...wash} />
          <rect x="44" y="60" width="42" height="28" rx="3" {...stroke} />
          <path d="M44 66 q5.25 6 10.5 0 q5.25 6 10.5 0 q5.25 6 10.5 0 q5.25 6 10.5 0" {...stroke} />
          {/* candle + flame */}
          <line x1="65" y1="48" x2="65" y2="60" {...stroke} />
          <path d="M65 40 q5 5 0 8 q-5 -3 0 -8z" fill={color} opacity="0.8" />
        </>
      );

    case 'marriage':
      return svg(
        <>
          {/* arch */}
          <path d="M32 90 V44 a28 28 0 0 1 56 0 V90" {...wash} />
          <path d="M32 90 V44 a28 28 0 0 1 56 0 V90" {...stroke} />
          {/* florals along the arch */}
          <circle cx="38" cy="34" r="4" fill={color} opacity="0.75" />
          <circle cx="52" cy="22" r="4.5" fill={color} opacity="0.6" />
          <circle cx="68" cy="20" r="4" fill={color} opacity="0.75" />
          <circle cx="82" cy="30" r="4.5" fill={color} opacity="0.6" />
          <circle cx="60" cy="18" r="4" fill={color} opacity="0.55" />
          <line x1="34" y1="90" x2="34" y2="90" {...stroke} />
        </>
      );

    case 'babyshower':
      return svg(
        <>
          {/* pram hood */}
          <path d="M40 62 a24 24 0 0 1 48 0 Z" {...wash} />
          <path d="M40 62 a24 24 0 0 1 48 0" {...stroke} />
          <line x1="64" y1="38" x2="64" y2="62" {...stroke} />
          {/* body */}
          <path d="M28 62 h60 a12 12 0 0 1 -12 12 H40 a12 12 0 0 1 -12 -12 Z" {...wash} />
          <path d="M28 62 h60 a12 12 0 0 1 -12 12 H40 a12 12 0 0 1 -12 -12 Z" {...stroke} />
          {/* handle */}
          <path d="M88 62 q10 -2 10 -14" {...stroke} />
          {/* wheels */}
          <circle cx="44" cy="82" r="6" {...stroke} />
          <circle cx="74" cy="82" r="6" {...stroke} />
        </>
      );

    case 'bridetobe':
      return svg(
        <>
          {/* two champagne flutes clinking */}
          <path d="M46 30 L40 58 a6 6 0 0 0 6 6 h0 a6 6 0 0 0 6 -6 L52 30 Z" {...wash} />
          <path d="M46 30 L40 58 a6 6 0 0 0 6 6 h0 a6 6 0 0 0 6 -6 L52 30 Z" {...stroke} />
          <line x1="46" y1="64" x2="46" y2="84" {...stroke} />
          <line x1="38" y1="84" x2="54" y2="84" {...stroke} />
          <path d="M74 30 L68 58 a6 6 0 0 0 6 6 h0 a6 6 0 0 0 6 -6 L80 30 Z" {...wash} />
          <path d="M74 30 L68 58 a6 6 0 0 0 6 6 h0 a6 6 0 0 0 6 -6 L80 30 Z" {...stroke} />
          <line x1="74" y1="64" x2="74" y2="84" {...stroke} />
          <line x1="66" y1="84" x2="82" y2="84" {...stroke} />
          {/* sparkle bubbles */}
          <circle cx="60" cy="24" r="2.4" fill={color} />
          <circle cx="52" cy="18" r="1.6" fill={color} opacity="0.7" />
          <circle cx="68" cy="18" r="1.6" fill={color} opacity="0.7" />
        </>
      );

    case 'genderreveal':
      return svg(
        <>
          {/* pink + blue balloons */}
          <circle cx="34" cy="28" r="11" fill="#e6a9be" opacity="0.5" />
          <circle cx="34" cy="28" r="11" {...stroke} />
          <circle cx="86" cy="28" r="11" fill="#9db8dd" opacity="0.5" />
          <circle cx="86" cy="28" r="11" {...stroke} />
          <path d="M34 39 q4 10 -2 18M86 39 q-4 10 2 18" {...stroke} />
          {/* gift box */}
          <rect x="46" y="60" width="28" height="26" rx="2" {...wash} />
          <rect x="46" y="60" width="28" height="26" rx="2" {...stroke} />
          <line x1="60" y1="60" x2="60" y2="86" {...stroke} />
          <path d="M60 60 q-8 -8 -12 -2 q4 5 12 2 q8 -8 12 -2 q-4 5 -12 2" {...stroke} />
        </>
      );

    case 'housewarming':
      return svg(
        <>
          {/* house body */}
          <rect x="38" y="52" width="44" height="36" {...wash} />
          <rect x="38" y="52" width="44" height="36" {...stroke} />
          {/* roof */}
          <path d="M32 54 L60 30 L88 54 Z" fill={color} opacity="0.32" />
          <path d="M32 54 L60 30 L88 54 Z" {...stroke} />
          {/* chimney */}
          <path d="M74 40 V32 h6 v14" {...stroke} />
          {/* door + window */}
          <rect x="54" y="66" width="12" height="22" {...stroke} />
          <rect x="43" y="60" width="8" height="8" {...stroke} />
        </>
      );

    default: // 'custom' / Others — stacked gifts
      return svg(
        <>
          <rect x="34" y="54" width="30" height="30" rx="2" {...wash} />
          <rect x="34" y="54" width="30" height="30" rx="2" {...stroke} />
          <line x1="49" y1="54" x2="49" y2="84" {...stroke} />
          <path d="M49 54 q-8 -8 -12 -2 q4 5 12 2 q8 -8 12 -2 q-4 5 -12 2" {...stroke} />
          <rect x="66" y="62" width="22" height="22" rx="2" fill={color} opacity="0.3" />
          <rect x="66" y="62" width="22" height="22" rx="2" {...stroke} />
          <line x1="77" y1="62" x2="77" y2="84" {...stroke} />
          <path d="M77 62 q-6 -6 -9 -1.5 q3 4 9 1.5 q6 -6 9 -1.5 q-3 4 -9 1.5" {...stroke} />
          {/* little sparkle */}
          <path d="M96 40 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" fill={color} opacity="0.7" />
        </>
      );
  }
}
