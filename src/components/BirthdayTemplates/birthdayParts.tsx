/* Birthday-specific shared parts.
   Re-exports generic primitives from WebsiteTemplates/inviteParts so
   birthday design files only need a single import source. */

export {
  AnimStyles,
  Reveal,
  Countdown,
  KenBurns,
  FramedPhoto,
  WaxSeal,
} from '../WebsiteTemplates/inviteParts';

import type { PartyStyle } from './birthdayThemes';
import type { BirthdayTheme } from './birthdayThemes';
import type { BirthdayContent } from './birthdayContent';

/* birthday divider ------------------------------------------------------- */
export function BirthdayDivider({
  partyStyle, color, className = '',
}: {
  partyStyle: PartyStyle; color: string; className?: string;
}) {
  const shimmer = (dir: 'l' | 'r'): React.CSSProperties => ({
    backgroundImage: `linear-gradient(90deg,
      ${dir === 'l' ? 'transparent' : color},
      ${dir === 'l' ? color : 'transparent'},
      ${dir === 'l' ? 'transparent' : color})`,
    backgroundSize: '250% 100%',
    animation: 'inv-shimmer 4.5s linear infinite',
  });

  if (partyStyle === 'star') {
    return (
      <div
        className={`flex items-center justify-center gap-3 my-7 ${className}`}
        style={{ color }}
        aria-hidden>
        <span style={shimmer('l')} className="h-px w-20" />
        <span
          className="text-sm"
          style={{ animation: 'inv-float 3.5s ease-in-out infinite', display: 'inline-block' }}>
          ★
        </span>
        <span style={shimmer('r')} className="h-px w-20" />
      </div>
    );
  }

  if (partyStyle === 'confetti') {
    return (
      <div
        className={`flex items-center justify-center gap-2 my-7 leading-none ${className}`}
        style={{ color }}
        aria-hidden>
        <span className="text-[10px] opacity-40">◆</span>
        <span style={shimmer('l')} className="h-px w-10" />
        <span
          className="text-base"
          style={{ animation: 'inv-float 3s ease-in-out infinite' }}>
          ◆
        </span>
        <span style={shimmer('r')} className="h-px w-10" />
        <span className="text-[10px] opacity-40">◆</span>
      </div>
    );
  }

  /* minimal */
  return (
    <div
      className={`flex items-center justify-center gap-3 my-7 ${className}`}
      aria-hidden>
      <span style={shimmer('l')} className="h-px w-16" />
      <span style={{ borderColor: color }} className="h-1.5 w-1.5 rotate-45 border" />
      <span style={shimmer('r')} className="h-px w-16" />
    </div>
  );
}

/* shared props ----------------------------------------------------------- */
export interface BirthdayDesignProps {
  theme: BirthdayTheme;
  content: BirthdayContent;
  autoOpen?: boolean;
}
