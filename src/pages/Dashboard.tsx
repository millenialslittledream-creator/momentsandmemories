import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/sections/Navigation';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import EngagementPanel from '@/sections/dashboard/EngagementPanel';
import MessagingPanel from '@/sections/dashboard/MessagingPanel';
// GalleryPanel and the Website Builder entry point are intentionally hidden from the
// dashboard for now (not polished enough yet) — both stay reachable by direct URL.
import WebsiteBuilder from '@/components/WebsiteBuilder';
import BookBuilder from '@/components/BookBuilder';

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

interface ModalGuest {
  id: string;
  name: string;
  email: string;
  phone: string;
}

let modalGuestCounter = 0;
function newModalGuest(): ModalGuest {
  return { id: `mg-${++modalGuestCounter}`, name: '', email: '', phone: '' };
}

// ── Gift ad data ──────────────────────────────────────────────────────────────
interface AdProduct { name: string; price: number; image: string }
interface GiftAd { label: string; headline: string; desc: string; products: [AdProduct, AdProduct]; cta: string }

const GIFT_ADS: Record<string, GiftAd> = {
  wedding: {
    label: 'WEDDINGS',
    headline: 'Celebrate love with meaningful gifts',
    desc: 'Handcrafted pieces that make lasting memories for the happy couple.',
    products: [
      { name: 'Speckled Ceramic Vase', price: 299, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ' },
      { name: 'Bubble Cube Candle', price: 349, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d' },
    ],
    cta: 'SHOP WEDDING GIFTS',
  },
  marriage: {
    label: 'WEDDINGS',
    headline: 'Celebrate love with meaningful gifts',
    desc: 'Handcrafted pieces that make lasting memories for the happy couple.',
    products: [
      { name: 'Speckled Ceramic Vase', price: 299, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ' },
      { name: 'Brass Lotus Diya', price: 559, image: 'https://static.wixstatic.com/media/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg' },
    ],
    cta: 'SHOP WEDDING GIFTS',
  },
  birthday: {
    label: 'BIRTHDAYS',
    headline: 'Make their birthday unforgettable',
    desc: 'Thoughtful gifts that show you care about every detail.',
    products: [
      { name: 'Ceramic Match Cloche', price: 249, image: 'https://static.wixstatic.com/media/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg' },
      { name: 'Stone Incense Holder', price: 199, image: 'https://static.wixstatic.com/media/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg' },
    ],
    cta: 'SHOP BIRTHDAY GIFTS',
  },
  babyshower: {
    label: 'BABY SHOWERS',
    headline: 'Welcome the little one with love',
    desc: 'Gentle, thoughtful gifts to celebrate a new chapter.',
    products: [
      { name: 'Bubble Cube Candle', price: 349, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d' },
      { name: 'Santal Essential Oil', price: 380, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ' },
    ],
    cta: 'SHOP BABY SHOWER GIFTS',
  },
  engagement: {
    label: 'ENGAGEMENTS',
    headline: 'Celebrate the start of forever',
    desc: 'Elegant gifts for a milestone worth remembering.',
    products: [
      { name: 'Speckled Ceramic Vase', price: 299, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ' },
      { name: 'Marble Tray Set', price: 899, image: 'https://static.wixstatic.com/media/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg' },
    ],
    cta: 'SHOP ENGAGEMENT GIFTS',
  },
};

const DEFAULT_GIFT_AD: GiftAd = {
  label: 'GIFTS',
  headline: 'Find the perfect gift',
  desc: 'Handcrafted pieces that create lasting memories for every occasion.',
  products: [
    { name: 'Speckled Ceramic Vase', price: 299, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ' },
    { name: 'Bubble Cube Candle', price: 349, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d' },
  ],
  cta: 'SHOP GIFTS',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<'analytics' | 'messages' | 'gallery'>('analytics');

  // Website builder modal state
  const [websiteBuilderEvent, setWebsiteBuilderEvent] = useState<EventRow | null>(null);

  // Book builder modal state
  const [bookBuilderEvent, setBookBuilderEvent] = useState<EventRow | null>(null);

  // Add-guests modal state
  const [addGuestsEvent, setAddGuestsEvent] = useState<EventRow | null>(null);
  const [existingCount, setExistingCount] = useState(0);
  const [modalGuests, setModalGuests] = useState<ModalGuest[]>([newModalGuest()]);
  const modalGuestsRef = useRef(modalGuests);
  useEffect(() => { modalGuestsRef.current = modalGuests; }, [modalGuests]);
  const [modalQrSession, setModalQrSession] = useState<{ token: string; qr_code_base64: string } | null>(null);
  const [modalQrLoading, setModalQrLoading] = useState(false);
  const [savingGuests, setSavingGuests] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [deletingDraft, setDeletingDraft] = useState(false);

  const handleDeleteDraft = async () => {
    if (!draft || deletingDraft) return;
    if (!window.confirm('Delete this draft? This cannot be undone.')) return;
    setDeletingDraft(true);
    try {
      await api.deleteDraft();
      setDraft(null);
      // Also clear any local-storage draft kept by the create flow so it
      // does not silently restore the deleted one on next visit to /create.
      try { localStorage.removeItem('mm_evite_draft'); } catch { /* ignore */ }
    } catch (e) {
      console.warn('Failed to delete draft:', e);
    } finally {
      setDeletingDraft(false);
    }
  };

  const [websiteSlugByEvent, setWebsiteSlugByEvent] = useState<Record<string, string>>({});
  const [bookIdByEvent, setBookIdByEvent] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api.getMyEvents().catch(() => [] as EventRow[]),
      api.getDraft().catch(() => null),
      api.listEventWebsites().catch(() => []),
      api.listInvitationBooks().catch(() => []),
    ]).then(([evs, dr, sites, books]) => {
      setEvents(evs);
      setDraft(dr && dr.step > 0 ? dr : null);
      setWebsiteSlugByEvent(
        Object.fromEntries(
          sites.filter((s) => s.published).map((s) => [s.event_id, s.slug])
        )
      );
      setBookIdByEvent(
        Object.fromEntries(
          books.filter((b) => b.published).map((b) => [b.event_id, b.id])
        )
      );
      setLoading(false);
    });
  }, []);

  const upcoming = events.filter(
    (e) => e.status === 'published' && new Date(e.event_date) >= new Date()
  );

  const eventType = (events[0]?.template_id || draft?.event_type || '').toLowerCase();
  const giftAd = GIFT_ADS[eventType] ?? DEFAULT_GIFT_AD;

  const openAddGuests = async (e: React.MouseEvent, event: EventRow) => {
    e.stopPropagation();
    setAddGuestsEvent(event);
    setModalGuests([newModalGuest()]);
    setSavedCount(null);
    setModalQrSession(null);
    try {
      const invitees = await api.getInvitees(event.id);
      setExistingCount(invitees.length);
    } catch { setExistingCount(0); }
  };

  const closeModal = () => {
    setAddGuestsEvent(null);
    setModalQrSession(null);
  };

  const handleModalQRImport = async () => {
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) return;
    setModalQrLoading(true);
    try {
      const session = await api.createQRSession();
      setModalQrSession({ token: session.session_token, qr_code_base64: session.qr_code_base64 });

      let resolved = false;

      const resolve = (contacts: Array<{ name: string; email?: string; phone?: string }>) => {
        if (resolved) return;
        resolved = true;
        const newGuests = contacts.map((c) => ({
          id: `mg-${++modalGuestCounter}`,
          name: c.name || '',
          email: c.email || '',
          phone: c.phone || '',
        }));
        setModalGuests((prev) => {
          const existing = prev.filter((g) => g.name.trim());
          return [...existing, ...newGuests];
        });
        supabase.removeChannel(channel);
        clearInterval(pollInterval);
        setModalQrSession(null);
      };

      const channel = supabase
        .channel(`qr-dash-${session.session_token}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'qr_contact_sessions', filter: `session_token=eq.${session.session_token}` },
          (payload: { new: { status: string; contacts_json: Array<{ name: string; email?: string; phone?: string }> } }) => {
            if (payload.new.status === 'completed' && payload.new.contacts_json?.length) {
              resolve(payload.new.contacts_json);
            }
          }
        )
        .subscribe();

      const pollInterval = setInterval(async () => {
        try {
          const status = await api.pollQRSession(session.session_token) as { status: string; contacts_json?: Array<{ name: string; email?: string; phone?: string }> };
          if (status.status === 'completed' && status.contacts_json?.length) {
            resolve(status.contacts_json);
          }
        } catch { /* ignore */ }
      }, 2000);

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          clearInterval(pollInterval);
          supabase.removeChannel(channel);
          setModalQrSession(null);
        }
      }, 15 * 60 * 1000);

    } finally {
      setModalQrLoading(false);
    }
  };

  const handleSaveGuests = async () => {
    if (!addGuestsEvent) return;
    const valid = modalGuests.filter((g) => g.name.trim());
    if (!valid.length) return;
    setSavingGuests(true);
    try {
      await api.addInvitees(
        addGuestsEvent.id,
        valid.map((g) => ({ name: g.name, email: g.email || undefined, phone: g.phone || undefined, source: 'manual' }))
      );
      setSavedCount(valid.length);
      const updated = await api.getMyEvents().catch(() => events);
      setEvents(updated);
    } finally {
      setSavingGuests(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111914] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EADDD7] text-[#e4eee1] relative">
      {/* Shared checkered bg — matches /create and /shop */}
      <div
        className="fixed inset-0 z-0 opacity-30 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0yNSOWSBJLsv1-47TiuxQ15AFQ4nsrk2tyl20R-zvNNsiDXBNDhZVYz1yHqSCTtqtGcVjl35j2rrDIrA-d5xW6tM2FPDinMxC7wGNXKzBCT0JhfwdSkLFQPVqU1yfc1GtqRHSfxSmlitg3lWmrbcCqzLdzR4XsiD9nN9-_O7fp4ViDdX7MFMvLLa9exuWvETBq8HCVRb7NcpP7tWvqDoEWCeegHipJmlKBCM4gpRO9AROi6bPaa2gmQvHKabiYnelhLueCkgQ9QIe')`,
        }}
      />
      <div className="fixed inset-0 z-[1] bg-[#111914]/70 pointer-events-none" />

      <Navigation />
      <div className="relative z-10 pt-24 px-4 md:px-8 pb-16 max-w-7xl mx-auto">
        {/* ── Welcome header — full-width so the gift panel below sits at the
            same Y as the stats bar instead of starting up by the title. ── */}
        <div className="mb-8">
          <p className="font-display text-[10px] tracking-[0.25em] uppercase text-[#9cb092]/70 mb-2">Welcome back</p>
          <h1 className="text-3xl md:text-5xl font-serif-exp italic text-[#e4eee1]">
            {user?.email?.split('@')[0]}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 lg:gap-12 items-start">

          {/* ── Left column — dashboard content ── */}
          <div>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-px bg-white/5 mb-10 border border-white/5">
              {[
                { label: 'Total Evites', value: events.length },
                { label: 'Upcoming', value: upcoming.length },
                { label: 'Drafts', value: draft ? 1 : 0 },
              ].map((s) => (
                <div key={s.label} className="bg-[#0d1a10] px-4 md:px-6 py-5 text-center">
                  <p className="text-2xl font-serif-exp text-[#9cb092] mb-1">{s.value}</p>
                  <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/40">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Active Draft */}
            {draft && (
              <div className="mb-8 border border-[#9cb092]/20 bg-[#9cb092]/5 p-4 md:p-6 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <span className="material-icons text-[#9cb092] text-2xl">edit_note</span>
                  <div>
                    <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#9cb092] mb-0.5">Draft in progress</p>
                    <p className="text-sm text-[#b2c3b1]/60">
                      {draft.event_type || 'Evite'} — Step {draft.step + 1}{' · '}Last saved {new Date(draft.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleDeleteDraft}
                    disabled={deletingDraft}
                    title="Delete this draft"
                    className="px-3 py-2 border border-white/10 hover:border-red-400/50 text-[#b2c3b1]/60 hover:text-red-400 font-display text-[10px] tracking-[0.2em] uppercase transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-icons text-sm">delete_outline</span>
                    <span className="hidden sm:inline">{deletingDraft ? 'Deleting…' : 'Delete'}</span>
                  </button>
                  <button
                    onClick={() => navigate('/create')}
                    className="px-6 py-2 bg-[#9cb092] text-[#0d1a10] font-display text-[10px] tracking-[0.2em] uppercase hover:bg-[#b2c3b1] transition-colors"
                  >
                    Continue
                  </button>
                </div>
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
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/30 mb-6">No evites yet</p>
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
                  <div key={event.id}>
                    {/* Event row */}
                    <div className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-4 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#e4eee1] truncate">{event.title}</p>
                        <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/40 mt-0.5">
                          {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {event.location ? ` · ${event.location}` : ''}
                        </p>
                      </div>
                      <span className={`font-display text-[9px] tracking-[0.15em] uppercase px-2 py-1 border flex-shrink-0 ${
                        event.status === 'published' ? 'border-[#9cb092]/30 text-[#9cb092]' : 'border-white/10 text-[#b2c3b1]/40'
                      }`}>
                        {event.status}
                      </span>
                      {/* Share button for published events */}
                      {event.status === 'published' && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/event/${event.id}`); toast.success('Event link copied!'); }}
                          title="Share event"
                          className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 border border-white/10 hover:border-[#9cb092]/40 hover:text-[#9cb092] text-[#b2c3b1]/40 transition-colors font-display text-[9px] tracking-[0.15em] uppercase"
                        >
                          <span className="material-icons text-sm">share</span>
                        </button>
                      )}
                      {/* Quick link to the live website, when one is published — the
                         editing entry point stays hidden, this is view-only discovery. */}
                      {websiteSlugByEvent[event.id] && (
                        <a
                          href={`/w/${websiteSlugByEvent[event.id]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View live website"
                          className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 border border-white/10 hover:border-[#9cb092]/40 hover:text-[#9cb092] text-[#b2c3b1]/40 transition-colors font-display text-[9px] tracking-[0.15em] uppercase"
                        >
                          <span className="material-icons text-sm">language</span>
                          <span className="hidden sm:inline">View Website</span>
                        </a>
                      )}
                      {/* Quick link to the live book viewer, when one is published. */}
                      {bookIdByEvent[event.id] && (
                        <a
                          href={`/event/${event.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View live invitation book"
                          className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 border border-white/10 hover:border-[#9cb092]/40 hover:text-[#9cb092] text-[#b2c3b1]/40 transition-colors font-display text-[9px] tracking-[0.15em] uppercase"
                        >
                          <span className="material-icons text-sm">menu_book</span>
                          <span className="hidden sm:inline">View Book</span>
                        </a>
                      )}
                      <button
                        onClick={(e) => openAddGuests(e, event)}
                        title="Add guests"
                        className="flex-shrink-0 flex items-center gap-1 px-2 md:px-3 py-1.5 border border-white/10 hover:border-[#9cb092]/40 hover:text-[#9cb092] text-[#b2c3b1]/40 transition-colors font-display text-[9px] tracking-[0.15em] uppercase"
                      >
                        <span className="material-icons text-sm">person_add</span>
                        <span className="hidden sm:inline">Add Guests</span>
                      </button>
                      <button
                        onClick={() => setBookBuilderEvent(event)}
                        title="Build an invitation book"
                        className="flex-shrink-0 flex items-center gap-1 px-2 md:px-3 py-1.5 border border-white/10 hover:border-[#9cb092]/40 hover:text-[#9cb092] text-[#b2c3b1]/40 transition-colors font-display text-[9px] tracking-[0.15em] uppercase"
                      >
                        <span className="material-icons text-sm">menu_book</span>
                        <span className="hidden sm:inline">Book</span>
                      </button>
                      {/* Expand toggle */}
                      {event.status === 'published' && (
                        <button
                          onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                          title="Analytics & Messages"
                          className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 border border-white/10 hover:border-[#9cb092]/40 hover:text-[#9cb092] text-[#b2c3b1]/40 transition-colors font-display text-[9px] tracking-[0.15em] uppercase"
                        >
                          <span className="material-icons text-sm">
                            {expandedEventId === event.id ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Expanded panels */}
                    {expandedEventId === event.id && event.status === 'published' && (
                      <div className="border border-t-0 border-white/5 bg-white/[0.01] px-4 md:px-5 pb-4">
                        {/* Tab switcher */}
                        <div className="flex gap-0 border-b border-[#9cb092]/15 mb-1 pt-3">
                          {(['analytics', 'messages'] as const).map(t => (
                            <button
                              key={t}
                              onClick={() => setExpandedTab(t)}
                              className={`px-4 py-2 font-display text-[9px] tracking-[0.2em] uppercase border-b-2 -mb-px transition-colors ${
                                expandedTab === t
                                  ? 'text-[#9cb092] border-[#9cb092]'
                                  : 'text-[#b2c3b1]/40 border-transparent hover:text-[#b2c3b1]/60'
                              }`}
                            >
                              {t === 'analytics' ? 'RSVP Analytics' : 'Messages'}
                            </button>
                          ))}
                        </div>
                        {expandedTab === 'analytics' && (
                          <EngagementPanel eventId={event.id} eventTitle={event.title} />
                        )}
                        {expandedTab === 'messages' && (
                          <MessagingPanel eventId={event.id} />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right column — Gift advertisement panel ── */}
          <div className="lg:sticky lg:top-28">
            <div className="border border-white/10 bg-[#111914] overflow-hidden">
              {/* Panel header */}
              <div className="px-5 py-3.5 border-b border-white/[0.07] bg-white/[0.02] flex items-center justify-between">
                <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092]/60">Perfect Gifts for</p>
                <p className="font-display text-[10px] tracking-[0.18em] uppercase text-[#9cb092] font-bold">{giftAd.label}</p>
              </div>

              {/* Panel content */}
              <div className="px-5 py-5">
                <h2 className="font-serif-exp text-xl md:text-2xl text-[#e4eee1] leading-tight mb-2">
                  {giftAd.headline}
                </h2>
                <p className="font-display text-xs text-[#b2c3b1]/55 leading-relaxed mb-5">
                  {giftAd.desc}
                </p>

                {/* Product cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {giftAd.products.map((product, i) => (
                    <button
                      key={i}
                      onClick={() => navigate('/shop')}
                      className="group text-left"
                    >
                      <div className="aspect-square overflow-hidden bg-[#192116] border border-white/[0.07] mb-2">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <p className="font-serif-exp text-[11px] text-[#e4eee1] leading-tight truncate">{product.name}</p>
                      <p className="font-display text-[10px] font-semibold text-[#9cb092] mt-0.5">$ {product.price}</p>
                    </button>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate('/shop')}
                  className="w-full py-3 bg-[#9cb092] text-[#0d1a10] font-display text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-[#b2c3b1] transition-colors flex items-center justify-center gap-2"
                >
                  {giftAd.cta}
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Website Builder ── */}
      {websiteBuilderEvent && (
        <WebsiteBuilder
          eventId={websiteBuilderEvent.id}
          eventTitle={websiteBuilderEvent.title}
          eventDate={new Date(websiteBuilderEvent.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          eventLocation={websiteBuilderEvent.location ?? undefined}
          onClose={() => setWebsiteBuilderEvent(null)}
        />
      )}

      {/* ── Book Builder ── */}
      {bookBuilderEvent && (
        <BookBuilder
          eventId={bookBuilderEvent.id}
          eventTitle={bookBuilderEvent.title}
          onClose={() => setBookBuilderEvent(null)}
        />
      )}

      {/* ── Add Guests Modal ── */}
      {addGuestsEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a2418] border border-[#9cb092]/30 w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/10">
              <div>
                <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092]/70">Add Guests</p>
                <h3 className="font-serif-exp text-lg italic text-[#e4eee1] mt-1">{addGuestsEvent.title}</h3>
                {existingCount > 0 && (
                  <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/40 mt-1">
                    {existingCount} existing guest{existingCount !== 1 ? 's' : ''} on this list
                  </p>
                )}
              </div>
              <button onClick={closeModal} className="text-[#b2c3b1]/40 hover:text-[#9cb092] transition-colors mt-1">
                <span className="material-icons">close</span>
              </button>
            </div>

            {savedCount !== null ? (
              <div className="p-10 text-center">
                <span className="material-icons text-[#9cb092] text-4xl mb-4 block">check_circle</span>
                <p className="font-serif-exp text-lg italic text-[#e4eee1] mb-1">
                  {savedCount} guest{savedCount !== 1 ? 's' : ''} added
                </p>
                <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/40 mb-6">
                  They've been added to {addGuestsEvent.title}
                </p>
                <button
                  onClick={closeModal}
                  className="px-8 py-2 bg-[#9cb092] text-[#0d1a10] font-display text-[10px] tracking-[0.2em] uppercase hover:bg-[#b2c3b1] transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* QR import button */}
                <button
                  onClick={handleModalQRImport}
                  disabled={modalQrLoading}
                  className="w-full py-3 border border-dashed border-[#9cb092]/40 hover:border-[#9cb092]/70 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons text-sm">{modalQrLoading ? 'hourglass_top' : 'qr_code_scanner'}</span>
                  {modalQrLoading ? 'Generating QR…' : 'Scan to Import from Phone'}
                </button>

                <div className="flex items-center gap-3 text-[#b2c3b1]/20">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="font-display text-[9px] tracking-[0.15em] uppercase">or add manually</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Manual guest rows */}
                <div className="space-y-3">
                  {modalGuests.map((guest, idx) => (
                    <div key={guest.id} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          placeholder={`Guest ${idx + 1} name *`}
                          value={guest.name}
                          onChange={(e) => setModalGuests((prev) => prev.map((g) => g.id === guest.id ? { ...g, name: e.target.value } : g))}
                          className="w-full bg-white/[0.06] border border-white/15 focus:border-[#9cb092] text-[#e4eee1] text-sm px-3 py-2 placeholder:text-[#b2c3b1]/30 outline-none transition-colors"
                        />
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="email"
                            placeholder="Email"
                            value={guest.email}
                            onChange={(e) => setModalGuests((prev) => prev.map((g) => g.id === guest.id ? { ...g, email: e.target.value } : g))}
                            className="bg-white/[0.06] border border-white/15 focus:border-[#9cb092] text-[#e4eee1] text-sm px-3 py-2 placeholder:text-[#b2c3b1]/30 outline-none transition-colors"
                          />
                          <input
                            type="tel"
                            placeholder="Phone"
                            value={guest.phone}
                            onChange={(e) => setModalGuests((prev) => prev.map((g) => g.id === guest.id ? { ...g, phone: e.target.value } : g))}
                            className="bg-white/[0.06] border border-white/15 focus:border-[#9cb092] text-[#e4eee1] text-sm px-3 py-2 placeholder:text-[#b2c3b1]/30 outline-none transition-colors"
                          />
                        </div>
                      </div>
                      {modalGuests.length > 1 && (
                        <button
                          onClick={() => setModalGuests((prev) => prev.filter((g) => g.id !== guest.id))}
                          className="mt-2 text-[#b2c3b1]/30 hover:text-red-400/70 transition-colors"
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setModalGuests((prev) => [...prev, newModalGuest()])}
                    className="flex items-center gap-1 font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092]/60 hover:text-[#9cb092] transition-colors"
                  >
                    <span className="material-icons text-xs">add</span>
                    Add another guest
                  </button>
                </div>

                <button
                  onClick={handleSaveGuests}
                  disabled={savingGuests || !modalGuests.some((g) => g.name.trim())}
                  className="w-full py-3 bg-[#9cb092] text-[#0d1a10] font-display text-[10px] tracking-[0.2em] uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b2c3b1] transition-colors"
                >
                  {savingGuests ? 'Saving…' : 'Save Guests'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR scan modal */}
      {modalQrSession && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a2418] border border-[#9cb092]/30 p-8 max-w-sm w-full text-center">
            <h3 className="font-serif-exp text-lg text-[#e4eee1] italic mb-2">Scan with Phone</h3>
            <p className="font-display text-[10px] tracking-[0.15em] text-[#b2c3b1]/60 uppercase mb-6">
              Open this QR on your phone → pick contacts → they appear here automatically
            </p>
            <img src={`data:image/png;base64,${modalQrSession.qr_code_base64}`} alt="QR Code" className="w-48 h-48 mx-auto mb-6 border border-white/10" />
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 border border-[#9cb092]/40 border-t-[#9cb092] rounded-full animate-spin" />
              <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/50">Waiting for contacts…</p>
            </div>
            <button onClick={() => setModalQrSession(null)} className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 hover:text-[#9cb092] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
