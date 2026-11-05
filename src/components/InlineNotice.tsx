export type NoticeKind = 'error' | 'success' | 'info';
export type Notice = { kind: NoticeKind; text: string } | null;

const STYLES: Record<NoticeKind, string> = {
  error: 'text-red-600',
  success: 'text-emerald-700',
  info: 'text-[#5b6b57]',
};

/**
 * Plain on-page message (no popup). Used where a popup used to be the only feedback, so a wrong
 * code, a failed upload or a failed publish is never silent now that popups are switched off.
 */
export default function InlineNotice({ notice, className = '' }: { notice: Notice; className?: string }) {
  if (!notice) return null;
  return (
    <p
      role={notice.kind === 'error' ? 'alert' : 'status'}
      className={`basis-full text-xs leading-snug ${STYLES[notice.kind]} ${className}`}
    >
      {notice.text}
    </p>
  );
}
