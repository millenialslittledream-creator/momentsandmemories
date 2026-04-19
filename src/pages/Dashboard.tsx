import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/sections/Navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface EventRow {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  status: string;
  template_id: string | null;
  created_at: string;
}

interface Draft {
  step: number;
  event_type: string | null;
  updated_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMyEvents().catch(() => [] as EventRow[]),
      api.getDraft().catch(() => null),
    ]).then(([evs, dr]) => {
      setEvents(evs);
      setDraft(dr && dr.step > 0 ? dr : null);
      setLoading(false);
    });
  }, []);

  const upcoming = events.filter(
    (e) => e.status === 'published' && new Date(e.event_date) >= new Date()
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1a10] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1a10] text-[#e4eee1]">
      <Navigation />
      <div className="pt-24 px-4 pb-16 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="font-display text-[10px] tracking-[0.25em] uppercase text-[#9cb092]/70 mb-2">
            Welcome back
          </p>
          <h1 className="text-3xl md:text-5xl font-serif-exp italic text-[#e4eee1]">
            {user?.email?.split('@')[0]}
          </h1>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-px bg-white/5 mb-10 border border-white/5">
          {[
            { label: 'Total Evites', value: events.length },
            { label: 'Upcoming', value: upcoming.length },
            { label: 'Drafts', value: draft ? 1 : 0 },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d1a10] px-6 py-5 text-center">
              <p className="text-2xl font-serif-exp text-[#9cb092] mb-1">{s.value}</p>
              <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/40">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Active Draft */}
        {draft && (
          <div className="mb-8 border border-[#9cb092]/20 bg-[#9cb092]/5 p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="material-icons text-[#9cb092] text-2xl">edit_note</span>
              <div>
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#9cb092] mb-0.5">
                  Draft in progress
                </p>
                <p className="text-sm text-[#b2c3b1]/60">
                  {draft.event_type || 'Evite'} — Step {draft.step + 1}
                  {' · '}Last saved {new Date(draft.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/create')}
              className="flex-shrink-0 px-6 py-2 bg-[#9cb092] text-[#0d1a10] font-display text-[10px] tracking-[0.2em] uppercase hover:bg-[#b2c3b1] transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Events list */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif-exp text-lg italic text-[#e4eee1]">Your Evites</h2>
          <button
            onClick={() => navigate('/create')}
            className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] hover:text-[#b2c3b1] flex items-center gap-1 transition-colors"
          >
            <span className="material-icons text-sm">add</span>
            New Evite
          </button>
        </div>

        {events.length === 0 ? (
          <div className="border border-white/5 bg-white/[0.02] p-12 text-center">
            <span className="material-icons text-[#9cb092]/30 text-4xl mb-4 block">celebration</span>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/30 mb-6">
              No evites yet
            </p>
            <button
              onClick={() => navigate('/create')}
              className="px-8 py-3 bg-[#3d4a35] text-white font-display text-[10px] tracking-[0.2em] uppercase hover:bg-[#4d5a44] transition-colors"
            >
              Create Your First Evite
            </button>
          </div>
        ) : (
          <div className="space-y-px">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 px-5 py-4 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#e4eee1] truncate">{event.title}</p>
                  <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/40 mt-0.5">
                    {new Date(event.event_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                </div>
                <span
                  className={`font-display text-[9px] tracking-[0.15em] uppercase px-2 py-1 border flex-shrink-0 ${
                    event.status === 'published'
                      ? 'border-[#9cb092]/30 text-[#9cb092]'
                      : 'border-white/10 text-[#b2c3b1]/40'
                  }`}
                >
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
