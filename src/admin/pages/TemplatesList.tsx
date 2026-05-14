import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { eviteTemplates } from '@/data/eviteTemplates';
import { adminApi, clearStoredSecret } from '../lib/adminClient';
import type { TemplateLayout } from '../types';

type FilterMode = 'all' | 'annotated' | 'unannotated';

export default function TemplatesList() {
  const [layouts, setLayouts] = useState<Record<string, TemplateLayout>>({});
  const [filter, setFilter] = useState<FilterMode>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.listLayouts();
        if (!cancelled) setLayouts(res.layouts);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const eventTypes = useMemo(() => {
    const set = new Set(eviteTemplates.map((t) => t.eventType));
    return ['all', ...Array.from(set)];
  }, []);

  const visible = useMemo(() => {
    return eviteTemplates.filter((t) => {
      const annotated = !!layouts[t.id];
      if (filter === 'annotated' && !annotated) return false;
      if (filter === 'unannotated' && annotated) return false;
      if (eventTypeFilter !== 'all' && t.eventType !== eventTypeFilter) return false;
      return true;
    });
  }, [filter, eventTypeFilter, layouts]);

  const stats = useMemo(() => {
    const total = eviteTemplates.length;
    const annotated = eviteTemplates.filter((t) => layouts[t.id]).length;
    return { total, annotated, remaining: total - annotated };
  }, [layouts]);

  const signOut = () => {
    clearStoredSecret();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white/90">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xs tracking-[0.25em] uppercase text-white/60">Studio</h1>
          <p className="font-mono text-[10px] text-white/30 mt-0.5">
            {stats.annotated} / {stats.total} annotated · {stats.remaining} remaining
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/_studio/settings"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-white/70 transition-colors"
          >
            Settings
          </Link>
          <button
            onClick={signOut}
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-white/70 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="px-6 py-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {(['all', 'unannotated', 'annotated'] as FilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-3 h-7 font-mono text-[10px] tracking-[0.2em] uppercase border ${
                  filter === mode
                    ? 'bg-white/10 border-white/30 text-white'
                    : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
                } transition-colors`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-white/10" />
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="bg-transparent border border-white/10 text-white/70 font-mono text-[10px] tracking-[0.15em] uppercase px-2 h-7 outline-none focus:border-white/30"
          >
            {eventTypes.map((t) => (
              <option key={t} value={t} className="bg-[#0a0f0a]">
                {t}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <p className="font-mono text-[10px] text-white/30 tracking-wide">Loading…</p>
        )}
        {error && (
          <p className="font-mono text-[10px] text-red-400/70 tracking-wide">{error}</p>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {visible.map((t) => {
              const annotated = !!layouts[t.id];
              return (
                <Link
                  key={t.id}
                  to={`/_studio/templates/${encodeURIComponent(t.id)}`}
                  className="group relative block aspect-[3/4] overflow-hidden border border-white/10 hover:border-white/40 transition-colors"
                >
                  <img
                    src={t.previewImage}
                    alt={t.name}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        annotated ? 'bg-green-400' : 'bg-yellow-400/70'
                      }`}
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-white/50 truncate">
                      {t.id}
                    </p>
                    <p className="font-mono text-[10px] text-white/90 truncate">{t.name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
