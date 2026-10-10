import { useEffect, useMemo, useState } from 'react';
import { api, type RSVPStats } from '@/lib/api';

interface Props {
  eventId: string;
  eventTitle: string;
  refreshToken?: number;
}

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  accepted: { label: 'Will Attend', color: '#9cb092', icon: 'check_circle' },
  maybe: { label: 'Tentative', color: '#fbbf24', icon: 'help' },
  declined: { label: "Won't Attend", color: '#f87171', icon: 'cancel' },
  pending: { label: 'No Response', color: '#9aa6a0', icon: 'schedule' },
};

const GROUP_COLORS: Record<string, string> = {
  '1': '#9cb092',
  '2': '#c4a882',
  '3-4': '#7f9bb3',
  '5+': '#c98f8f',
};

export default function RSVPAnalytics({ eventId, eventTitle, refreshToken = 0 }: Props) {
  const [stats, setStats] = useState<RSVPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    api
      .getEventRSVPStats(eventId)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [eventId, refreshToken]);

  const pct = (n: number) => (stats && stats.total > 0 ? Math.round((n / stats.total) * 100) : 0);

  const foodEntries = useMemo(
    () => Object.entries(stats?.food_preferences ?? {}).sort((a, b) => b[1] - a[1]),
    [stats]
  );
  const foodMax = foodEntries.reduce((m, [, v]) => Math.max(m, v), 0) || 1;

  const groupEntries = useMemo(
    () => Object.entries(stats?.group_sizes ?? {}).filter(([, v]) => v > 0),
    [stats]
  );
  const groupTotal = groupEntries.reduce((s, [, v]) => s + v, 0);

  const filteredGuests = useMemo(() => {
    const g = stats?.guests ?? [];
    if (statusFilter === 'all') return g;
    return g.filter((x) => x.status === statusFilter);
  }, [stats, statusFilter]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-[#5f7256]/30 border-t-[#9cb092] rounded-full animate-spin" />
      </div>
    );
  if (!stats) return null;

  const maybe = stats.maybe;
  const adults = stats.adults;
  const kids = stats.kids;
  const totalPeople = stats.total_people;
  const avgPerRsvp = stats.accepted > 0 ? (totalPeople / stats.accepted).toFixed(1) : '0';

  const statCards = [
    { key: 'total', label: 'Invited', value: stats.total, color: '#2a3328', icon: 'groups', pctText: '100%' },
    { key: 'responded', label: 'Responded', value: stats.responded, color: '#5f7256', icon: 'mark_email_read', pctText: `${stats.response_rate}%` },
    { key: 'accepted', label: 'Will Attend', value: stats.accepted, color: '#9cb092', icon: 'check_circle', pctText: `${pct(stats.accepted)}%` },
    { key: 'maybe', label: 'Tentative', value: maybe, color: '#fbbf24', icon: 'help', pctText: `${pct(maybe)}%` },
    { key: 'declined', label: "Won't Attend", value: stats.declined, color: '#f87171', icon: 'cancel', pctText: `${pct(stats.declined)}%` },
    { key: 'pending', label: 'No Response', value: stats.pending, color: '#9aa6a0', icon: 'schedule', pctText: `${pct(stats.pending)}%` },
  ];

  // Donut geometry
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="py-3 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-display text-[9px] tracking-[0.3em] uppercase text-[#5f7256]">RSVP Analytics</p>
          <p className="font-serif-exp text-sm text-[#2a3328] italic">{eventTitle}</p>
        </div>
        <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#5a6c50]/35">
          Responses &amp; guest preferences
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {statCards.map((c) => (
          <div key={c.key} className="border border-[#3d4a35]/12 bg-white/60 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-icons text-sm" style={{ color: c.color }}>{c.icon}</span>
              <span className="font-display text-[8px] tracking-[0.12em] uppercase text-[#5a6c50]/45">{c.label}</span>
            </div>
            <p className="font-serif-exp text-2xl leading-none" style={{ color: c.color }}>{c.value}</p>
            <p className="font-display text-[8px] tracking-[0.1em] uppercase text-[#5a6c50]/35 mt-1">{c.pctText}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Attendance summary */}
        <div className="border border-[#3d4a35]/12 bg-white/60 p-4">
          <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#5f7256] mb-3">Attendance Summary</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-display text-[8px] tracking-[0.12em] uppercase text-[#5a6c50]/40">Adults</p>
              <p className="font-serif-exp text-xl text-[#2a3328]">{adults}</p>
            </div>
            <div>
              <p className="font-display text-[8px] tracking-[0.12em] uppercase text-[#5a6c50]/40">Children</p>
              <p className="font-serif-exp text-xl text-[#2a3328]">{kids}</p>
            </div>
            <div>
              <p className="font-display text-[8px] tracking-[0.12em] uppercase text-[#5a6c50]/40">Total People</p>
              <p className="font-serif-exp text-xl text-[#5f7256]">{totalPeople}</p>
            </div>
            <div>
              <p className="font-display text-[8px] tracking-[0.12em] uppercase text-[#5a6c50]/40">Avg per RSVP</p>
              <p className="font-serif-exp text-xl text-[#2a3328]">{avgPerRsvp}</p>
            </div>
          </div>
        </div>

        {/* Top food preferences */}
        <div className="border border-[#3d4a35]/12 bg-white/60 p-4">
          <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#5f7256] mb-3">Top Food Preferences</p>
          {foodEntries.length === 0 ? (
            <p className="font-display text-[10px] text-[#5a6c50]/35 py-4">No food preferences submitted yet.</p>
          ) : (
            <div className="space-y-2">
              {foodEntries.map(([label, count]) => (
                <div key={label}>
                  <div className="flex justify-between font-display text-[9px] text-[#5a6c50]/60 mb-0.5">
                    <span>{label}</span>
                    <span className="text-[#2a3328]">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/70 overflow-hidden">
                    <div className="h-full bg-[#5f7256]" style={{ width: `${(count / foodMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group size donut */}
        <div className="border border-[#3d4a35]/12 bg-white/60 p-4">
          <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#5f7256] mb-3">Guests Attending (by group size)</p>
          {groupTotal === 0 ? (
            <p className="font-display text-[10px] text-[#5a6c50]/35 py-4">No attending groups yet.</p>
          ) : (
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 100 100" className="w-24 h-24 flex-shrink-0 -rotate-90">
                {groupEntries.map(([label, count]) => {
                  const frac = count / groupTotal;
                  const dash = frac * C;
                  const seg = (
                    <circle
                      key={label}
                      cx="50"
                      cy="50"
                      r={R}
                      fill="none"
                      stroke={GROUP_COLORS[label] ?? '#9cb092'}
                      strokeWidth="12"
                      strokeDasharray={`${dash} ${C - dash}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += dash;
                  return seg;
                })}
                <text x="50" y="52" textAnchor="middle" transform="rotate(90 50 50)" fill="#2a3328" fontSize="14" fontFamily="serif">
                  {groupTotal}
                </text>
              </svg>
              <div className="space-y-1">
                {groupEntries.map(([label, count]) => (
                  <div key={label} className="flex items-center gap-1.5 font-display text-[9px] text-[#5a6c50]/60">
                    <span className="w-2 h-2 rounded-full" style={{ background: GROUP_COLORS[label] ?? '#9cb092' }} />
                    <span>{label === '5+' ? '5+ Guests' : `${label} ${label === '1' ? 'Guest' : 'Guests'}`}</span>
                    <span className="text-[#2a3328] ml-1">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guest responses table */}
      <div className="border border-[#3d4a35]/12 bg-white/60">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#3d4a35]/12 flex-wrap">
          <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#5f7256]">Guest Responses</p>
          <div className="flex gap-1 flex-wrap">
            {[['all', 'All'], ['accepted', 'Will Attend'], ['maybe', 'Tentative'], ['declined', "Won't"], ['pending', 'No Response']].map(
              ([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`px-2 py-1 font-display text-[8px] tracking-[0.1em] uppercase border transition-colors ${
                    statusFilter === key
                      ? 'border-[#5f7256] text-[#5f7256] bg-[#5f7256]/10'
                      : 'border-[#3d4a35]/15 text-[#5a6c50]/40 hover:border-[#5f7256]/40'
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-[#3d4a35]/12">
                {['Guest', 'Contact', 'Status', 'Attending', 'Children', 'Meals', 'Dietary notes', 'Responded'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-display text-[8px] tracking-[0.12em] uppercase text-[#5f7256]/70">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center font-display text-[10px] text-[#5a6c50]/35">
                    No guests in this view yet.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((g, i) => {
                  const meta = STATUS_META[g.status] ?? STATUS_META.pending;
                  return (
                    <tr key={i} className="border-b border-[#3d4a35]/10 last:border-b-0">
                      <td className="px-3 py-2 font-display text-[11px] text-[#2a3328]">{g.name || '—'}</td>
                      <td className="px-3 py-2 font-display text-[9px] text-[#5a6c50]/50 truncate max-w-[160px]">{g.email || g.phone || '—'}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 border font-display text-[8px] tracking-[0.1em] uppercase" style={{ color: meta.color, borderColor: `${meta.color}55` }}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-display text-[10px] text-[#5a6c50]/70">{g.party_size ?? '—'}</td>
                      <td className="px-3 py-2 font-display text-[10px] text-[#5a6c50]/70">{g.kids_count ?? '—'}</td>
                      <td className="px-3 py-2 font-display text-[10px] text-[#5a6c50]/70">
                        {Object.entries(g.meal_preferences ?? {}).length
                          ? Object.entries(g.meal_preferences).map(([meal, count]) => `${meal} × ${count}`).join(', ')
                          : g.food_preference || '—'}
                      </td>
                      <td className="px-3 py-2 font-display text-[10px] text-[#5a6c50]/70">{g.dietary_requirements || '—'}</td>
                      <td className="px-3 py-2 font-display text-[9px] text-[#5a6c50]/50">
                        {g.responded_at ? new Date(g.responded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
