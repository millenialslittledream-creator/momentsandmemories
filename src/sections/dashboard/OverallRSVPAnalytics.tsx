import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type OverallRSVPSummary } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  refreshToken?: number;
}

export default function OverallRSVPAnalytics({ refreshToken = 0 }: Props) {
  const [summary, setSummary] = useState<OverallRSVPSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retryToken, setRetryToken] = useState(0);
  const previousTotals = useRef<string | null>(null);

  useEffect(() => {
    api.getOverallRSVPSummary()
      .then((next) => {
        setLoadError('');
        const fingerprint = JSON.stringify({
          accepted: next.totals.accepted,
          declined: next.totals.declined,
          maybe: next.totals.maybe,
          totalPeople: next.totals.total_people,
          meals: next.totals.food_preferences,
        });
        if (previousTotals.current && previousTotals.current !== fingerprint) {
          toast.success('A guest RSVP was updated. Your analytics are now refreshed.');
        }
        previousTotals.current = fingerprint;
        setSummary(next);
      })
      .catch(() => {
        setSummary(null);
        setLoadError('Overall RSVP analytics could not be loaded. Your event data is still safe.');
      })
      .finally(() => setLoading(false));
  }, [refreshToken, retryToken]);

  const meals = useMemo(
    () => Object.entries(summary?.totals.food_preferences ?? {}).sort((a, b) => b[1] - a[1]),
    [summary]
  );

  if (loading) {
    return <div className="mb-8 flex min-h-32 items-center justify-center border border-[#3d4a35]/10 bg-white/45"><div className="h-5 w-5 animate-spin rounded-full border-2 border-[#5f7256]/25 border-t-[#5f7256]" /></div>;
  }
  if (!summary) return (
    <section className="mb-8 border border-amber-800/20 bg-amber-50/75 p-5 shadow-sm sm:p-6" aria-labelledby="overall-rsvp-heading" role="alert">
      <p className="font-display text-[9px] uppercase tracking-[0.28em] text-amber-900">All events</p>
      <h2 id="overall-rsvp-heading" className="font-serif-exp text-xl italic text-[#2a3328]">Overall RSVP Analytics</h2>
      <p className="mt-3 text-sm text-amber-950">{loadError || 'Overall analytics are unavailable.'}</p>
      <button type="button" onClick={() => { setLoading(true); setLoadError(''); setRetryToken((value) => value + 1); }} className="mt-3 border border-amber-900/30 bg-white/60 px-4 py-2 font-display text-[9px] uppercase tracking-[0.16em] text-amber-950">Retry analytics</button>
    </section>
  );

  const { totals } = summary;
  const cards = [
    ['Events', totals.total_events],
    ['Invited', totals.total],
    ['Responded', totals.responded],
    ['Response rate', `${totals.response_rate}%`],
    ['Adults', totals.adults],
    ['Children', totals.kids],
    ['People attending', totals.total_people],
  ] as const;
  const responseSeries = [
    { label: 'Will attend', value: totals.accepted, color: '#5f7256' },
    { label: 'Tentative', value: totals.maybe, color: '#b7872f' },
    { label: "Won't attend", value: totals.declined, color: '#a65353' },
    { label: 'No response', value: totals.pending, color: '#8a9485' },
  ];
  const responseMax = Math.max(1, ...responseSeries.map((item) => item.value));
  const mealMax = Math.max(1, ...meals.map(([, count]) => count));
  const headcountTotal = Math.max(1, totals.adults + totals.kids);

  return (
    <section className="mb-8 border border-[#3d4a35]/12 bg-white/55 p-4 shadow-sm sm:p-6" aria-labelledby="overall-rsvp-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-display text-[9px] uppercase tracking-[0.28em] text-[#5f7256]">All events</p>
          <h2 id="overall-rsvp-heading" className="font-serif-exp text-xl italic text-[#2a3328]">Overall RSVP Analytics</h2>
        </div>
        <p className="font-display text-[9px] uppercase tracking-[0.12em] text-[#5a6c50]/50">Updates when a guest responds</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {cards.map(([label, value]) => (
          <div key={label} className="border border-[#3d4a35]/10 bg-[#fdfefb]/80 p-3">
            <p className="font-display text-[8px] uppercase tracking-[0.12em] text-[#5a6c50]/55">{label}</p>
            <p className="mt-1 font-serif-exp text-2xl text-[#2a3328]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="border border-[#3d4a35]/10 bg-[#fdfefb]/75 p-4">
          <p className="mb-3 font-display text-[9px] uppercase tracking-[0.18em] text-[#405138]">Responses</p>
          <div className="space-y-3" role="img" aria-label="Overall RSVP response chart">
            {responseSeries.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-[#44533e]"><span>{item.label}</span><strong className="text-[#2a3328]">{item.value}</strong></div>
                <div className="h-2 overflow-hidden rounded-full bg-[#dfe5da]"><div className="h-full rounded-full" style={{ width: `${(item.value / responseMax) * 100}%`, backgroundColor: item.color }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#3d4a35]/10 bg-[#fdfefb]/75 p-4">
          <p className="mb-3 font-display text-[9px] uppercase tracking-[0.18em] text-[#405138]">Attendee mix</p>
          <div className="flex items-end gap-5 pt-2" role="img" aria-label={`${totals.adults} adults and ${totals.kids} children attending`}>
            {[
              { label: 'Adults', value: totals.adults, color: '#5f7256' },
              { label: 'Children', value: totals.kids, color: '#c09a57' },
            ].map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center">
                <strong className="mb-2 font-serif-exp text-xl text-[#2a3328]">{item.value}</strong>
                <div className="flex h-24 w-full items-end overflow-hidden rounded-t-sm bg-[#e6eadf]"><div className="w-full transition-all" style={{ height: `${Math.max(item.value ? 10 : 0, (item.value / headcountTotal) * 100)}%`, backgroundColor: item.color }} /></div>
                <span className="mt-2 font-display text-[8px] uppercase tracking-[0.12em] text-[#44533e]/75">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#3d4a35]/10 bg-[#fdfefb]/75 p-4">
          <p className="mb-3 font-display text-[9px] uppercase tracking-[0.18em] text-[#405138]">Meals across events</p>
          {meals.length === 0 ? <p className="text-sm text-[#44533e]/65">No meal choices yet.</p> : (
            <div className="space-y-3" role="img" aria-label="Meal preferences across all events">
              {meals.map(([meal, count]) => (
                <div key={meal}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="truncate text-[#44533e]">{meal}</span><strong className="text-[#2a3328]">{count}</strong></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#dfe5da]"><div className="h-full rounded-full bg-[#718166]" style={{ width: `${(count / mealMax) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <div className="border border-[#3d4a35]/10 bg-[#fdfefb]/70 p-4">
          <p className="mb-3 font-display text-[9px] uppercase tracking-[0.18em] text-[#5f7256]">Event comparison</p>
          {summary.events.length === 0 ? (
            <p className="text-sm text-[#5a6c50]/55">Create and publish an evite to begin collecting RSVPs.</p>
          ) : (
            <div className="space-y-2">
              {summary.events.map((event) => (
                <div key={event.event_id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-[#3d4a35]/10 pb-2 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#2a3328]">{event.event_title}</p>
                    <p className="font-display text-[8px] uppercase tracking-[0.1em] text-[#5a6c50]/50">{event.responded} of {event.total} responded</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#dfe5da]"><div className="h-full rounded-full bg-[#5f7256]" style={{ width: `${event.response_rate}%` }} /></div>
                  </div>
                  <div className="text-right"><p className="text-sm font-semibold text-[#5f7256]">{event.response_rate}%</p><p className="font-display text-[7px] uppercase tracking-[0.1em] text-[#5a6c50]/45">response</p></div>
                  <div className="text-right"><p className="text-sm font-semibold text-[#2a3328]">{event.total_people}</p><p className="font-display text-[7px] uppercase tracking-[0.1em] text-[#5a6c50]/45">attending</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
