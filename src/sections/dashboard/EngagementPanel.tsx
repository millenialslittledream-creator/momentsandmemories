import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface RSVPStats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
}

interface Props {
  eventId: string;
  eventTitle: string;
}

export default function EngagementPanel({ eventId, eventTitle }: Props) {
  const [stats, setStats] = useState<RSVPStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEventRSVPStats(eventId)
      .then(setStats)
      .catch(() => setStats({ total: 0, accepted: 0, declined: 0, pending: 0 }))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return (
    <div className="flex items-center justify-center py-6">
      <div className="w-4 h-4 border border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
    </div>
  );

  if (!stats) return null;

  const acceptedPct = stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;
  const declinedPct = stats.total > 0 ? Math.round((stats.declined / stats.total) * 100) : 0;
  const pendingPct  = stats.total > 0 ? Math.round((stats.pending  / stats.total) * 100) : 0;

  const shareUrl = `${window.location.origin}/event/${eventId}`;

  return (
    <div className="bg-[#9cb092]/5 border border-[#9cb092]/20 p-5 mt-3">
      <p className="font-display text-[9px] tracking-[0.3em] uppercase text-[#9cb092] mb-1">RSVP Engagement</p>
      <p className="font-serif-exp text-sm text-[#e4eee1] italic mb-5">{eventTitle}</p>

      {/* Progress bar */}
      {stats.total > 0 ? (
        <div className="flex h-1.5 mb-5 overflow-hidden gap-px">
          {acceptedPct > 0 && (
            <div className="bg-[#9cb092] transition-all" style={{ width: `${acceptedPct}%` }} title={`${acceptedPct}% attending`} />
          )}
          {declinedPct > 0 && (
            <div className="bg-red-400/50 transition-all" style={{ width: `${declinedPct}%` }} title={`${declinedPct}% declined`} />
          )}
          {pendingPct > 0 && (
            <div className="bg-[#b2c3b1]/20 transition-all" style={{ width: `${pendingPct}%` }} title={`${pendingPct}% pending`} />
          )}
        </div>
      ) : (
        <div className="h-1.5 bg-[#b2c3b1]/10 mb-5" />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',     value: stats.total,    color: '#e4eee1' },
          { label: 'Attending', value: stats.accepted,  color: '#9cb092' },
          { label: 'Declined',  value: stats.declined,  color: 'rgba(248,113,113,0.7)' },
          { label: 'Pending',   value: stats.pending,   color: '#b2c3b1' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className="font-serif-exp text-xl italic" style={{ color }}>{value}</p>
            <p className="font-display text-[8px] tracking-[0.15em] uppercase text-[#b2c3b1]/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Share link */}
      <div className="pt-4 border-t border-[#9cb092]/15 flex items-center justify-between">
        <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/35 truncate mr-3">{shareUrl}</p>
        <button
          onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); }}
          className="flex-shrink-0 font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092] hover:text-[#9cb092]/70 transition-colors flex items-center gap-1"
        >
          <span className="material-icons text-xs">content_copy</span>
          Copy
        </button>
      </div>
    </div>
  );
}
