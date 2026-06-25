import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { DESIGNS as WEDDING_DESIGNS } from './WebsiteTemplates/designs';
import { WEDDING_THEMES } from './WebsiteTemplates/themes';
import { BIRTHDAY_DESIGNS } from './BirthdayTemplates/designs';
import { BIRTHDAY_THEMES } from './BirthdayTemplates/birthdayThemes';

const InviteEditor   = lazy(() => import('./WebsiteTemplates/InviteEditor'));
const BirthdayEditor = lazy(() => import('./BirthdayTemplates/BirthdayEditor'));

/* ── event type tabs ─────────────────────────────────────────────────── */
type EventTab = 'wedding' | 'birthday';

const EVENT_TABS: { id: EventTab; label: string; icon: string }[] = [
  { id: 'wedding',  label: 'Wedding',  icon: 'favorite' },
  { id: 'birthday', label: 'Birthday', icon: 'cake'     },
];

/* ── wedding design visual configs ──────────────────────────────────── */
const WEDDING_CARD_META: Record<string, {
  preview: React.CSSProperties;
  headline: string;
  sub: string;
  ornament: string;
}> = {
  timeless: {
    preview: { background: 'linear-gradient(180deg, #2c0a10 0%, #4a1220 55%, #fcf4e6 55%, #f5e6cf 100%)' },
    headline: 'Priya & Arjun',
    sub: 'Timeless · Classic framed envelope',
    ornament: '✦',
  },
  grand: {
    preview: {
      background: 'linear-gradient(180deg, #2c0a10 0%, transparent 35%, transparent 65%, #2c0a10 100%), linear-gradient(180deg, #7a1f2b44, #2c0a10)',
      backgroundColor: '#2c0a10',
    },
    headline: 'Grand Royal',
    sub: 'Cinematic full-bleed hero',
    ornament: '◈',
  },
  editorial: {
    preview: { background: 'linear-gradient(135deg, #1a0a0e 0%, #321b24 100%)' },
    headline: 'EDITORIAL',
    sub: 'Bold modern masthead',
    ornament: '—',
  },
};

/* ── birthday design visual configs ─────────────────────────────────── */
const BIRTHDAY_CARD_META: Record<string, {
  preview: React.CSSProperties;
  headline: string;
  sub: string;
  ornament: string;
}> = {
  bash: {
    preview: { background: 'linear-gradient(135deg, #1a0e00 0%, #5c2400 60%, #d4890f44 100%)' },
    headline: '30',
    sub: 'The Bash · High-energy party',
    ornament: '★',
  },
  soiree: {
    preview: { background: 'linear-gradient(180deg, #05080f 0%, #1a237e55 50%, #05080f 100%)' },
    headline: 'Soirée',
    sub: 'The Soirée · Elegant full-bleed',
    ornament: '◈',
  },
  milestone: {
    preview: { background: 'linear-gradient(135deg, #200015 0%, #5c0040 50%, #aa006022 100%)' },
    headline: '50',
    sub: 'The Milestone · Bold editorial',
    ornament: '◆',
  },
};

