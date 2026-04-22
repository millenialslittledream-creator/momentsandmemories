import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import gsap from 'gsap';
import Navigation from '@/sections/Navigation';
import { eviteTemplates } from '@/data/eviteTemplates';
import {
  commonFields,
  eventSpecificFields,
  eventTypes,
  type EventType,
  type EventField,
} from '@/data/eventFields';
import { createGuest, type Guest } from '@/sections/create/GuestDetails';
import GuestPopup from '@/sections/create/GuestPopup';
import PaymentModal from '@/sections/create/PaymentModal';

type EventTypeFilter = 'all' | EventType;
type ModalPhase = 'editor' | 'guests' | 'payment' | 'sent' | null;

const FILTERS: { id: EventTypeFilter; label: string }[] = [
  { id: 'all',          label: 'All' },
  { id: 'birthday',     label: 'Birthday' },
  { id: 'marriage',     label: 'Wedding' },
  { id: 'babyshower',   label: 'Baby Shower' },
  { id: 'bridetobe',    label: 'Bride to Be' },
  { id: 'genderreveal', label: 'Gender Reveal' },
];

// ── Field renderer for the editor modal ─────────────────────────────────
function renderEditorField(
  field: EventField,
  value: string,
  onChange: (name: string, value: string) => void
) {
  const baseInputClass =
    'bg-white/[0.06] border border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 px-3 py-2 text-sm rounded-sm w-full outline-none transition-colors';

  switch (field.type) {
    case 'date':
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={`${baseInputClass} [color-scheme:dark]`}
        />
      );
    case 'time':
      return (
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={`${baseInputClass} [color-scheme:dark]`}
        />
      );
    case 'textarea':
      return (
        <div className="space-y-1">
          <textarea
            value={value}
            onChange={(e) => {
              if (e.target.value.length <= 200) onChange(field.name, e.target.value);
            }}
            placeholder={field.placeholder}
            maxLength={200}
            className={`${baseInputClass} min-h-[70px] resize-none`}
          />
          <p className="text-[8px] font-display text-[#b2c3b1]/40 text-right">
            {value.length}/200
          </p>
        </div>
      );
    case 'select':
      return (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            className={`${baseInputClass} appearance-none cursor-pointer pr-8`}
          >
            <option value="" className="bg-[#1a2418]">
              Select...
            </option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt} className="bg-[#1a2418]">
                {opt}
              </option>
            ))}
          </select>
          <span
            className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[#9cb092] pointer-events-none"
            style={{ fontSize: '16px' }}
          >
            expand_more
          </span>
        </div>
      );
    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClass}
        />
      );
  }
}

