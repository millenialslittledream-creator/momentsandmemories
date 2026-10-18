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
  const primaryTone = tone === 'light' ? 'text-[#e4eee1]' : 'text-[#2a3328]';
  const eyebrowTone = tone === 'light' ? 'text-[#9cb092]' : 'text-[#405138]/75';
  const sentence = `${parts.lead}${parts.names}${parts.sentenceSuffix}`;

  return (
    <h1
      data-testid={testId}
      aria-label={sentence}
      className={`text-center ${primaryTone} ${className}`}
    >
      <span
        data-testid={testId ? `${testId}-lead` : undefined}
        className={`mb-3 block font-display text-[0.28em] font-medium not-italic uppercase tracking-[0.34em] ${eyebrowTone}`}
      >
        {parts.lead.trim()}
      </span>
      <span className="block font-serif-exp italic leading-[1.08] tracking-[-0.02em]">
        <span
          data-testid={testId ? `${testId}-names` : undefined}
          className="font-agatho font-medium italic [overflow-wrap:break-word]"
        >
          {parts.names}
        </span>
      </span>
      <span
        data-testid={testId ? `${testId}-occasion` : undefined}
        className={`mt-3 block font-display text-[0.28em] font-medium not-italic uppercase tracking-[0.34em] ${eyebrowTone}`}
      >
        {parts.occasionLabel}
      </span>
    </h1>
  );
}