/* ── design card ─────────────────────────────────────────────────────── */
function DesignCard({
  name,
  meta,
  themes,
  accentColor,
  delay,
  onSelect,
}: {
  designId: string;
  name: string;
  meta: { preview: React.CSSProperties; headline: string; sub: string; ornament: string };
  themes: { accent: string; gold: string; surface: string }[];
  accentColor: string;
  delay: number;
  onSelect: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 18, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.38, delay: delay / 1000, ease: 'power3.out' },
      );
    }
  }, [delay]);

  return (
    <button
      ref={cardRef}
      onClick={onSelect}
      className="group text-left flex flex-col overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04]"
      style={{ opacity: 0 }}>

      {/* phone-shaped preview */}
      <div
        className="relative aspect-[9/16] overflow-hidden flex flex-col items-center justify-center text-center px-4 gap-3"
        style={meta.preview}>

        {/* subtle grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }}
        />

        {/* ornament */}
        <span
          className="text-xl leading-none"
          style={{ color: `${accentColor}cc`, transition: 'transform 0.4s ease' }}>
          {meta.ornament}
        </span>

        {/* headline */}
        <p
          className="leading-tight px-2 group-hover:scale-105 transition-transform duration-500"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(1.1rem, 4vw, 1.6rem)',
            color: '#ece5d8',
            fontWeight: 300,
            letterSpacing: '0.02em',
          }}>
          {meta.headline}
        </p>

        {/* hover CTA overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'rgba(13,21,18,0.72)', backdropFilter: 'blur(2px)' }}>
          <span
            className="flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-[0.3em]"
            style={{
              border: `1px solid ${accentColor}`,
              color: accentColor,
              fontFamily: "'Marcellus', sans-serif",
            }}>
            <span className="material-icons text-sm">edit</span>
            Start Designing
          </span>
        </div>
      </div>

      {/* card footer */}
      <div className="px-3 py-3 space-y-2">
        <p
          className="text-[12px] leading-tight"
          style={{ color: '#e4eee1', fontFamily: "'Cormorant Garamond', serif" }}>
          {name}
        </p>
        <p
          className="text-[9px] uppercase tracking-[0.18em] leading-snug"
          style={{ color: '#b2c3b1', fontFamily: "'Marcellus', sans-serif" }}>
          {meta.sub.split('·')[1]?.trim() ?? meta.sub}
        </p>

        {/* theme color swatches */}
        <div className="flex items-center gap-1 pt-0.5">
          {themes.map((t, i) => (
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

/* ── hub ─────────────────────────────────────────────────────────────── */
export default function DevEviteHub() {
  const navigate = useNavigate();
  const [activeTab,     setActiveTab]     = useState<EventTab>('wedding');
  const [openEvent,     setOpenEvent]     = useState<EventTab | null>(null);
  const [openDesignId,  setOpenDesignId]  = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
  }, []);

  /* ── open editor ── */
  const openEditor = (event: EventTab, designId: string) => {
    setOpenDesignId(designId);
    setOpenEvent(event);
  };

  const closeEditor = () => {
    setOpenDesignId(null);
    setOpenEvent(null);
  };

  /* ── active editor overlay ── */
  if (openEvent && openDesignId) {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-[#0c1013]" />}>
        {openEvent === 'wedding' ? (
          <InviteEditor initialDesignId={openDesignId} onBack={closeEditor} />
        ) : (
          <BirthdayEditor initialDesignId={openDesignId} onBack={closeEditor} />
        )}
      </Suspense>
    );
  }

  /* ── hub UI ── */
  return (
    <div
      ref={pageRef}
      className="fixed inset-0 flex flex-col"
      style={{ background: '#111914' }}>

      {/* ── texture ── */}
      <div
        className="fixed inset-0 z-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/[0.07] flex-shrink-0 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-1.5 px-3 py-2 border border-white/15 text-[#b2c3b1] hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all duration-200 text-[10px] uppercase tracking-[0.2em] flex-shrink-0"
            style={{ fontFamily: "'Marcellus', sans-serif" }}>
            <span className="material-icons text-sm">arrow_back</span>
            Back
          </button>
          <div>
            <h1
              className="text-2xl md:text-3xl text-[#e4eee1] leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
              What kind of{' '}
              <span style={{ color: '#9cb092', fontStyle: 'italic', fontFamily: "'Great Vibes', cursive" }}>
                celebration?
              </span>
            </h1>
            <p
              className="text-[9px] uppercase tracking-[0.28em] mt-1"
              style={{ color: '#b2c3b1', fontFamily: "'Marcellus', sans-serif" }}>
              Pick an event type · choose a design · start creating
            </p>
          </div>
        </div>

        {/* event type filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {EVENT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#9cb092] text-[#111914] font-semibold'
                  : 'border border-white/15 text-[#b2c3b1] hover:border-[#9cb092]/40 hover:text-[#9cb092]'
              }`}
              style={{ fontFamily: "'Marcellus', sans-serif" }}>
              <span className="material-icons text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── content ── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-10">

        {/* Wedding designs */}
        {activeTab === 'wedding' && (
          <div className="pt-8 pb-10">
            <p
              className="text-[9px] uppercase tracking-[0.3em] mb-5"
              style={{ color: '#9cb092', fontFamily: "'Marcellus', sans-serif" }}>
              3 wedding invitation designs · 3 themes each
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-5xl">
              {WEDDING_DESIGNS.map((d, i) => {
                const meta = WEDDING_CARD_META[d.id] ?? {
                  preview: { background: '#111914' },
                  headline: d.name,
                  sub: d.blurb,
                  ornament: '◆',
                };
                return (
                  <DesignCard
                    key={d.id}
                    designId={d.id}
                    name={d.name}
                    meta={meta}
                    themes={WEDDING_THEMES.map((t) => ({ accent: t.accent, gold: t.gold, surface: t.surface }))}
                    accentColor="#c19a4b"
                    delay={i * 90}
                    onSelect={() => openEditor('wedding', d.id)}
                  />
                );
              })}
            </div>

            {/* wedding theme preview strip */}
            <div className="mt-10 max-w-lg">
              <p
                className="text-[9px] uppercase tracking-[0.3em] mb-3"
                style={{ color: '#b2c3b1', fontFamily: "'Marcellus', sans-serif" }}>
                Available colour themes
              </p>
              <div className="flex gap-3 flex-wrap">
                {WEDDING_THEMES.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className="flex gap-0.5">
                      <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: t.accent }} />
                      <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: t.gold }} />
                      <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: t.surface }} />
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: '#b2c3b1', fontFamily: "'Marcellus', sans-serif" }}>
                      {t.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Birthday designs */}
        {activeTab === 'birthday' && (
          <div className="pt-8 pb-10">
            <p
              className="text-[9px] uppercase tracking-[0.3em] mb-5"
              style={{ color: '#9cb092', fontFamily: "'Marcellus', sans-serif" }}>
              3 birthday invitation designs · 3 themes each
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-5xl">
              {BIRTHDAY_DESIGNS.map((d, i) => {
                const meta = BIRTHDAY_CARD_META[d.id] ?? {
                  preview: { background: '#111914' },
                  headline: d.name,
                  sub: d.description,
                  ornament: '★',
                };
                return (
                  <DesignCard
                    key={d.id}
                    designId={d.id}
                    name={d.name}
                    meta={meta}
                    themes={BIRTHDAY_THEMES.map((t) => ({ accent: t.accent, gold: t.gold, surface: t.surface }))}
                    accentColor="#d4890f"
                    delay={i * 90}
                    onSelect={() => openEditor('birthday', d.id)}
                  />
                );
              })}
            </div>

            {/* birthday theme preview strip */}
            <div className="mt-10 max-w-lg">
              <p
                className="text-[9px] uppercase tracking-[0.3em] mb-3"
                style={{ color: '#b2c3b1', fontFamily: "'Marcellus', sans-serif" }}>
                Available colour themes
              </p>
              <div className="flex gap-3 flex-wrap">
                {BIRTHDAY_THEMES.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className="flex gap-0.5">
                      <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: t.accent }} />
                      <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: t.gold }} />
                      <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: t.surface }} />
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: '#b2c3b1', fontFamily: "'Marcellus', sans-serif" }}>
                      {t.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
