import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([createGuest()]);
  const [deliveryPreference, setDeliveryPreference] = useState<'email' | 'phone' | 'both'>('email');

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
    return guests.every((g) => {
      if (!g.name.trim()) return false;
      if ((deliveryPreference === 'email' || deliveryPreference === 'both') && !g.email.trim()) return false;
      if ((deliveryPreference === 'phone' || deliveryPreference === 'both') && !g.phone.trim()) return false;
      return true;
    });
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

  const handleConfirm = () => {
    setConfirmed(true);
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

      {/* Layout: vertical steps left + content right */}
      <div className="relative z-10 pt-16 px-3 md:px-4 flex flex-col md:flex-row flex-grow">
        {/* Vertical Step Indicator — left sidebar (md+ only) */}
        {!confirmed && (
          <div className="hidden md:flex flex-col items-center pt-4 pl-1 pr-3 flex-shrink-0 sticky top-16 self-start h-fit">
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
          <main className="flex-grow pb-10 min-w-0">
          <div className="container mx-auto">
          {confirmed ? (
            /* Thank You Screen */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-full bg-[#9cb092]/20 border border-[#9cb092]/40 flex items-center justify-center mb-8">
                <span className="material-icons text-[#9cb092] text-4xl">check</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif-exp italic mb-6">
                Thank <span className="text-[#9cb092] not-italic font-agatho">You</span>
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
                  onConfirm={handleConfirm}
                />
              )}
            </>
          )}
        </div>
        </main>
        </div>
      </div>

      {/* Bottom Navigation Bar — hidden on confirmed screen, steps 0 & 1
          (both auto-advance on completion), and payment step */}
      {!confirmed && step !== 0 && step !== 1 && step !== 5 && (
        <div className="sticky bottom-0 z-40 border-t border-white/10">
          <div className="bg-[#111914]/80 backdrop-blur-md px-4 py-2.5">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={step === 0 ? () => navigate('/') : handleBack}
                className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/60 hover:text-[#9cb092] transition-colors flex items-center gap-2"
              >
                <span className="material-icons text-sm">arrow_back</span>
                {step === 0 ? 'Home' : 'Back'}
              </button>

              <div className="noise-btn-container">
                <div className="noise-btn-bg" />
                <div className="noise-texture" />
                <button
                  onClick={handleNext}
                  disabled={
                    (step === 0 && !eventType) ||
                    (step === 2 && !selectedTemplate)
                  }
                  className={`btn-inner px-10 py-3 font-display text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 transition-all ${
                    (step === 0 && !eventType) || (step === 2 && !selectedTemplate)
                      ? 'bg-white/5 text-white/20 cursor-not-allowed'
                      : 'bg-[#3d4a35] text-white hover:bg-[#4d5a44] shadow-lg'
                  }`}
                >
                  {step === 2 ? 'Preview' : 'Next'}
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
