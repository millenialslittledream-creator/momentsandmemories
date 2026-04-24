import { useState, useCallback, useEffect, useRef, useMemo, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import gsap from 'gsap';
import Navigation from '@/sections/Navigation';
import { useAuth } from '@/context/AuthContext';
import { eviteTemplates } from '@/data/eviteTemplates';
import {
  eventTypes,
  getEditorFields,
  type EventType,
  type EventField,
} from '@/data/eventFields';
import { createGuest, type Guest } from '@/sections/create/GuestDetails';
import GuestPopup from '@/sections/create/GuestPopup';
import PaymentModal from '@/sections/create/PaymentModal';
import DateTimePicker from '@/sections/create/DateTimePicker';

type EventTypeFilter = 'all' | EventType;
type ModalPhase = 'upload' | 'editor' | 'signin' | 'guests' | 'payment' | 'sent' | null;

interface UploadedTemplate {
  url: string;
  type: 'image' | 'video';
  audioUrl?: string;
  audioName?: string;
  fileName?: string;
}

const FILTERS: { id: EventTypeFilter; label: string }[] = [
  { id: 'all',          label: 'All' },
  { id: 'birthday',     label: 'Birthday' },
  { id: 'marriage',     label: 'Wedding' },
  { id: 'babyshower',   label: 'Baby Shower' },
  { id: 'bridetobe',    label: 'Pre-Wedding Party' },
  { id: 'genderreveal', label: 'Gender Reveal' },
  { id: 'custom',       label: 'Custom' },
];

const SUPPORTS_MULTI_EVENTS: EventType[] = ['marriage', 'custom'];

// ── Single field renderer (used for everything except the grouped date/time/tz block) ──
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
    case 'number':
      return (
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClass}
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

// Sentinel for the upload-your-own tile.
const UPLOAD_TILE_ID = '__upload_your_own__';

// ── Main component ──────────────────────────────────────────────────────
export default function CreateEvite() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const editorBackdropRef = useRef<HTMLDivElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);

  const [activeFilter, setActiveFilter] = useState<EventTypeFilter>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [uploadedTemplate, setUploadedTemplate] = useState<UploadedTemplate | null>(null);
  const [modalPhase, setModalPhase] = useState<ModalPhase>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [guests, setGuests] = useState<Guest[]>([createGuest()]);
  const [deliveryPreference, setDeliveryPreference] = useState<'email' | 'phone' | 'both'>('email');
  const [hasSubEvents, setHasSubEvents] = useState(false);

  // ── Derived state ────────────────────────────────────────────────
  const selectedTemplate = useMemo(
    () => eviteTemplates.find((t) => t.id === selectedTemplateId) || null,
    [selectedTemplateId]
  );

  // Templates filtered by chip. Upload tile is injected as the first item.
  // 'custom' is special: there are no inherently-custom designs, so we show
  // every template (any of them can be repurposed for a custom event).
  const visibleTemplates = useMemo(() => {
    if (activeFilter === 'all' || activeFilter === 'custom') return eviteTemplates;
    return eviteTemplates.filter((t) => t.eventType === activeFilter);
  }, [activeFilter]);

  // For the editor modal's prev/next navigation we use only real templates
  // (uploaded design has no neighbours in the gallery).
  const currentIdx = useMemo(() => {
    if (!selectedTemplateId) return -1;
    return visibleTemplates.findIndex((t) => t.id === selectedTemplateId);
  }, [selectedTemplateId, visibleTemplates]);

  // When working with an uploaded template we treat it as a custom event.
  const currentEventType: EventType | null = uploadedTemplate
    ? 'custom'
    : selectedTemplate?.eventType ?? null;

  const editorFields: EventField[] = useMemo(() => {
    if (!currentEventType) return [];
    return getEditorFields(currentEventType);
  }, [currentEventType]);

  const supportsMultipleEvents = !!currentEventType && SUPPORTS_MULTI_EVENTS.includes(currentEventType);

  // Sub-events count is mirrored into formData so downstream components
  // (GuestPopup multi-event checkboxes) can read it.
  const subEventCount = parseInt(formData['sub_events_count'] || '0', 10) || 0;

  // ── Local draft backup ───────────────────────────────────────────
  // Resumes the flow after a sign-in redirect: restores form state and
  // re-opens the modal at the saved phase if the user is now signed in.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mm_evite_draft');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.formData) setFormData(parsed.formData);
      if (parsed.guests?.length) setGuests(parsed.guests);
      if (parsed.deliveryPreference) setDeliveryPreference(parsed.deliveryPreference);
      if (parsed.selectedTemplateId) setSelectedTemplateId(parsed.selectedTemplateId);
      if (parsed.uploadedTemplate) setUploadedTemplate(parsed.uploadedTemplate);
      if (parsed.hasSubEvents) setHasSubEvents(!!parsed.hasSubEvents);
      if (parsed.pendingPhase && user) {
        setModalPhase(parsed.pendingPhase);
        localStorage.setItem(
          'mm_evite_draft',
          JSON.stringify({ ...parsed, pendingPhase: null })
        );
      }
    } catch {
      /* ignore */
    }
  }, [user]);

  // Don't overwrite a saved draft with our untouched initial state — only
  // persist after the user starts interacting (formData has any keys,
  // a template is selected, or guests beyond the empty seed exist).
  useEffect(() => {
    const hasUserContent =
      Object.keys(formData).length > 0 ||
      !!selectedTemplateId ||
      !!uploadedTemplate ||
      hasSubEvents ||
      guests.some((g) => g.name.trim() || g.email.trim() || g.phone.trim());
    if (!hasUserContent) return;
    try {
      const existing = localStorage.getItem('mm_evite_draft');
      const parsed = existing ? JSON.parse(existing) : {};
      const safeUploaded =
        uploadedTemplate && !uploadedTemplate.url.startsWith('blob:')
          ? uploadedTemplate
          : null;
      localStorage.setItem(
        'mm_evite_draft',
        JSON.stringify({
          ...parsed,
          formData,
          guests,
          deliveryPreference,
          selectedTemplateId,
          uploadedTemplate: safeUploaded,
          hasSubEvents,
        })
      );
    } catch {
      /* ignore */
    }
  }, [formData, guests, deliveryPreference, selectedTemplateId, uploadedTemplate, hasSubEvents]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const animateModalIn = useCallback(() => {
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

  const openTemplate = useCallback(
    (templateId: string) => {
      setUploadedTemplate(null);
      setSelectedTemplateId(templateId);
      setModalPhase('editor');
      animateModalIn();
    },
    [animateModalIn]
  );

  const openUploadFlow = useCallback(() => {
    setSelectedTemplateId(null);
    setUploadedTemplate(null);
    setModalPhase('upload');
    animateModalIn();
  }, [animateModalIn]);

  const closeAnyModal = useCallback(() => {
    if (!editorBackdropRef.current || !editorPanelRef.current) {
      setSelectedTemplateId(null);
      setUploadedTemplate(null);
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
        setUploadedTemplate(null);
        setModalPhase(null);
      },
    });
  }, []);

  const prevTemplate = useCallback(() => {
    if (uploadedTemplate || currentIdx <= 0) return;
    setSelectedTemplateId(visibleTemplates[currentIdx - 1].id);
  }, [currentIdx, visibleTemplates, uploadedTemplate]);

  const nextTemplate = useCallback(() => {
    if (uploadedTemplate || currentIdx < 0 || currentIdx >= visibleTemplates.length - 1) return;
    setSelectedTemplateId(visibleTemplates[currentIdx + 1].id);
  }, [currentIdx, visibleTemplates, uploadedTemplate]);

  const isEditorValid = useMemo(() => {
    if (!currentEventType) return false;
    for (const field of editorFields) {
      if (field.required && !formData[field.name]?.trim()) return false;
    }
    if (hasSubEvents && supportsMultipleEvents) {
      if (subEventCount < 1) return false;
      for (let i = 0; i < subEventCount; i++) {
        if (!formData[`sub_${i}_name`]?.trim()) return false;
      }
    }
    return true;
  }, [editorFields, formData, currentEventType, hasSubEvents, supportsMultipleEvents, subEventCount]);

  // After event details are captured we ask the user to sign in (so we can save
  // their design + guest list). Already-signed-in users skip straight to guests.
  const proceedFromEditor = useCallback(() => {
    if (user) {
      setModalPhase('guests');
    } else {
      try {
        const existing = localStorage.getItem('mm_evite_draft');
        const parsed = existing ? JSON.parse(existing) : {};
        localStorage.setItem(
          'mm_evite_draft',
          JSON.stringify({ ...parsed, pendingPhase: 'guests' })
        );
      } catch {
        /* ignore */
      }
      setModalPhase('signin');
    }
  }, [user]);

  const backToEditor = useCallback(() => setModalPhase('editor'), []);
  const proceedToPayment = useCallback(() => setModalPhase('payment'), []);
  const backToGuests = useCallback(() => setModalPhase('guests'), []);

  const handlePaymentConfirm = useCallback(async () => {
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
      console.warn('Evite save skipped (likely logged out or offline):', e);
    }
    setModalPhase('sent');
  }, [formData, selectedTemplateId, guests]);

  const resetFlow = useCallback(() => {
    setSelectedTemplateId(null);
    setUploadedTemplate(null);
    setModalPhase(null);
    navigate('/');
  }, [navigate]);

  // Sign-in modal action — store pending phase + redirect.
  const goToSignIn = useCallback(() => {
    try {
      const existing = localStorage.getItem('mm_evite_draft');
      const parsed = existing ? JSON.parse(existing) : {};
      localStorage.setItem(
        'mm_evite_draft',
        JSON.stringify({ ...parsed, pendingPhase: 'guests' })
      );
    } catch {
      /* ignore */
    }
    navigate(`/sign-in?redirect=${encodeURIComponent('/create')}`);
  }, [navigate]);

  // ── Sub-event helpers ────────────────────────────────────────────
  const addSubEvent = () => {
    const next = subEventCount + 1;
    handleFieldChange('sub_events_count', String(next));
  };

  const removeSubEvent = (index: number) => {
    setFormData((prev) => {
      const next = { ...prev };
      const count = parseInt(next['sub_events_count'] || '0', 10) || 0;
      const fields = ['name', 'date', 'time', 'timezone', 'venue', 'guestCount'];
      for (let i = index; i < count - 1; i++) {
        for (const f of fields) {
          next[`sub_${i}_${f}`] = next[`sub_${i + 1}_${f}`] || '';
        }
      }
      for (const f of fields) {
        delete next[`sub_${count - 1}_${f}`];
      }
      next['sub_events_count'] = String(Math.max(0, count - 1));
      return next;
    });
  };

  const toggleHasSubEvents = () => {
    const next = !hasSubEvents;
    setHasSubEvents(next);
    if (!next) {
      setFormData((prev) => {
        const out = { ...prev };
        const count = parseInt(out['sub_events_count'] || '0', 10) || 0;
        const fields = ['name', 'date', 'time', 'timezone', 'venue', 'guestCount'];
        for (let i = 0; i < count; i++) {
          for (const f of fields) delete out[`sub_${i}_${f}`];
        }
        out['sub_events_count'] = '';
        return out;
      });
    } else if (subEventCount === 0) {
      handleFieldChange('sub_events_count', '1');
    }
  };

  // ── Upload handler ───────────────────────────────────────────────
  const handleFilePicked = useCallback(
    (file: File, kind: 'image' | 'video') => {
      const url = URL.createObjectURL(file);
      setUploadedTemplate({ url, type: kind, fileName: file.name });
    },
    []
  );

  const handleAudioPicked = useCallback((file: File) => {
    setUploadedTemplate((prev) =>
      prev
        ? { ...prev, audioUrl: URL.createObjectURL(file), audioName: file.name }
        : prev
    );
  }, []);

  const proceedFromUpload = useCallback(() => {
    if (!uploadedTemplate) return;
    setModalPhase('editor');
  }, [uploadedTemplate]);

  // ── Escape closes modal ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (modalPhase === 'editor' || modalPhase === 'upload' || modalPhase === 'signin'))
        closeAnyModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalPhase, closeAnyModal]);

  // ── Image fade-in when swapping templates ────────────────────────
  useEffect(() => {
    if (mainImgRef.current && (selectedTemplate || uploadedTemplate)) {
      gsap.fromTo(
        mainImgRef.current,
        { opacity: 0, scale: 1.03 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [selectedTemplateId, selectedTemplate, uploadedTemplate]);

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
                What are we bringing to <span className="text-[#9cb092] font-agatho italic">life today?</span>
              </h1>
              <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#b2c3b1]/40 mt-1">
                Choose a design — or upload your own
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
              {/* Upload-your-own tile — always first, regardless of filter */}
              <button
                key={UPLOAD_TILE_ID}
                onClick={openUploadFlow}
                className="template-card group text-left overflow-hidden bg-[#9cb092]/[0.06] border border-dashed border-[#9cb092]/40 hover:border-[#9cb092] hover:bg-[#9cb092]/[0.12] transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[9/16] overflow-hidden bg-[#192116] flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-[#9cb092]/15 border border-[#9cb092]/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="material-icons text-[#9cb092] text-2xl">add</span>
                  </div>
                  <p className="font-serif-exp text-sm text-[#e4eee1] leading-snug mb-1">
                    Upload Your Own Design
                  </p>
                  <p className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 leading-relaxed">
                    Image · Video · Image + Music
                  </p>
                </div>
                <div className="px-2.5 py-2">
                  <h3 className="font-serif-exp text-[11px] text-[#9cb092] leading-tight truncate">
                    Custom upload
                  </h3>
                </div>
              </button>

              {visibleTemplates.map((t) => (
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

              {visibleTemplates.length === 0 && (
                <div className="col-span-full flex items-center justify-center py-10">
                  <p className="font-display text-[11px] tracking-[0.25em] uppercase text-[#b2c3b1]/30">
                    No designs in this category yet — try uploading your own
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          UPLOAD MODAL
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'upload' && (
        <div
          ref={editorBackdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAnyModal();
          }}
        >
          <div
            ref={editorPanelRef}
            className="relative w-full max-w-2xl bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeAnyModal}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
            >
              <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
            </button>

            <div className="px-6 md:px-10 pt-8 pb-4 border-b border-white/[0.06]">
              <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092]/50 mb-2">
                Custom Upload
              </p>
              <h2 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] leading-tight">
                Upload Your Own <span className="text-[#9cb092] font-agatho italic">Design</span>
              </h2>
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/50 mt-3">
                Image, video, or an image with background music
              </p>
            </div>

            <div data-lenis-prevent className="px-6 md:px-10 py-6 space-y-5 max-h-[60vh] overflow-y-auto scrollbar-subtle">
              {/* Asset preview / chooser */}
              {!uploadedTemplate ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-2 p-6 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/70 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all">
                    <span className="material-icons text-[#9cb092] text-3xl">image</span>
                    <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]">
                      Upload Image
                    </span>
                    <span className="font-display text-[9px] text-[#b2c3b1]/50">
                      JPG, PNG (≤ 10MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFilePicked(f, 'image');
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-2 p-6 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/70 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all">
                    <span className="material-icons text-[#9cb092] text-3xl">movie</span>
                    <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]">
                      Upload Video
                    </span>
                    <span className="font-display text-[9px] text-[#b2c3b1]/50">
                      MP4, MOV (≤ 50MB)
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFilePicked(f, 'video');
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-[#0d1512] border border-white/10 overflow-hidden flex items-center justify-center">
                    <div className="aspect-[9/16] max-h-[40vh] w-auto">
                      {uploadedTemplate.type === 'image' ? (
                        <img
                          src={uploadedTemplate.url}
                          alt="Uploaded design"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={uploadedTemplate.url}
                          controls
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/70 truncate flex items-center gap-2">
                      <span className="material-icons text-[#9cb092] text-base">
                        {uploadedTemplate.type === 'image' ? 'image' : 'movie'}
                      </span>
                      {uploadedTemplate.fileName || 'Your design'}
                    </p>
                    <button
                      onClick={() => setUploadedTemplate(null)}
                      className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/55 hover:text-red-400/80 transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-icons text-sm">refresh</span>
                      Replace
                    </button>
                  </div>

                  {/* Optional audio for image uploads */}
                  {uploadedTemplate.type === 'image' && (
                    <div className="border border-white/10 bg-white/[0.02] p-4 space-y-3">
                      <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#9cb092]/80 flex items-center gap-2">
                        <span className="material-icons text-[#9cb092] text-base">music_note</span>
                        Background music (optional)
                      </p>
                      {uploadedTemplate.audioUrl ? (
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <p className="font-display text-[10px] text-[#b2c3b1]/70 truncate">
                            {uploadedTemplate.audioName || 'Audio attached'}
                          </p>
                          <audio src={uploadedTemplate.audioUrl} controls className="h-8" />
                          <button
                            onClick={() =>
                              setUploadedTemplate((prev) =>
                                prev ? { ...prev, audioUrl: undefined, audioName: undefined } : prev
                              )
                            }
                            className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/55 hover:text-red-400/80 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex items-center justify-center gap-2 py-3 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/70 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all">
                          <span className="material-icons text-[#9cb092] text-base">upload</span>
                          <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]">
                            Choose audio file
                          </span>
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleAudioPicked(f);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="font-display text-[10px] text-[#b2c3b1]/55 leading-relaxed border-t border-white/[0.06] pt-4">
                <span className="material-icons text-[#9cb092] text-sm align-middle mr-1">info</span>
                We won't overlay or modify anything on your uploaded design — but we'll still ask
                for the basic event details so we can manage your guest list and RSVPs.
              </p>
            </div>

            <div className="px-6 md:px-10 py-5 border-t border-white/[0.06] bg-[#0e1712] flex items-center justify-between gap-3">
              <button
                onClick={closeAnyModal}
                className="py-3 px-5 border border-white/15 text-[#b2c3b1] font-display text-[10px] tracking-[0.2em] uppercase hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all flex items-center gap-2"
              >
                <span className="material-icons text-sm">arrow_back</span>
                Back
              </button>
              <button
                onClick={proceedFromUpload}
                disabled={!uploadedTemplate}
                className={`py-3 px-8 font-display text-[11px] tracking-[0.22em] uppercase font-bold transition-colors flex items-center gap-2 ${
                  uploadedTemplate
                    ? 'bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3]'
                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                }`}
              >
                Continue
                <span className="material-icons text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TEMPLATE EDITOR MODAL
          ════════════════════════════════════════════════════════════ */}
      {(selectedTemplate || uploadedTemplate) && modalPhase === 'editor' && (
        <div
          ref={editorBackdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAnyModal();
          }}
        >
          <div
            ref={editorPanelRef}
            className="relative w-full max-w-5xl h-full max-h-[88vh] flex flex-col md:flex-row bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeAnyModal}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
            >
              <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
            </button>

            {/* ── LEFT: image / video preview ─────────────────────── */}
            <div className="flex-shrink-0 h-[38vh] md:h-auto md:flex-1 md:min-h-0 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-white/[0.07]">
              <div className="flex-1 relative overflow-hidden bg-[#0d1512] flex items-center justify-center">
                <div className="relative h-full aspect-[9/16] max-w-full overflow-hidden">
                  {uploadedTemplate ? (
                    uploadedTemplate.type === 'image' ? (
                      <img
                        ref={mainImgRef}
                        src={uploadedTemplate.url}
                        alt="Your uploaded design"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={uploadedTemplate.url}
                        controls
                        autoPlay
                        loop
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )
                  ) : selectedTemplate ? (
                    <img
                      ref={mainImgRef}
                      src={selectedTemplate.previewImage}
                      alt={selectedTemplate.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null}

                  {/* Live overlay — only for stock templates, never on uploaded designs */}
                  {!uploadedTemplate && selectedTemplate && (
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
                  )}
                </div>

                {/* Prev / Next arrows — disabled for uploads */}
                {!uploadedTemplate && currentIdx > 0 && (
                  <button
                    onClick={prevTemplate}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <span className="material-icons text-white text-[18px]">chevron_left</span>
                  </button>
                )}
                {!uploadedTemplate && currentIdx < visibleTemplates.length - 1 && (
                  <button
                    onClick={nextTemplate}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <span className="material-icons text-white text-[18px]">chevron_right</span>
                  </button>
                )}

                {!uploadedTemplate && (
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 pointer-events-none">
                    <span className="font-display text-[10px] text-white/60 tracking-widest">
                      {currentIdx + 1} / {visibleTemplates.length}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: form (scrollable) ────────────────────────── */}
            <div className="flex-1 md:flex-[unset] md:w-[42%] md:min-w-[320px] md:max-w-[500px] min-h-0 flex flex-col overflow-hidden">
              <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 md:px-8 pt-7 pb-5 space-y-4">
                {/* Multiple Events toggle — wedding & custom only */}
                {supportsMultipleEvents && (
                  <div className="border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-[#9cb092] text-base">celebration</span>
                        <p className="font-display text-[10px] tracking-[0.18em] uppercase text-[#e4eee1]">
                          Multiple Events
                        </p>
                      </div>
                      <button
                        onClick={toggleHasSubEvents}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                          hasSubEvents ? 'bg-[#9cb092]' : 'bg-white/15'
                        }`}
                        aria-pressed={hasSubEvents}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
                            hasSubEvents ? 'translate-x-[22px]' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    {!hasSubEvents ? (
                      <p className="font-display text-[10px] text-[#b2c3b1]/50 leading-relaxed">
                        {currentEventType === 'marriage'
                          ? 'Toggle on if your celebration includes Mehendi, Sangeet, Reception, etc.'
                          : 'Toggle on if your celebration spans multiple events (e.g. Welcome Dinner, Main Event, After-Party).'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {Array.from({ length: subEventCount }, (_, i) => (
                          <div
                            key={i}
                            className="p-3 border border-white/5 bg-white/[0.015] space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092]/80">
                                Event {i + 1}
                              </p>
                              <button
                                onClick={() => removeSubEvent(i)}
                                className="text-[#b2c3b1]/40 hover:text-red-400/80 transition-colors"
                              >
                                <span className="material-icons text-sm">close</span>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={formData[`sub_${i}_name`] || ''}
                              onChange={(e) => handleFieldChange(`sub_${i}_name`, e.target.value)}
                              placeholder="Event name (e.g. Mehendi, Sangeet)"
                              className="bg-white/[0.06] border border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 px-2.5 py-1.5 text-xs rounded-sm w-full outline-none transition-colors"
                            />
                            <DateTimePicker
                              compact
                              date={formData[`sub_${i}_date`] || ''}
                              time={formData[`sub_${i}_time`] || ''}
                              timezone={formData[`sub_${i}_timezone`] || ''}
                              onChange={(next) => {
                                if (next.date !== undefined) handleFieldChange(`sub_${i}_date`, next.date);
                                if (next.time !== undefined) handleFieldChange(`sub_${i}_time`, next.time);
                                if (next.timezone !== undefined) handleFieldChange(`sub_${i}_timezone`, next.timezone);
                              }}
                            />
                            <input
                              type="text"
                              value={formData[`sub_${i}_venue`] || ''}
                              onChange={(e) => handleFieldChange(`sub_${i}_venue`, e.target.value)}
                              placeholder="Venue"
                              className="bg-white/[0.06] border border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 px-2.5 py-1.5 text-xs rounded-sm w-full outline-none transition-colors"
                            />
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              value={formData[`sub_${i}_guestCount`] || ''}
                              onChange={(e) => handleFieldChange(`sub_${i}_guestCount`, e.target.value)}
                              placeholder="Approx. # of guests"
                              className="bg-white/[0.06] border border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 px-2.5 py-1.5 text-xs rounded-sm w-full outline-none transition-colors"
                            />
                          </div>
                        ))}
                        <button
                          onClick={addSubEvent}
                          className="w-full py-2 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
                        >
                          <span className="material-icons text-sm">add</span>
                          Add Another Event
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Editor fields — date/time/timezone collapse into one DateTimePicker */}
                {(() => {
                  const rendered: ReactElement[] = [];
                  for (let idx = 0; idx < editorFields.length; idx++) {
                    const field = editorFields[idx];
                    if (field.name === 'eventDate') {
                      rendered.push(
                        <div key="datetime-group" className="space-y-1.5">
                          <label className="block font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]">
                            When is the event?
                            <span className="text-[#9cb092] ml-1">*</span>
                          </label>
                          <DateTimePicker
                            date={formData.eventDate || ''}
                            time={formData.eventTime || ''}
                            timezone={formData.timezone || ''}
                            onChange={(next) => {
                              if (next.date !== undefined) handleFieldChange('eventDate', next.date);
                              if (next.time !== undefined) handleFieldChange('eventTime', next.time);
                              if (next.timezone !== undefined) handleFieldChange('timezone', next.timezone);
                            }}
                            required
                          />
                        </div>
                      );
                      continue;
                    }
                    if (field.name === 'eventTime' || field.name === 'timezone') continue;

                    rendered.push(
                      <div key={field.name} className="space-y-1.5">
                        <label className="block font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]">
                          {field.label}
                          {field.required && <span className="text-[#9cb092] ml-1">*</span>}
                        </label>
                        {renderEditorField(field, formData[field.name] || '', handleFieldChange)}
                      </div>
                    );
                  }
                  return rendered;
                })()}
              </div>

              <div className="flex-shrink-0 px-6 md:px-8 py-5 border-t border-white/[0.06] bg-[#0e1712]">
                <button
                  onClick={proceedFromEditor}
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
          SIGN-IN GATE
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'signin' && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(13, 21, 18, 0.94)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) backToEditor();
          }}
        >
          <div
            className="relative w-full max-w-md bg-[#111914] border border-white/[0.09] shadow-2xl p-8 md:p-10 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={backToEditor}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
            >
              <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
            </button>

            <div className="w-14 h-14 rounded-full bg-[#9cb092]/15 border border-[#9cb092]/40 flex items-center justify-center mx-auto mb-5">
              <span className="material-icons text-[#9cb092] text-3xl">lock</span>
            </div>

            <h2 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] leading-tight mb-3">
              Almost <span className="text-[#9cb092] font-agatho italic">there</span>
            </h2>
            <p className="font-display text-sm text-[#b2c3b1]/80 leading-relaxed mb-8">
              Sign in to save your design, manage guest list, and send invites.
            </p>

            <button
              onClick={goToSignIn}
              className="w-full py-3.5 bg-[#9cb092] text-[#111914] font-display text-[11px] tracking-[0.22em] uppercase font-bold hover:bg-[#adc4a3] transition-colors flex items-center justify-center gap-2"
            >
              Sign In to Continue
              <span className="material-icons text-sm">arrow_forward</span>
            </button>

            <button
              onClick={backToEditor}
              className="mt-4 font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/55 hover:text-[#9cb092] transition-colors"
            >
              Back to design
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          GUEST POPUP
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'guests' && (selectedTemplate || uploadedTemplate) && (
        <GuestPopup
          guests={guests}
          onGuestsChange={setGuests}
          deliveryPreference={deliveryPreference}
          onDeliveryPreferenceChange={setDeliveryPreference}
          onBack={backToEditor}
          onProceed={proceedToPayment}
          formData={formData}
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
