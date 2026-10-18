import type { InvitationHeadingParts } from '@/utils/eventInvitation';

interface InvitationHeadingProps {
  parts: InvitationHeadingParts;
  tone?: 'dark' | 'light';
  className?: string;
  testId?: string;
}

export default function InvitationHeading({
  parts,
  tone = 'dark',
  className = '',
  testId,
}: InvitationHeadingProps) {
  return (
    <h1
      data-testid={testId}
      aria-label={`${parts.lead}${parts.names}${parts.occasion}`}
      className={`font-serif-exp italic leading-[1.12] ${tone === 'light' ? 'text-[#e4eee1]' : 'text-[#2a3328]'} ${className}`}
    >
      <span>{parts.lead}</span>
      <span
        data-testid={testId ? `${testId}-names` : undefined}
        className="font-agatho text-[1.18em] font-semibold not-italic tracking-[-0.025em] [overflow-wrap:anywhere]"
      >
        {parts.names}
      </span>
      <span>{parts.occasion}</span>
    </h1>
  );
}
