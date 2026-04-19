import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import gsap from 'gsap';
import Navigation from '@/sections/Navigation';
import EventTypeSelector from '@/sections/create/EventTypeSelector';
import EventDetailsForm from '@/sections/create/EventDetailsForm';
import TemplateGallery from '@/sections/create/TemplateGallery';
import FinalPreview from '@/sections/create/FinalPreview';
import GuestDetails, { createGuest, type Guest } from '@/sections/create/GuestDetails';
import PaymentStep from '@/sections/create/PaymentStep';
import {
  commonFields,
  eventSpecificFields,
  type EventType,
} from '@/data/eventFields';

const STEPS = [
  { label: 'Choose Event', icon: 'celebration' },
  { label: 'Enter Details', icon: 'edit_note' },
  { label: 'Pick Design', icon: 'palette' },
  { label: 'Final Look', icon: 'visibility' },
  { label: 'Guests', icon: 'group' },
  { label: 'Payment', icon: 'payment' },
] as const;

export default function CreateEvite() {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const topAnchorRef = useRef<HTMLDivElement>(null);
  const eventIdRef = useRef<string | null>(null);
  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([createGuest()]);
  const [deliveryPreference, setDeliveryPreference] = useState<'email' | 'phone' | 'both'>('email');
  const [draftChecked, setDraftChecked] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<null | {
    step: number;
    event_type: string | null;
    form_data: Record<string, string>;
    selected_template: string | null;
    guests: Array<{ id: string; name: string; email: string; phone: string }>;
    delivery_preference: 'email' | 'phone' | 'both';
    updated_at: string;
  }>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const VALID_EVENT_TYPES = Object.keys(eventSpecificFields) as EventType[];
  const LS_KEY = 'mm_draft_backup';

  // Build the current draft payload
  const buildDraftPayload = useCallback(() => ({
    step,
    event_type: eventType,
    form_data: formData,
    selected_template: selectedTemplate,
    guests,
    delivery_preference: deliveryPreference,
  }), [step, eventType, formData, selectedTemplate, guests, deliveryPreference]);

  // Immediate local backup on every change (survives crashes/offline)
  useEffect(() => {
    if (!draftChecked || pendingDraft || step === 0) return;
    try { localStorage.setItem(LS_KEY, JSON.stringify({ ...buildDraftPayload(), updated_at: new Date().toISOString() })); } catch {}
  }, [step, eventType, formData, selectedTemplate, guests, deliveryPreference, draftChecked, pendingDraft, buildDraftPayload]);

  // Load draft on mount — API first, localStorage fallback
  useEffect(() => {
    api.getDraft()
      .then((draft) => {
        if (draft && draft.step > 0) { setPendingDraft(draft); return; }
        // Fallback: check localStorage backup
        try {
          const local = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
          if (local && local.step > 0) setPendingDraft(local);
        } catch {}
      })
      .catch(() => {
        // API failed — try localStorage backup
        try {
          const local = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
          if (local && local.step > 0) setPendingDraft(local);
        } catch {}
      })
      .finally(() => setDraftChecked(true));
  }, []);

  // Debounced API save (2s after last change)
  useEffect(() => {
    if (!draftChecked || pendingDraft || step === 0) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.saveDraft(buildDraftPayload());
        setSaveStatus('saved');
        if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current);
        saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
      } catch {
        setSaveStatus('error');
        if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current);
        saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 2000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [step, eventType, formData, selectedTemplate, guests, deliveryPreference, draftChecked, pendingDraft, buildDraftPayload]);

  // Save immediately when tab hides or user navigates away (keepalive ensures delivery)
  useEffect(() => {
    if (!draftChecked) return;
    const saveNow = () => {
      if (step === 0 || confirmed) return;
      const payload = buildDraftPayload();
      try { localStorage.setItem(LS_KEY, JSON.stringify({ ...payload, updated_at: new Date().toISOString() })); } catch {}
      const token = (window as any).__mm_token;
      if (token) {
        const API_URL = import.meta.env.VITE_API_URL || '';
        fetch(`${API_URL}/api/drafts/my`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    };
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') saveNow(); };
    window.addEventListener('beforeunload', saveNow);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', saveNow);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [draftChecked, step, confirmed, buildDraftPayload]);

  // Cache token on window for keepalive saves
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (window as any).__mm_token = session?.access_token ?? null;
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      (window as any).__mm_token = s?.access_token ?? null;
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        pageRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.out' }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  // Scroll to top whenever step changes or confirmed
  useEffect(() => {
    topAnchorRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const raf = requestAnimationFrame(() => {
      topAnchorRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      window.scrollTo(0, 0);
    });
    const t = setTimeout(() => {
      topAnchorRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      window.scrollTo(0, 0);
    }, 50);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [step, confirmed]);

  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: false }));
  }, []);

  const validateStep2 = (): boolean => {
    if (!eventType) return false;
    const allFields = [...eventSpecificFields[eventType], ...commonFields];
    const newErrors: Record<string, boolean> = {};
    let valid = true;

    for (const field of allFields) {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = true;
        valid = false;
      }
    }
    setErrors(newErrors);
    return valid;
  };

  const validateGuests = (): boolean => {
    return guests.some((g) => g.name.trim());
  };

  const handleNext = () => {
    if (step === 0 && !eventType) return;
    if (step === 1 && !validateStep2()) return;
    if (step === 2 && !selectedTemplate) return;
    if (step === 4 && !validateGuests()) return;
    if (step < 5) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (confirmed) {
      setConfirmed(false);
      return;
    }
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  const handleConfirm = async () => {
    try {
      const event = await api.createEvent({
        title: formData.eventName || formData.title || (eventType ? `${eventType} Event` : 'My Event'),
        description: formData.description || null,
        event_date: formData.eventDate || formData.date || new Date().toISOString().split('T')[0],
        event_time: formData.eventTime || formData.time || null,
        location: formData.location || formData.venue || null,
        template_id: selectedTemplate,
        status: 'published',
      });

      eventIdRef.current = event.id;

      if (guests.length > 0 && guests.some(g => g.name.trim())) {
        const invitees = guests
          .filter(g => g.name.trim())
          .map(g => ({
            name: g.name,
            email: g.email || undefined,
            phone: g.phone || undefined,
            source: 'manual' as const,
          }));
        await api.addInvitees(event.id, invitees);
      }

      api.deleteDraft().catch(() => {});
      try { localStorage.removeItem('mm_draft_backup'); } catch {}
      setConfirmed(true);
    } catch (e) {
      console.error('Failed to save event:', e);
      alert('Failed to create event. Please try again.');
    }
  };

  // Auto-advance from step 0 when event type is selected
  const handleAutoAdvance = useCallback(() => {
    setStep(1);
  }, []);

  // Auto-advance from step 1 once every required field is filled.
  // Runs the same validation as the old "Next" button so we don't
  // leap forward on a form that's technically complete but errored.
  const handleDetailsAutoAdvance = useCallback(() => {
    if (validateStep2()) {
      setStep(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, formData]);

  return (
    <>
    {pendingDraft && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-[#1a2418] border border-[#9cb092]/30 p-8 max-w-sm w-full text-center">
          <span className="material-icons text-[#9cb092] text-3xl mb-4 block">edit_note</span>
          <h3 className="font-serif-exp text-xl text-[#e4eee1] italic mb-3">Continue your evite?</h3>
          <p className="font-display text-[10px] tracking-[0.15em] text-[#b2c3b1]/60 uppercase mb-6 leading-relaxed">
            You left off at step {pendingDraft.step + 1}{pendingDraft.event_type ? ` — ${pendingDraft.event_type}` : ''}<br />
            Last saved {new Date(pendingDraft.updated_at).toLocaleDateString()}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                // Validate event_type is still a valid option
                const validType = pendingDraft.event_type && VALID_EVENT_TYPES.includes(pendingDraft.event_type as EventType)
                  ? pendingDraft.event_type as EventType : null;
                if (validType) setEventType(validType);
                setFormData(pendingDraft.form_data || {});
                if (pendingDraft.selected_template) setSelectedTemplate(pendingDraft.selected_template);
                // Ensure at least one guest after restore
                const restoredGuests = pendingDraft.guests?.length ? pendingDraft.guests : [createGuest()];
                setGuests(restoredGuests);
                setDeliveryPreference(pendingDraft.delivery_preference || 'email');
                // Clamp step to valid range; if event_type missing, go to step 0
                const clampedStep = Math.min(Math.max(pendingDraft.step, 0), 5);
                setStep(validType ? clampedStep : 0);
                setPendingDraft(null);
              }}
              className="flex-1 py-3 bg-[#9cb092] text-[#0d1a10] font-display text-[10px] tracking-[0.2em] uppercase hover:bg-[#b2c3b1] transition-colors"
            >
              Continue
            </button>
            <button
              onClick={() => { api.deleteDraft().catch(() => {}); try { localStorage.removeItem('mm_draft_backup'); } catch {} setPendingDraft(null); }}
              className="flex-1 py-3 border border-white/15 text-[#b2c3b1]/60 font-display text-[10px] tracking-[0.2em] uppercase hover:border-white/30 transition-colors"
            >
              Start Fresh
            </button>
          </div>
        </div>
      </div>
    )}
    <div ref={pageRef} className="relative min-h-screen bg-[#EADDD7] text-[#e4eee1] overflow-x-hidden flex flex-col">
      <div ref={topAnchorRef} className="absolute top-0 left-0 w-0 h-0" aria-hidden="true" />
      {/* Texture background */}
      <div
        className="fixed inset-0 z-0 opacity-30 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0yNSOWSBJLsv1-47TiuxQ15AFQ4nsrk2tyl20R-zvNNsiDXBNDhZVYz1yHqSCTtqtGcVjl35j2rrDIrA-d5xW6tM2FPDinMxC7wGNXKzBCT0JhfwdSkLFQPVqU1yfc1GtqRHSfxSmlitg3lWmrbcCqzLdzR4XsiD9nN9-_O7fp4ViDdX7MFMvLLa9exuWvETBq8HCVRb7NcpP7tWvqDoEWCeegHipJmlKBCM4gpRO9AROi6bPaa2gmQvHKabiYnelhLueCkgQ9QIe')`,
        }}
      />
      <div className="fixed inset-0 z-[1] bg-[#111914]/70 pointer-events-none" />

      <Navigation />

      {/* Auto-save indicator */}
      {!confirmed && step > 0 && saveStatus !== 'idle' && (
        <div className={`fixed top-20 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-display tracking-[0.15em] uppercase transition-all ${
          saveStatus === 'saving' ? 'bg-white/5 text-[#b2c3b1]/40' :
          saveStatus === 'saved' ? 'bg-[#9cb092]/15 text-[#9cb092]' :
          'bg-red-900/20 text-red-400/70'
        }`}>
          {saveStatus === 'saving' && <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />}
          {saveStatus === 'saved' && <span className="material-icons text-[10px]">check</span>}
          {saveStatus === 'error' && <span className="material-icons text-[10px]">cloud_off</span>}
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Not saved'}
        </div>
      )}

      {/* Layout: vertical steps left + content right */}
      <div className="relative z-10 pt-16 px-3 md:px-4 flex flex-col md:flex-row flex-grow">
        {/* Spacer — preserves layout width for the fixed sidebar */}
        {!confirmed && (
          <div className="hidden md:block flex-shrink-0 w-16" aria-hidden="true" />
        )}

        {/* Vertical Step Indicator — fixed, always vertically centred */}
        {!confirmed && (
          <div className="hidden md:flex flex-col items-center pl-1 pr-2 fixed left-2 top-1/2 -translate-y-1/2 z-20">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center">
                <button
                  className="flex flex-col items-center group select-none"
                  onClick={() => { if (i <= step) setStep(i); }}
                  disabled={i > step}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border ${
                      i <= step
                        ? 'bg-[#9cb092]/90 text-[#111914] border-[#9cb092] shadow-md cursor-pointer group-hover:scale-110'
                        : 'bg-white/5 text-[#b2c3b1]/40 border-white/10 cursor-not-allowed'
                    }`}
                  >
                    {i < step ? (
                      <span className="material-icons text-sm">check</span>
                    ) : (
                      <span className="material-icons text-sm">{s.icon}</span>
                    )}
                  </div>
                  <span
                    className={`font-display text-[7px] tracking-[0.12em] uppercase mt-0.5 transition-colors duration-300 whitespace-nowrap ${
                      i <= step ? 'text-[#9cb092]' : 'text-[#b2c3b1]/30'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-px h-4 transition-colors duration-300 ${i < step ? 'bg-[#9cb092]/60' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Main column: mobile steps + content */}
        <div className="flex-grow flex flex-col min-w-0">
          {/* Mobile horizontal steps (small screens only) */}
          {!confirmed && (
            <div className="md:hidden flex items-center justify-center gap-1 mb-3">
              {STEPS.map((s, i) => (
                <div key={s.label} className="flex items-center">
                  <button
                    className="group select-none"
                    onClick={() => { if (i <= step) setStep(i); }}
                    disabled={i > step}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border ${
                        i <= step
                          ? 'bg-[#9cb092]/90 text-[#111914] border-[#9cb092] cursor-pointer'
                          : 'bg-white/5 text-[#b2c3b1]/40 border-white/10 cursor-not-allowed'
                      }`}
                    >
                      {i < step ? (
                        <span className="material-icons text-[10px]">check</span>
                      ) : (
                        <span className="material-icons text-[10px]">{s.icon}</span>
                      )}
                    </div>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`w-3 sm:w-6 h-px mx-0.5 ${i < step ? 'bg-[#9cb092]/60' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step Content */}
          <main className="flex-grow pt-8 md:pt-12 pb-10 min-w-0">
          <div className="container mx-auto">
          {confirmed ? (
            /* Thank You Screen */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-full bg-[#9cb092]/20 border border-[#9cb092]/40 flex items-center justify-center mb-8">
                <span className="material-icons text-[#9cb092] text-4xl">check</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif-exp mb-6">
                Thank <span className="text-[#9cb092] font-agatho">You</span>
              </h1>
              <p className="text-sm md:text-base font-display tracking-[0.15em] text-[#b2c3b1] max-w-md mb-3">
                Your evite has been created and sent successfully.
              </p>
              <p className="text-xs font-display tracking-[0.2em] text-[#b2c3b1]/50 uppercase mb-12">
                Your guests are going to love it
              </p>
              <div className="w-[1px] h-16 bg-[#9cb092]/30 mb-12" />
              <button
                onClick={() => navigate('/')}
                className="px-10 py-3 bg-[#3d4a35] text-white hover:bg-[#4d5a44] shadow-lg font-display text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 transition-all"
              >
                <span className="material-icons text-sm">home</span>
                Back to Home
              </button>
            </div>
          ) : (
            <>
              {step === 0 && (
                <EventTypeSelector
                  selected={eventType}
                  onSelect={setEventType}
                  onAutoAdvance={handleAutoAdvance}
                />
              )}
              {step === 1 && eventType && (
                <EventDetailsForm
                  eventType={eventType}
                  formData={formData}
                  onChange={handleFieldChange}
                  errors={errors}
                  onAutoAdvance={handleDetailsAutoAdvance}
                />
              )}
              {step === 2 && eventType && (
                <TemplateGallery
                  eventType={eventType}
                  selectedTemplate={selectedTemplate}
                  onSelect={setSelectedTemplate}
                  formData={formData}
                />
              )}
              {step === 3 && eventType && selectedTemplate && (
                <FinalPreview
                  eventType={eventType}
                  selectedTemplate={selectedTemplate}
                  formData={formData}
                  onFieldChange={handleFieldChange}
                />
              )}
              {step === 4 && (
                <GuestDetails
                  guests={guests}
                  onGuestsChange={setGuests}
                  deliveryPreference={deliveryPreference}
                  onDeliveryPreferenceChange={setDeliveryPreference}
                />
              )}
              {step === 5 && (
                <PaymentStep
                  guestCount={guests.length}
                  onConfirm={() => { handleConfirm(); }}
                />
              )}
            </>
          )}
        </div>
        </main>
        </div>
      </div>

      {/* Side Arrow Navigation — fixed, pulled in from screen edges towards the form */}
      {!confirmed && step !== 0 && step !== 5 && (
        <>
          {/* ← Back */}
          <button
            onClick={handleBack}
            className={`fixed z-50 w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/15 bg-[#111914]/60 backdrop-blur-sm hover:bg-[#9cb092]/15 hover:border-[#9cb092]/50 flex items-center justify-center transition-all duration-200 group shadow-lg ${
              step === 3 ? 'bottom-6 left-6' : 'top-1/2 -translate-y-1/2'
            }`}
            style={step !== 3 ? { left: 'max(80px, calc(50vw - 380px))' } : undefined}
          >
            <span className="material-icons text-[#b2c3b1]/55 group-hover:text-[#9cb092] transition-colors" style={{ fontSize: '20px' }}>
              arrow_back
            </span>
          </button>

          {/* → Next */}
          <button
            onClick={handleNext}
            disabled={step === 2 && !selectedTemplate}
            className={`fixed z-50 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              step === 2 && !selectedTemplate
                ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
                : 'bg-[#9cb092]/90 hover:bg-[#9cb092] text-[#111914] border border-[#9cb092]/50 hover:shadow-[#9cb092]/30'
            } ${step === 3 ? 'bottom-6 right-6' : 'top-1/2 -translate-y-1/2'}`}
            style={step !== 3 ? { right: 'max(12px, calc(50vw - 444px))' } : undefined}
          >
            <span className="material-icons" style={{ fontSize: '20px' }}>arrow_forward</span>
          </button>
        </>
      )}
    </div>
    </>
  );
}
