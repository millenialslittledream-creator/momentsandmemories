import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { createGuest, type Guest } from './GuestDetails';

interface GuestPopupProps {
  guests: Guest[];
  onGuestsChange: (guests: Guest[]) => void;
  deliveryPreference: 'email' | 'phone' | 'both';
  onDeliveryPreferenceChange: (pref: 'email' | 'phone' | 'both') => void;
  onBack: () => void;
  onClose?: () => void;
  onProceed: () => void;
  formData: Record<string, string>;
}

type ContactMethod = 'manual' | 'excel' | 'qr';
type DeliveryPref = 'email' | 'phone' | 'both';

interface SubEvent {
  idx: number;
  name: string;
}

let guestIdCounter = Date.now();

export default function GuestPopup({
  guests,
  onGuestsChange,
  deliveryPreference,
  onDeliveryPreferenceChange,
  onBack,
  onClose,
  onProceed,
  formData,
}: GuestPopupProps) {
  const navigate = useNavigate();
  const handleClose = () => {
    if (onClose) onClose();
    else navigate('/');
  };
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef(guests);
  useEffect(() => {
    guestsRef.current = guests;
  }, [guests]);

  // The active contact-collection sub-popup. null = closed.
  const [activeMethod, setActiveMethod] = useState<ContactMethod | null>(null);
  const [qrSession, setQrSession] = useState<{ token: string; qr_code_base64: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');

  // Derived sub-events from the editor's formData (set by Multiple Events toggle).
  const subEvents: SubEvent[] = useMemo(() => {
    const count = parseInt(formData['sub_events_count'] || '0', 10) || 0;
    return Array.from({ length: count }, (_, i) => ({
      idx: i,
      name: formData[`sub_${i}_name`]?.trim() || `Event ${i + 1}`,
    }));
  }, [formData]);
  const hasSubEvents = subEvents.length > 0;

  useEffect(() => {
    if (backdropRef.current && panelRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: 'power2.out' }
      );
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.96, y: 24 },
        { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'power3.out' }
      );
    }
  }, []);

  // ── Guest row operations ────────────────────────────────────────────
  const addGuestAfter = (id: string) => {
    const idx = guests.findIndex((g) => g.id === id);
    const next = [...guests];
    next.splice(idx + 1, 0, createGuest());
    onGuestsChange(next);
  };

  const removeGuest = (id: string) => {
    if (guests.length <= 1) {
      onGuestsChange([createGuest()]);
      return;
    }
    onGuestsChange(guests.filter((g) => g.id !== id));
  };

  const updateGuest = (id: string, field: keyof Guest, value: string) => {
    onGuestsChange(guests.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  // ── Sub-event checkbox helpers ──────────────────────────────────────
  const allEventKeys = () => subEvents.map((ev) => String(ev.idx));

  const isGuestInEvent = (g: Guest, idx: number) => {
    if (!g.events) return true;
    return g.events.includes(String(idx));
  };

  const toggleGuestEvent = (id: string, idx: number) => {
    const key = String(idx);
    onGuestsChange(
      guests.map((g) => {
        if (g.id !== id) return g;
        const current = g.events ?? allEventKeys();
        const next = current.includes(key)
          ? current.filter((k) => k !== key)
          : [...current, key];
        return { ...g, events: next };
      })
    );
  };

  const guestInAllEvents = (g: Guest) =>
    subEvents.every((ev) => isGuestInEvent(g, ev.idx));

  const toggleAllForGuest = (id: string) => {
    onGuestsChange(
      guests.map((g) => {
        if (g.id !== id) return g;
        return { ...g, events: guestInAllEvents(g) ? [] : allEventKeys() };
      })
    );
  };

  // ── Imports ─────────────────────────────────────────────────────────
  const applyContacts = (contacts: Array<{ name: string; email?: string; phone?: string }>) => {
    const newGuests: Guest[] = contacts.map((c) => ({
      id: `guest-import-${++guestIdCounter}`,
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
    }));
    if (newGuests.length === 0) return;
    const existing = guestsRef.current.filter((g) => g.name.trim());
    onGuestsChange([...existing, ...newGuests]);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').filter((l) => l.trim());
      const startIdx = lines[0]?.toLowerCase().includes('name') ? 1 : 0;
      const newGuests: Array<{ name: string; email?: string; phone?: string }> = [];
      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(/[,\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols[0]) {
          newGuests.push({ name: cols[0] || '', email: cols[1] || '', phone: cols[2] || '' });
        }
      }
      applyContacts(newGuests);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleQRImport = async () => {
    setQrError('');
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();
    if (!authSession) {
      setQrError('QR import requires sign-in. Use manual entry or Excel upload instead.');
      return;
    }
    setQrLoading(true);
    try {
      const session = await api.createQRSession();
      setQrSession({ token: session.session_token, qr_code_base64: session.qr_code_base64 });

      let resolved = false;
      const resolve = (contacts: Array<{ name: string; email?: string; phone?: string }>) => {
        if (resolved) return;
        resolved = true;
        applyContacts(contacts);
        supabase.removeChannel(channel);
        clearInterval(pollInterval);
        setQrSession(null);
      };

      const channel = supabase
        .channel(`qr-${session.session_token}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'qr_contact_sessions',
            filter: `session_token=eq.${session.session_token}`,
          },
          (payload: {
            new: {
              status: string;
              contacts_json: Array<{ name: string; email?: string; phone?: string }>;
            };
          }) => {
            if (payload.new.status === 'completed' && payload.new.contacts_json?.length) {
              resolve(payload.new.contacts_json);
            }
          }
        )
        .subscribe();

      const pollInterval = setInterval(async () => {
        try {
          const status = (await api.pollQRSession(session.session_token)) as {
            status: string;
            contacts_json?: Array<{ name: string; email?: string; phone?: string }>;
          };
          if (status.status === 'completed' && status.contacts_json?.length) {
            resolve(status.contacts_json);
          }
        } catch {
          /* ignore */
        }
      }, 2000);

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          clearInterval(pollInterval);
          supabase.removeChannel(channel);
          setQrSession(null);
          setQrError('QR session expired. Please try again.');
        }
      }, 15 * 60 * 1000);
    } catch {
      setQrError('Could not start QR session.');
    } finally {
      setQrLoading(false);
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────
  const showEmail = deliveryPreference === 'email' || deliveryPreference === 'both';
  const showPhone = deliveryPreference === 'phone' || deliveryPreference === 'both';

  const cellInputClass =
    'w-full bg-transparent border border-white/10 focus:border-[#9cb092] focus:bg-white/[0.04] outline-none px-2 py-1.5 text-[12px] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 transition-colors rounded-sm';

  const headerCellClass =
    'px-2 py-2 text-left font-display text-[9px] tracking-[0.15em] uppercase text-[#9cb092]/80 font-semibold';

  const importedCount = guests.filter((g) => g.name.trim()).length;

  const deliveryOptions: { value: DeliveryPref; label: string; icon: string; description: string }[] = [
    { value: 'email', label: 'Email', icon: 'email', description: 'Send invites via email' },
    { value: 'phone', label: 'SMS', icon: 'sms', description: 'Send invites via text' },
    { value: 'both', label: 'Email + SMS', icon: 'mark_email_read', description: 'Use both for best reach' },
  ];

  const contactOptions: { value: ContactMethod; label: string; icon: string; description: string }[] = [
    { value: 'excel', label: 'Excel Upload', icon: 'upload_file', description: '.csv or .xlsx file' },
    { value: 'qr', label: 'QR Scan', icon: 'qr_code_2', description: 'Scan from your phone' },
    { value: 'manual', label: 'Manual Entry', icon: 'edit_note', description: 'Type each guest in' },
  ];

  const openMethod = (method: ContactMethod) => {
    setActiveMethod(method);
    if (method === 'qr') handleQRImport();
  };

  const closeSubPopup = () => {
    setActiveMethod(null);
  };

  const handleProceed = () => {
    if (importedCount === 0) return;
    onProceed();
  };

  const subPopupTitle =
    activeMethod === 'manual'
      ? 'Add guests manually'
      : activeMethod === 'excel'
      ? 'Upload guest list'
      : activeMethod === 'qr'
      ? 'Import via QR scan'
      : '';

  const guestRows = (
    <div className="overflow-x-auto border border-white/5 bg-white/[0.015]">
      <table className="w-full border-collapse min-w-[520px]">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            <th className={`${headerCellClass} w-8 text-center`}>#</th>
            <th className={`${headerCellClass} min-w-[120px]`}>Name</th>
            {showEmail && <th className={`${headerCellClass} min-w-[160px]`}>Email</th>}
            {showPhone && <th className={`${headerCellClass} min-w-[120px]`}>Phone</th>}
            {hasSubEvents && (
              <>
                <th className={`${headerCellClass} text-center min-w-[60px]`}>All</th>
                {subEvents.map((ev) => (
                  <th key={ev.idx} className={`${headerCellClass} text-center min-w-[80px]`}>
                    <span className="truncate block max-w-[100px]" title={ev.name}>
                      {ev.name}
                    </span>
                  </th>
                ))}
              </>
            )}
            <th className={`${headerCellClass} w-16 text-right`}>{/* row controls */}</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((guest, index) => (
            <tr
              key={guest.id}
              className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-2 py-1.5 text-center font-display text-[10px] text-[#9cb092]/60">
                {index + 1}
              </td>
              <td className="px-2 py-1.5">
                <input
                  type="text"
                  value={guest.name}
                  onChange={(e) => updateGuest(guest.id, 'name', e.target.value)}
                  placeholder="Guest name"
                  className={cellInputClass}
                />
              </td>
              {showEmail && (
                <td className="px-2 py-1.5">
                  <input
                    type="email"
                    value={guest.email}
                    onChange={(e) => updateGuest(guest.id, 'email', e.target.value)}
                    placeholder="guest@email.com"
                    className={cellInputClass}
                  />
                </td>
              )}
              {showPhone && (
                <td className="px-2 py-1.5">
                  <input
                    type="tel"
                    value={guest.phone}
                    onChange={(e) => updateGuest(guest.id, 'phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className={cellInputClass}
                  />
                </td>
              )}
              {hasSubEvents && (
                <>
                  <td className="px-2 py-1.5 text-center">
                    <EventCheckbox
                      checked={guestInAllEvents(guest)}
                      onChange={() => toggleAllForGuest(guest.id)}
                    />
                  </td>
                  {subEvents.map((ev) => (
                    <td key={ev.idx} className="px-2 py-1.5 text-center">
                      <EventCheckbox
                        checked={isGuestInEvent(guest, ev.idx)}
                        onChange={() => toggleGuestEvent(guest.id, ev.idx)}
                      />
                    </td>
                  ))}
                </>
              )}
              <td className="px-1 py-1.5">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => addGuestAfter(guest.id)}
                    className="text-[#9cb092]/50 hover:text-[#9cb092] transition-colors"
                    title="Add row below"
                  >
                    <span className="material-icons text-sm">add_circle_outline</span>
                  </button>
                  <button
                    onClick={() => removeGuest(guest.id)}
                    className="text-[#b2c3b1]/30 hover:text-red-400/80 transition-colors"
                    title="Remove row"
                  >
                    <span className="material-icons text-sm">close</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onBack();
      }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
        >
          <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
        </button>

        {/* Header */}
        <div className="flex-shrink-0 px-6 md:px-10 pt-8 pb-5 border-b border-white/[0.06]">
          <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092]/50 mb-2">
            Step 2 of 3
          </p>
          <h2 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] leading-tight">
            Who's on the <span className="text-[#9cb092] font-agatho italic">guest list?</span>
          </h2>
          <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/55 mt-3">
            Pick how you'd like to deliver — and how to add your guests.
          </p>
        </div>

        {/* Body */}
        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 md:px-10 py-6 space-y-7">
          {/* Section 1: Delivery method */}
          <div>
            <h3 className="font-serif-exp text-base text-[#e4eee1] mb-3 flex items-center gap-2">
              <span className="material-icons text-[#9cb092] text-base">send</span>
              How should we deliver the evite?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {deliveryOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onDeliveryPreferenceChange(opt.value)}
                  className={`group text-left p-4 border transition-all duration-200 ${
                    deliveryPreference === opt.value
                      ? 'border-[#9cb092] bg-[#9cb092]/10 shadow-sm shadow-[#9cb092]/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-[#9cb092]/40'
                  }`}
                >
                  <span
                    className={`material-icons text-xl mb-2 block transition-colors ${
                      deliveryPreference === opt.value ? 'text-[#9cb092]' : 'text-[#b2c3b1]/55'
                    }`}
                  >
                    {opt.icon}
                  </span>
                  <p className="font-display text-[10px] tracking-[0.18em] uppercase text-[#e4eee1] mb-0.5">
                    {opt.label}
                  </p>
                  <p className="font-display text-[9px] text-[#b2c3b1]/55 leading-relaxed">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Contact method */}
          <div>
            <h3 className="font-serif-exp text-base text-[#e4eee1] mb-3 flex items-center gap-2">
              <span className="material-icons text-[#9cb092] text-base">group_add</span>
              How would you like to add your guests?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {contactOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => openMethod(opt.value)}
                  className="group text-left p-4 border border-white/10 bg-white/[0.03] hover:border-[#9cb092]/40 hover:bg-[#9cb092]/[0.05] transition-all duration-200"
                >
                  <span className="material-icons text-xl mb-2 block text-[#b2c3b1]/55 group-hover:text-[#9cb092] transition-colors">
                    {opt.icon}
                  </span>
                  <p className="font-display text-[10px] tracking-[0.18em] uppercase text-[#e4eee1] mb-0.5">
                    {opt.label}
                  </p>
                  <p className="font-display text-[9px] text-[#b2c3b1]/55 leading-relaxed">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Status hint */}
          <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
            <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/50">
              {importedCount > 0
                ? `${importedCount} guest${importedCount === 1 ? '' : 's'} added`
                : 'No guests added yet — pick a method above'}
            </p>
            {importedCount > 0 && (
              <button
                onClick={() => openMethod('manual')}
                className="font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092] hover:text-[#adc4a3] transition-colors flex items-center gap-1"
              >
                <span className="material-icons text-sm">visibility</span>
                Review guests
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 md:px-10 py-5 border-t border-white/[0.06] bg-[#0e1712]">
          <button
            onClick={onBack}
            className="py-3 px-5 border border-white/15 text-[#b2c3b1] font-display text-[10px] tracking-[0.2em] uppercase hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all flex items-center gap-2"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Back
          </button>

          <button
            onClick={handleProceed}
            disabled={importedCount === 0}
            className={`py-3 px-8 font-display text-[11px] tracking-[0.22em] uppercase font-bold transition-colors flex items-center gap-2 ${
              importedCount > 0
                ? 'bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3]'
                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
            }`}
          >
            Proceed to Payment
            <span className="material-icons text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* ── Sub-popup: contact-method specific (manual / excel / qr) ── */}
      {activeMethod && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center p-4 md:p-8"
          style={{ backgroundColor: 'rgba(13, 21, 18, 0.85)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSubPopup();
          }}
        >
          <div
            className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeSubPopup}
              className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
            >
              <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
            </button>

            <div className="flex-shrink-0 px-6 md:px-8 pt-7 pb-4 border-b border-white/[0.06]">
              <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092]/50 mb-2">
                Guest Details
              </p>
              <h3 className="font-serif-exp text-xl md:text-2xl text-[#e4eee1] leading-tight">
                {subPopupTitle}
              </h3>
              {hasSubEvents && (
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/55 mt-3">
                  Tick which events each guest should be invited to.
                </p>
              )}
            </div>

            <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 md:px-8 py-5 space-y-4">
              {/* Method-specific intro */}
              {activeMethod === 'excel' && (
                <label className="block w-full py-6 border-2 border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all cursor-pointer text-center">
                  <span className="material-icons text-[#9cb092]/70 text-2xl block mb-2">
                    upload_file
                  </span>
                  <span className="font-display text-[11px] tracking-[0.2em] uppercase text-[#9cb092] block mb-1">
                    Choose .csv or .xlsx file
                  </span>
                  <span className="font-display text-[9px] text-[#b2c3b1]/45 block">
                    Format: Name, Email, Phone — header row optional
                  </span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleCsvUpload}
                  />
                </label>
              )}

              {activeMethod === 'qr' && (
                <div className="border border-white/10 bg-white/[0.02] p-5 text-center">
                  {qrLoading && (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <div className="w-5 h-5 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
                      <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/60">
                        Generating QR…
                      </p>
                    </div>
                  )}
                  {qrError && (
                    <div className="flex flex-col items-center gap-3">
                      <p className="font-display text-[11px] text-red-400/80">{qrError}</p>
                      <button
                        onClick={() => {
                          setQrError('');
                          handleQRImport();
                        }}
                        className="py-2 px-5 border border-[#9cb092]/40 font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] hover:bg-[#9cb092]/10 transition-all flex items-center gap-2"
                      >
                        <span className="material-icons text-sm">refresh</span>
                        Try Again
                      </button>
                    </div>
                  )}
                  {qrSession && (
                    <div className="flex flex-col items-center">
                      <p className="font-serif-exp text-base text-[#e4eee1] italic mb-2">
                        Scan with your phone
                      </p>
                      <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/55 mb-4">
                        Open the QR → pick contacts → they appear here automatically
                      </p>
                      <img
                        src={`data:image/png;base64,${qrSession.qr_code_base64}`}
                        alt="QR Code"
                        className="w-44 h-44 mx-auto mb-4 border border-white/10"
                      />
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 border border-[#9cb092]/40 border-t-[#9cb092] rounded-full animate-spin" />
                        <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/50">
                          Waiting for contacts…
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Editable / review table */}
              {(activeMethod === 'manual' || importedCount > 0 || activeMethod === 'excel') && guestRows}
            </div>

            <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 md:px-8 py-4 border-t border-white/[0.06] bg-[#0e1712]">
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/55">
                {importedCount} added
              </p>
              <button
                onClick={closeSubPopup}
                className="py-2.5 px-6 bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3] font-display text-[10px] tracking-[0.22em] uppercase font-bold transition-colors flex items-center gap-2"
              >
                <span className="material-icons text-sm">check</span>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Small inline checkbox component — matches GuestDetails styling.
function EventCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="appearance-none w-[14px] h-[14px] border border-[#9cb092]/50 bg-white/[0.04] checked:bg-[#9cb092] checked:border-[#9cb092] relative cursor-pointer transition-colors
        checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-[#111914] checked:after:text-[10px] checked:after:font-bold checked:after:leading-none"
    />
  );
}
