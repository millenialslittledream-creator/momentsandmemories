import { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { DESIGNS as WEDDING_DESIGNS } from './WebsiteTemplates/designs';
import { WEDDING_THEMES } from './WebsiteTemplates/themes';
import { BIRTHDAY_DESIGNS } from './BirthdayTemplates/designs';
import { BIRTHDAY_THEMES } from './BirthdayTemplates/birthdayThemes';
import { EVENT_TEMPLATES, type EventKey } from './EventTemplates/registry';

const InviteEditor      = lazy(() => import('./WebsiteTemplates/InviteEditor'));
const BirthdayEditor    = lazy(() => import('./BirthdayTemplates/BirthdayEditor'));
const EventInviteEditor = lazy(() => import('./EventTemplates/EventInviteEditor'));

/* The hub is driven entirely by the event chosen upstream (in the Create flow),
   passed via ?event=. No more in-hub event filter. */
type HubEvent = 'marriage' | 'birthday' | EventKey;

/* ── normalized card model for the design grid ──────────────────────────── */
interface HubCard {
  id: string;
  name: string;
  sub: string;
  ornament: string;
  preview: React.CSSProperties;
}
interface HubView {
  label: string;
  cards: HubCard[];
  swatches: { accent: string; gold: string; surface: string }[];
  editorKind: 'wedding' | 'birthday' | 'event';
  eventKey?: EventKey;
}

const WEDDING_META: Record<string, { preview: React.CSSProperties; ornament: string; sub: string }> = {
  timeless:  { preview: { background: 'linear-gradient(180deg, #2c0a10 0%, #4a1220 55%, #fcf4e6 55%, #f5e6cf 100%)' }, ornament: '✦', sub: 'Classic framed envelope' },
  grand:     { preview: { background: 'linear-gradient(180deg, #7a1f2b 0%, #2c0a10 100%)' }, ornament: '◈', sub: 'Cinematic full-bleed hero' },
  editorial: { preview: { background: 'linear-gradient(135deg, #1a0a0e 0%, #321b24 100%)' }, ornament: '—', sub: 'Bold modern masthead' },
};
const BIRTHDAY_META: Record<string, { preview: React.CSSProperties; ornament: string; sub: string }> = {
  bash:      { preview: { background: 'linear-gradient(135deg, #1a0e00 0%, #5c2400 60%, #d4890f 100%)' }, ornament: '★', sub: 'High-energy party' },
  soiree:    { preview: { background: 'linear-gradient(180deg, #05080f 0%, #1a237e 50%, #05080f 100%)' }, ornament: '◈', sub: 'Elegant full-bleed' },
  milestone: { preview: { background: 'linear-gradient(135deg, #200015 0%, #5c0040 50%, #aa0060 100%)' }, ornament: '◆', sub: 'Bold editorial' },
};

const EVENT_ALIASES: Record<string, HubEvent> = {
  wedding: 'marriage', marriage: 'marriage', birthday: 'birthday',
  babyshower: 'babyshower', bridetobe: 'bridetobe', prewedding: 'bridetobe',
  genderreveal: 'genderreveal', housewarming: 'housewarming', custom: 'custom', others: 'custom',
};

function buildView(event: HubEvent): HubView {
  if (event === 'marriage') {
    return {
      label: 'Wedding', editorKind: 'wedding',
      swatches: WEDDING_THEMES.map((t) => ({ accent: t.accent, gold: t.gold, surface: t.surface })),
      cards: WEDDING_DESIGNS.map((d) => ({ id: d.id, name: d.name, sub: WEDDING_META[d.id]?.sub ?? d.blurb, ornament: WEDDING_META[d.id]?.ornament ?? '◆', preview: WEDDING_META[d.id]?.preview ?? { background: '#111914' } })),
    };
  }
  if (event === 'birthday') {
    return {
      label: 'Birthday', editorKind: 'birthday',
      swatches: BIRTHDAY_THEMES.map((t) => ({ accent: t.accent, gold: t.gold, surface: t.surface })),
      cards: BIRTHDAY_DESIGNS.map((d) => ({ id: d.id, name: d.name, sub: BIRTHDAY_META[d.id]?.sub ?? d.description, ornament: BIRTHDAY_META[d.id]?.ornament ?? '★', preview: BIRTHDAY_META[d.id]?.preview ?? { background: '#111914' } })),
    };
  }
  const def = EVENT_TEMPLATES[event];
  return {
    label: def.label, editorKind: 'event', eventKey: def.key,
    swatches: def.themes.map((t) => ({ accent: t.accent, gold: t.gold, surface: t.surface })),
    cards: def.designs.map((d) => ({ id: d.id, name: d.name, sub: d.blurb, ornament: d.ornament, preview: d.preview })),
  };
}

/* ── design card ─────────────────────────────────────────────────────────── */
function DesignCard({ card, accentColor, delay, onSelect, swatches }: {
  card: HubCard; accentColor: string; delay: number; onSelect: () => void;
  swatches: { accent: string; gold: string; surface: string }[];
}) {
  const cardRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, { opacity: 0, y: 18, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.38, delay: delay / 1000, ease: 'power3.out', clearProps: 'transform' });
    }
  }, [delay]);
  return (
    <button ref={cardRef} onClick={onSelect}
      className="group text-left flex flex-col overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04]"
      style={{ opacity: 0 }}>
      <div className="relative aspect-[9/16] overflow-hidden flex flex-col items-center justify-center text-center px-4 gap-3" style={card.preview}>
        <span className="text-3xl leading-none" style={{ animation: 'ev-none' }}>{card.ornament}</span>
        <p className="leading-tight px-2 group-hover:scale-105 transition-transform duration-500"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1rem, 4vw, 1.5rem)', color: '#ece5d8', fontWeight: 300 }}>
          {card.name}
        </p>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'rgba(13,21,18,0.72)', backdropFilter: 'blur(2px)' }}>
          <span className="flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-[0.3em]"
            style={{ border: `1px solid ${accentColor}`, color: accentColor, fontFamily: "'Marcellus', sans-serif" }}>
            <span className="material-icons text-sm">edit</span>Start Designing
          </span>
        </div>
      </div>
      <div className="px-3 py-3 space-y-2">
        <p className="text-[12px] leading-tight" style={{ color: '#e4eee1', fontFamily: "'Cormorant Garamond', serif" }}>{card.name}</p>
        <p className="text-[9px] uppercase tracking-[0.18em] leading-snug" style={{ color: '#b2c3b1', fontFamily: "'Marcellus', sans-serif" }}>{card.sub}</p>
        <div className="flex items-center gap-1 pt-0.5">
          {swatches.map((t, i) => (
            <span key={i} className="flex gap-0.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.accent }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.gold }} />
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

/* ── hub ─────────────────────────────────────────────────────────────────── */
export default function DevEviteHub() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const event: HubEvent = EVENT_ALIASES[(params.get('event') || 'marriage').toLowerCase()] ?? 'marriage';

  const [openDesignId, setOpenDesignId] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const view = useMemo(() => buildView(event), [event]);

  useEffect(() => {
    gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }, []);

  const closeEditor = () => setOpenDesignId(null);

  if (openDesignId) {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-[#0c1013]" />}>
        {view.editorKind === 'wedding' && <InviteEditor initialDesignId={openDesignId} onBack={closeEditor} />}
        {view.editorKind === 'birthday' && <BirthdayEditor initialDesignId={openDesignId} onBack={closeEditor} />}
        {view.editorKind === 'event' && view.eventKey && (
          <EventInviteEditor eventKey={view.eventKey} initialDesignId={openDesignId} onBack={closeEditor} />
        )}
      </Suspense>
    );
  }

  return (
    <div ref={pageRef} className="fixed inset-0 flex flex-col" style={{ background: '#111914' }}>
      <style>{`@keyframes ev-none{to{opacity:1}}`}</style>
      <div className="fixed inset-0 z-0 opacity-[0.07] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* top bar — no event filter, event is chosen upstream */}
      <div className="relative z-10 flex items-center gap-4 px-6 md:px-10 py-4 border-b border-white/[0.07] flex-shrink-0">
        <button onClick={() => {
            // When we came from the create flow's design-method screen, return
            // there instead of the event picker so the user keeps their place.
            if (params.get('return') === 'design') {
              navigate(`/create?stage=design&event=${params.get('event') ?? ''}`);
            } else {
              navigate('/create');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 border border-white/15 text-[#b2c3b1] hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all duration-200 text-[10px] uppercase tracking-[0.2em] flex-shrink-0"
          style={{ fontFamily: "'Marcellus', sans-serif" }}>
          <span className="material-icons text-sm">arrow_back</span>Back
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl text-[#e4eee1] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
            Choose your{' '}
            <span style={{ color: '#9cb092', fontStyle: 'italic', fontFamily: "'Great Vibes', cursive" }}>{view.label}</span>{' '}website
          </h1>
          <p className="text-[9px] uppercase tracking-[0.28em] mt-1" style={{ color: '#b2c3b1', fontFamily: "'Marcellus', sans-serif" }}>
            3 designs · 3 themes each · fully editable
          </p>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-10">
        <div className="pt-8 pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-5xl">
            {view.cards.map((card, i) => (
              <DesignCard key={card.id} card={card} swatches={view.swatches} accentColor="#9cb092" delay={i * 90} onSelect={() => setOpenDesignId(card.id)} />
            ))}
          </div>

          <div className="mt-10 max-w-lg">
            <p className="text-[9px] uppercase tracking-[0.3em] mb-3" style={{ color: '#b2c3b1', fontFamily: "'Marcellus', sans-serif" }}>Available colour themes</p>
            <div className="flex gap-3 flex-wrap">
              {view.swatches.map((t, i) => (
                <span key={i} className="flex gap-0.5">
                  <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: t.accent }} />
                  <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: t.gold }} />
                  <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: t.surface }} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