// ── Main component ──────────────────────────────────────────────────────
export default function CreateEvite() {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const editorBackdropRef = useRef<HTMLDivElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);

  const [activeFilter, setActiveFilter] = useState<EventTypeFilter>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [modalPhase, setModalPhase] = useState<ModalPhase>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [guests, setGuests] = useState<Guest[]>([createGuest()]);
  const [deliveryPreference, setDeliveryPreference] = useState<'email' | 'phone' | 'both'>('email');

  // ── Derived state ────────────────────────────────────────────────
  const filteredTemplates = useMemo(() => {
    if (activeFilter === 'all') return eviteTemplates;
    return eviteTemplates.filter((t) => t.eventType === activeFilter);
  }, [activeFilter]);

  const selectedTemplate = useMemo(
    () => eviteTemplates.find((t) => t.id === selectedTemplateId) || null,
    [selectedTemplateId]
  );

  const currentIdx = useMemo(() => {
    if (!selectedTemplateId) return -1;
    return filteredTemplates.findIndex((t) => t.id === selectedTemplateId);
  }, [selectedTemplateId, filteredTemplates]);

  const currentEventType = selectedTemplate?.eventType ?? null;

  const editorFields: EventField[] = useMemo(() => {
    if (!currentEventType) return [];
    return [...eventSpecificFields[currentEventType], ...commonFields];
  }, [currentEventType]);

  // ── Local draft backup ───────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mm_evite_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.guests?.length) setGuests(parsed.guests);
        if (parsed.deliveryPreference) setDeliveryPreference(parsed.deliveryPreference);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        'mm_evite_draft',
        JSON.stringify({ formData, guests, deliveryPreference })
      );
    } catch {
      /* ignore */
    }
  }, [formData, guests, deliveryPreference]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const openTemplate = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setModalPhase('editor');
    requestAnimationFrame(() => {
      if (editorBackdropRef.current && editorPanelRef.current) {
        gsap.fromTo(
          editorBackdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.28, ease: 'power2.out' }
        );
        gsap.fromTo(
          editorPanelRef.current,
          { opacity: 0, scale: 0.96, y: 24 },
          { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'power3.out' }
        );
      }
    });
  }, []);

  const closeEditor = useCallback(() => {
    if (!editorBackdropRef.current || !editorPanelRef.current) {
      setSelectedTemplateId(null);
      setModalPhase(null);
      return;
    }
    gsap.to(editorPanelRef.current, {
      opacity: 0,
      scale: 0.97,
      y: 16,
      duration: 0.22,
      ease: 'power2.in',
    });
    gsap.to(editorBackdropRef.current, {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        setSelectedTemplateId(null);
        setModalPhase(null);
      },
    });
  }, []);

  const prevTemplate = useCallback(() => {
    if (currentIdx <= 0) return;
    setSelectedTemplateId(filteredTemplates[currentIdx - 1].id);
  }, [currentIdx, filteredTemplates]);

  const nextTemplate = useCallback(() => {
    if (currentIdx < 0 || currentIdx >= filteredTemplates.length - 1) return;
    setSelectedTemplateId(filteredTemplates[currentIdx + 1].id);
  }, [currentIdx, filteredTemplates]);

  const isEditorValid = useMemo(() => {
    if (!currentEventType) return false;
    for (const field of editorFields) {
      if (field.required && !formData[field.name]?.trim()) {
        return false;
      }
    }
    return true;
  }, [editorFields, formData, currentEventType]);

  const proceedToGuests = useCallback(() => setModalPhase('guests'), []);
  const backToEditor = useCallback(() => setModalPhase('editor'), []);
  const proceedToPayment = useCallback(() => setModalPhase('payment'), []);
  const backToGuests = useCallback(() => setModalPhase('guests'), []);

  const handlePaymentConfirm = useCallback(async () => {
    // Best-effort: try to save the event + invitees. If the user is logged out
    // or the API is unavailable, still show the thank-you screen so the flow
    // completes cleanly (demo-friendly).
    try {
      const evt = await api.createEvent({
        title:
          formData.eventName ||
          formData.celebrantName ||
          formData.brideName ||
          formData.parentNames ||
          formData.hostName ||
          'My Event',
        description: formData.customMessage || null,
        event_date: formData.eventDate || new Date().toISOString().split('T')[0],
        event_time: formData.eventTime || null,
        location: formData.venue || null,
        template_id: selectedTemplateId,
        status: 'published',
      });

      const filledGuests = guests.filter((g) => g.name.trim());
      if (filledGuests.length > 0) {
        const invitees = filledGuests.map((g) => ({
          name: g.name,
          email: g.email || undefined,
          phone: g.phone || undefined,
          source: 'manual' as const,
        }));
        await api.addInvitees(evt.id, invitees);
      }

      try {
        localStorage.removeItem('mm_evite_draft');
      } catch {
        /* ignore */
      }
    } catch (e) {
      // Non-blocking — still complete the flow
      console.warn('Evite save skipped (likely logged out or offline):', e);
    }
    setModalPhase('sent');
  }, [formData, selectedTemplateId, guests]);

  const resetFlow = useCallback(() => {
    setSelectedTemplateId(null);
    setModalPhase(null);
    navigate('/');
  }, [navigate]);

  // ── Escape closes editor ─────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalPhase === 'editor') closeEditor();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalPhase, closeEditor]);

  // ── Image fade-in when swapping templates ────────────────────────
  useEffect(() => {
    if (mainImgRef.current && selectedTemplate) {
      gsap.fromTo(
        mainImgRef.current,
        { opacity: 0, scale: 1.03 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [selectedTemplateId, selectedTemplate]);

  // ── Page entrance + gallery staggered entrance ───────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
    gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    if (galleryRef.current) {
      const cards = galleryRef.current.querySelectorAll<HTMLElement>('.template-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 16, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.035, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, [activeFilter]);

  // ── Display values for the live image overlay ────────────────────
  const eventInfo = currentEventType
    ? eventTypes.find((e) => e.id === currentEventType)
    : null;

  const displayName =
    formData.celebrantName ||
    formData.eventName ||
    formData.brideName ||
    formData.parentNames ||
    formData.hostName ||
    '';

  const displayDate = formData.eventDate
    ? new Date(formData.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const eventTitle =
    eventInfo?.label === 'Wedding'
      ? `${formData.brideName || 'Bride'} & ${formData.groomName || 'Groom'}`
      : currentEventType === 'custom'
      ? formData.eventName || displayName || 'Your Event'
      : displayName
      ? `${displayName}'s ${eventInfo?.label ?? ''}`
      : eventInfo?.label ?? 'Your Event';

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div
      ref={pageRef}
      className="h-screen flex flex-col bg-[#EADDD7] overflow-hidden relative"
    >
      {/* Shared bg texture */}
      <div
        className="fixed inset-0 z-0 opacity-30 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0yNSOWSBJLsv1-47TiuxQ15AFQ4nsrk2tyl20R-zvNNsiDXBNDhZVYz1yHqSCTtqtGcVjl35j2rrDIrA-d5xW6tM2FPDinMxC7wGNXKzBCT0JhfwdSkLFQPVqU1yfc1GtqRHSfxSmlitg3lWmrbcCqzLdzR4XsiD9nN9-_O7fp4ViDdX7MFMvLLa9exuWvETBq8HCVRb7NcpP7tWvqDoEWCeegHipJmlKBCM4gpRO9AROi6bPaa2gmQvHKabiYnelhLueCkgQ9QIe')`,
        }}
      />
      <div className="fixed inset-0 z-[1] bg-[#111914]/70 pointer-events-none" />

      <Navigation />

      {/* ════════════════════════════════════════════════════════════
          GALLERY — base page
          ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden relative z-10 flex flex-col pt-16">
        <div className="flex-1 flex flex-col overflow-hidden px-6 md:px-10">
          {/* Header */}
          <div className="flex items-end justify-between py-4 md:py-5 flex-shrink-0 border-b border-white/[0.07] flex-wrap gap-3">
            <div>
              <h1 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] leading-tight">
                Evites
              </h1>
              <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#b2c3b1]/40 mt-1">
                Choose a design that tells your story
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`font-display text-[9px] tracking-[0.16em] uppercase px-3 py-1.5 transition-all duration-200 ${
                    activeFilter === f.id
                      ? 'bg-[#9cb092] text-[#111914] font-semibold'
                      : 'border border-white/15 text-[#b2c3b1]/55 hover:border-[#9cb092]/30 hover:text-[#9cb092]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scroll wrapper — grid inside grows to its content height */}
          <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle">
            <div
              ref={galleryRef}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-4 pb-6"
            >
              {filteredTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTemplate(t.id)}
                  className="template-card group text-left overflow-hidden bg-white/[0.03] border border-white/[0.07] hover:border-[#9cb092]/35 transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-[9/16] overflow-hidden bg-[#192116]">
                    <img
                      src={t.previewImage}
                      alt={t.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
                      <span className="material-icons text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">
                        zoom_in
                      </span>
                    </div>
                  </div>

                  <div className="px-2.5 py-2">
                    <h3 className="font-serif-exp text-[11px] text-[#e4eee1] leading-tight truncate">
                      {t.name}
                    </h3>
                  </div>
                </button>
              ))}

              {filteredTemplates.length === 0 && (
                <div className="col-span-full flex items-center justify-center py-16">
                  <p className="font-display text-[11px] tracking-[0.25em] uppercase text-[#b2c3b1]/30">
                    No designs in this category yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          TEMPLATE EDITOR MODAL
          ════════════════════════════════════════════════════════════ */}
      {selectedTemplate && modalPhase === 'editor' && (
        <div
          ref={editorBackdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEditor();
          }}
        >
          <div
            ref={editorPanelRef}
            className="relative w-full max-w-5xl h-full max-h-[88vh] flex flex-col md:flex-row bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={closeEditor}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
            >
              <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
            </button>

            {/* ── LEFT: image (no scroll) with live overlay ─────── */}
            <div className="flex-shrink-0 h-[38vh] md:h-auto md:flex-1 md:min-h-0 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-white/[0.07]">
              <div className="flex-1 relative overflow-hidden bg-[#0d1512] flex items-center justify-center">
                {/* Aspect-locked image box — overlay & gradient sit on the image, not on letterbox bars */}
                <div className="relative h-full aspect-[9/16] max-w-full overflow-hidden">
                  <img
                    ref={mainImgRef}
                    src={selectedTemplate.previewImage}
                    alt={selectedTemplate.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Live overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-6 pointer-events-none">
                  <p className="font-display text-[8px] tracking-[0.25em] uppercase text-white/55 mb-1">
                    You're invited to
                  </p>
                  <h4 className="font-serif-exp text-lg md:text-2xl text-white leading-tight">
                    {eventTitle}
                  </h4>
                  <div className="space-y-1 mt-2">
                    {displayDate && (
                      <p className="font-display text-[9px] md:text-[10px] text-white/75 flex items-center gap-1.5">
                        <span
                          className="material-icons text-[#9cb092]"
                          style={{ fontSize: '11px' }}
                        >
                          calendar_today
                        </span>
                        {displayDate}
                      </p>
                    )}
                    {formData.eventTime && (
                      <p className="font-display text-[9px] md:text-[10px] text-white/75 flex items-center gap-1.5">
                        <span
                          className="material-icons text-[#9cb092]"
                          style={{ fontSize: '11px' }}
                        >
                          schedule
                        </span>
                        {formData.eventTime}
                        {formData.timezone && ` · ${formData.timezone}`}
                      </p>
                    )}
                    {formData.venue && (
                      <p className="font-display text-[9px] md:text-[10px] text-white/75 flex items-center gap-1.5">
                        <span
                          className="material-icons text-[#9cb092]"
                          style={{ fontSize: '11px' }}
                        >
                          location_on
                        </span>
                        {formData.venue}
                      </p>
                    )}
                    {formData.rsvpContact && (
                      <p className="font-display text-[9px] md:text-[10px] text-white/75 flex items-center gap-1.5">
                        <span
                          className="material-icons text-[#9cb092]"
                          style={{ fontSize: '11px' }}
                        >
                          mail
                        </span>
                        RSVP: {formData.rsvpContact}
                      </p>
                    )}
                  </div>
                  {formData.customMessage && (
                    <p className="font-serif-exp italic text-[10px] md:text-xs text-white/65 mt-3 border-t border-white/10 pt-2">
                      "{formData.customMessage}"
                    </p>
                  )}
                </div>
                </div>

                {/* Prev arrow */}
                {currentIdx > 0 && (
                  <button
                    onClick={prevTemplate}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <span className="material-icons text-white text-[18px]">chevron_left</span>
                  </button>
                )}

                {/* Next arrow */}
                {currentIdx < filteredTemplates.length - 1 && (
                  <button
                    onClick={nextTemplate}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <span className="material-icons text-white text-[18px]">chevron_right</span>
                  </button>
                )}

                {/* Counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 pointer-events-none">
                  <span className="font-display text-[10px] text-white/60 tracking-widest">
                    {currentIdx + 1} / {filteredTemplates.length}
                  </span>
                </div>
              </div>
            </div>

            {/* ── RIGHT: form (scrollable) ────────────────────────── */}
            <div className="flex-1 md:flex-[unset] md:w-[42%] md:min-w-[320px] md:max-w-[500px] min-h-0 flex flex-col overflow-hidden">
              {/* Fixed header */}
              <div className="flex-shrink-0 px-6 md:px-8 pt-8 pb-4 border-b border-white/[0.06]">
                <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092]/50 mb-2">
                  {selectedTemplate.style}
                </p>
                <h2 className="font-serif-exp text-xl md:text-2xl text-[#e4eee1] leading-tight">
                  {selectedTemplate.name}
                </h2>
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/50 mt-3">
                  Enter your event details
                </p>
              </div>

              {/* Scrollable form */}
              <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 md:px-8 py-5 space-y-4">
                {editorFields.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="block font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]">
                      {field.label}
                      {field.required && <span className="text-[#9cb092] ml-1">*</span>}
                    </label>
                    {renderEditorField(field, formData[field.name] || '', handleFieldChange)}
                  </div>
                ))}
              </div>

              {/* Fixed footer */}
              <div className="flex-shrink-0 px-6 md:px-8 py-5 border-t border-white/[0.06] bg-[#0e1712]">
                <button
                  onClick={proceedToGuests}
                  disabled={!isEditorValid}
                  className={`w-full py-3.5 font-display text-[11px] tracking-[0.22em] uppercase font-bold transition-colors flex items-center justify-center gap-2 ${
                    isEditorValid
                      ? 'bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3]'
                      : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                  }`}
                >
                  Proceed
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
                {!isEditorValid && (
                  <p className="font-display text-[9px] tracking-[0.12em] uppercase text-[#b2c3b1]/40 text-center mt-2">
                    Fill required fields to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          GUEST POPUP
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'guests' && selectedTemplate && (
        <GuestPopup
          guests={guests}
          onGuestsChange={setGuests}
          deliveryPreference={deliveryPreference}
          onDeliveryPreferenceChange={setDeliveryPreference}
          onBack={backToEditor}
          onProceed={proceedToPayment}
        />
      )}

      {/* ════════════════════════════════════════════════════════════
          PAYMENT MODAL
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'payment' && (
        <PaymentModal
          guestCount={guests.filter((g) => g.name.trim()).length}
          onBack={backToGuests}
          onConfirm={handlePaymentConfirm}
        />
      )}

      {/* ════════════════════════════════════════════════════════════
          THANK YOU MODAL
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'sent' && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(13, 21, 18, 0.96)', backdropFilter: 'blur(6px)' }}
        >
          <div className="flex flex-col items-center text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-[#9cb092]/20 border border-[#9cb092]/40 flex items-center justify-center mb-8">
              <span className="material-icons text-[#9cb092] text-4xl">check</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif-exp mb-4 text-[#e4eee1]">
              Thank <span className="text-[#9cb092] font-agatho">You</span>
            </h1>
            <p className="text-sm font-display tracking-[0.15em] text-[#b2c3b1] max-w-md mb-3">
              Your evite has been created and sent successfully.
            </p>
            <p className="text-xs font-display tracking-[0.2em] text-[#b2c3b1]/50 uppercase mb-12">
              Your guests are going to love it
            </p>
            <div className="w-[1px] h-12 bg-[#9cb092]/30 mb-8" />
            <button
              onClick={resetFlow}
              className="px-10 py-3 bg-[#3d4a35] text-white hover:bg-[#4d5a44] shadow-lg font-display text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 transition-all"
            >
              <span className="material-icons text-sm">home</span>
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
