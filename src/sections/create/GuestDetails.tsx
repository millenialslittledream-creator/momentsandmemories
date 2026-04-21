import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  // Sub-event indices this guest is invited to (stringified ints: ["0","2"]).
  // undefined = invited to ALL events (default).
  events?: string[];
}

interface GuestDetailsProps {
  guests: Guest[];
  onGuestsChange: (guests: Guest[]) => void;
  deliveryPreference: 'email' | 'phone' | 'both';
  onDeliveryPreferenceChange: (pref: 'email' | 'phone' | 'both') => void;
  formData: Record<string, string>;
}

let guestIdCounter = 0;

function createGuest(): Guest {
  return { id: `guest-${++guestIdCounter}`, name: '', email: '', phone: '' };
}

type GuestInputMethod = 'manual' | 'qr' | 'excel';

interface SubEvent {
  idx: number;
  name: string;
}

export default function GuestDetails({
  guests,
  onGuestsChange,
  deliveryPreference,
  onDeliveryPreferenceChange,
  formData,
}: GuestDetailsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef(guests);
  useEffect(() => { guestsRef.current = guests; }, [guests]);

  const [inputMethod, setInputMethod] = useState<GuestInputMethod | null>('manual');
  const [qrSession, setQrSession] = useState<{ token: string; qr_code_base64: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');

  // ── Sub-events derived from formData (set in step 2) ─────────────────────
  const subEventCount = parseInt(formData['sub_events_count'] || '0');
  const subEvents: SubEvent[] = Array.from({ length: subEventCount }, (_, i) => ({
    idx: i,
    name: formData[`sub_${i}_name`]?.trim() || `Event ${i + 1}`,
  }));
  const hasSubEvents = subEvents.length > 0;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headingRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
      gsap.fromTo('.guest-section', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (inputMethod) {
      gsap.fromTo('.method-panel', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    }
  }, [inputMethod]);

  // ── Guest row operations ─────────────────────────────────────────────────
  const addGuest = () => onGuestsChange([...guests, createGuest()]);

  const removeGuest = (id: string) => {
    if (guests.length <= 1) {
      // Last row — reset it rather than remove
      onGuestsChange([createGuest()]);
      return;
    }
    onGuestsChange(guests.filter((g) => g.id !== id));
  };

  const updateGuest = (id: string, field: keyof Guest, value: string) => {
    onGuestsChange(guests.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  // ── Event-checkbox helpers ───────────────────────────────────────────────
  const allEventKeys = () => subEvents.map((ev) => String(ev.idx));

  const isGuestInEvent = (g: Guest, idx: number) => {
    if (!g.events) return true; // undefined = all
    return g.events.includes(String(idx));
  };

  const toggleGuestEvent = (id: string, idx: number) => {
    const key = String(idx);
    onGuestsChange(guests.map((g) => {
      if (g.id !== id) return g;
      const current = g.events ?? allEventKeys();
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      return { ...g, events: next };
    }));
  };

  const allGuestsInEvent = (idx: number) => guests.every((g) => isGuestInEvent(g, idx));

  const toggleAllForEvent = (idx: number) => {
    const key = String(idx);
    const allOn = allGuestsInEvent(idx);
    onGuestsChange(guests.map((g) => {
      const current = g.events ?? allEventKeys();
      const next = allOn
        ? current.filter((k) => k !== key)
        : current.includes(key) ? current : [...current, key];
      return { ...g, events: next };
    }));
  };

  const allSelectedEverywhere = guests.every((g) =>
    subEvents.every((ev) => isGuestInEvent(g, ev.idx))
  );

  const toggleAllEverywhere = () => {
    onGuestsChange(guests.map((g) => ({
      ...g,
      events: allSelectedEverywhere ? [] : allEventKeys(),
    })));
  };

  const allEventsForGuest = (g: Guest) => subEvents.every((ev) => isGuestInEvent(g, ev.idx));

  const toggleAllEventsForGuest = (id: string) => {
    onGuestsChange(guests.map((g) => {
      if (g.id !== id) return g;
      return { ...g, events: allEventsForGuest(g) ? [] : allEventKeys() };
    }));
  };

  // ── Import handlers ──────────────────────────────────────────────────────
  const applyContacts = (contacts: Array<{ name: string; email?: string; phone?: string }>) => {
    const newGuests = contacts.map((c) => ({
      id: `guest-${++guestIdCounter}`,
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
    }));
    const existing = guestsRef.current.filter((g) => g.name.trim());
    onGuestsChange([...existing, ...newGuests]);
  };

  const handleQRImport = async () => {
    setQrError('');
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) {
      setQrError('You must be signed in to use QR import.');
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
        } catch { /* ignore poll errors */ }
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
      setQrError('Could not start QR session. Make sure you are signed in.');
    } finally {
      setQrLoading(false);
    }
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
      const newGuests: Guest[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(/[,\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols[0]) {
          newGuests.push({ id: `guest-${++guestIdCounter}`, name: cols[0] || '', email: cols[1] || '', phone: cols[2] || '' });
        }
      }
      if (newGuests.length > 0) {
        const existing = guests.filter((g) => g.name.trim());
        onGuestsChange([...existing, ...newGuests]);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePhoneContacts = async () => {
    try {
      if ('contacts' in navigator && (navigator as any).contacts) {
        const contacts = await (navigator as any).contacts.select(['name', 'email', 'tel'], { multiple: true });
        const newGuests: Guest[] = contacts.map((c: any) => ({
          id: `guest-${++guestIdCounter}`,
          name: c.name?.[0] || '',
          email: c.email?.[0] || '',
          phone: c.tel?.[0] || '',
        }));
        if (newGuests.length > 0) {
          const existing = guests.filter((g) => g.name.trim());
          onGuestsChange([...existing, ...newGuests]);
        }
      } else {
        alert('Contact picker is only available on Android Chrome. Please use the Excel upload or QR option.');
      }
    } catch { /* User cancelled */ }
  };

  // ── Render helpers ───────────────────────────────────────────────────────
  const showEmail = deliveryPreference === 'email' || deliveryPreference === 'both';
  const showPhone = deliveryPreference === 'phone' || deliveryPreference === 'both';

  const cellInputClass =
    'w-full bg-transparent border border-white/10 focus:border-[#9cb092] focus:bg-white/[0.04] outline-none px-2.5 py-1.5 text-[12px] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 transition-colors rounded-sm';

  const headerCellClass =
    'px-2 py-2.5 text-left font-display text-[9px] tracking-[0.15em] uppercase text-[#9cb092]/80 font-semibold';

  const Checkbox = ({
    checked,
    onChange,
    label,
    indeterminate = false,
  }: {
    checked: boolean;
    onChange: () => void;
    label?: string;
    indeterminate?: boolean;
  }) => (
    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        ref={(el) => { if (el) el.indeterminate = indeterminate; }}
        onChange={onChange}
        className="appearance-none w-[14px] h-[14px] border border-[#9cb092]/50 bg-white/[0.04] checked:bg-[#9cb092] checked:border-[#9cb092] relative cursor-pointer transition-colors
          checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-[#111914] checked:after:text-[10px] checked:after:font-bold checked:after:leading-none"
      />
      {label && <span className="text-[10px] font-display text-[#b2c3b1]/80">{label}</span>}
    </label>
  );

  // ── Unified Guest Table ──────────────────────────────────────────────────
  const GuestTable = () => (
    <div className="space-y-3">
      {hasSubEvents && (
        <div className="flex items-center justify-between flex-wrap gap-3 px-1 pb-2">
          <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/60">
            Tick events each guest should receive
          </p>
          <button
            onClick={toggleAllEverywhere}
            className="flex items-center gap-1.5 font-display text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 border border-[#9cb092]/30 hover:border-[#9cb092]/70 hover:bg-[#9cb092]/10 text-[#9cb092] transition-all"
          >
            <span className="material-icons text-xs">
              {allSelectedEverywhere ? 'deselect' : 'select_all'}
            </span>
            {allSelectedEverywhere ? 'Clear All' : 'Select All'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto border border-white/5 bg-white/[0.015]">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className={`${headerCellClass} w-10 text-center`}>#</th>
              <th className={`${headerCellClass} min-w-[140px]`}>Name</th>
              {showEmail && <th className={`${headerCellClass} min-w-[180px]`}>Email</th>}
              {showPhone && <th className={`${headerCellClass} min-w-[140px]`}>Phone</th>}
              {hasSubEvents && (
                <th className={`${headerCellClass} text-center w-14`}>
                  <div className="flex flex-col items-center gap-1">
                    <span>All</span>
                  </div>
                </th>
              )}
              {hasSubEvents && subEvents.map((ev) => (
                <th key={ev.idx} className={`${headerCellClass} text-center min-w-[90px]`}>
                  <div className="flex flex-col items-center gap-1">
                    <span className="truncate max-w-[120px]" title={ev.name}>{ev.name}</span>
                    <Checkbox
                      checked={allGuestsInEvent(ev.idx)}
                      onChange={() => toggleAllForEvent(ev.idx)}
                    />
                  </div>
                </th>
              ))}
              <th className={`${headerCellClass} w-10`} />
            </tr>
          </thead>
          <tbody>
            {guests.map((guest, index) => (
              <tr
                key={guest.id}
                className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-2 py-2 text-center font-display text-[10px] text-[#9cb092]/60">
                  {index + 1}
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={guest.name}
                    onChange={(e) => updateGuest(guest.id, 'name', e.target.value)}
                    placeholder="Guest name"
                    className={cellInputClass}
                  />
                </td>
                {showEmail && (
                  <td className="px-2 py-2">
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
                  <td className="px-2 py-2">
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
                  <td className="px-2 py-2 text-center">
                    <Checkbox
                      checked={allEventsForGuest(guest)}
                      onChange={() => toggleAllEventsForGuest(guest.id)}
                    />
                  </td>
                )}
                {hasSubEvents && subEvents.map((ev) => (
                  <td key={ev.idx} className="px-2 py-2 text-center">
                    <Checkbox
                      checked={isGuestInEvent(guest, ev.idx)}
                      onChange={() => toggleGuestEvent(guest.id, ev.idx)}
                    />
                  </td>
                ))}
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => removeGuest(guest.id)}
                    className="text-[#b2c3b1]/30 hover:text-red-400/80 transition-colors"
                    title="Remove row"
                  >
                    <span className="material-icons text-sm">close</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          onClick={addGuest}
          className="py-3 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
        >
          <span className="material-icons text-sm">add</span>
          Add Row
        </button>
        <button
          onClick={handlePhoneContacts}
          className="py-3 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
        >
          <span className="material-icons text-sm">contacts</span>
          Import from Phone
        </button>
      </div>
    </div>
  );

  const prefOptions: { value: 'email' | 'phone' | 'both'; label: string; icon: string }[] = [
    { value: 'email', label: 'Email', icon: 'email' },
    { value: 'phone', label: 'Phone / SMS', icon: 'smartphone' },
    { value: 'both', label: 'Both', icon: 'mark_email_read' },
  ];

  const methodOptions: { value: GuestInputMethod; label: string; icon: string; description: string }[] = [
    { value: 'manual', label: 'Add Guests Manually', icon: 'edit_note', description: 'Type guest names, emails, and phone numbers into the table' },
    { value: 'qr', label: 'Upload from Mobile', icon: 'qr_code_2', description: 'Scan a QR code with your phone to import contacts' },
    { value: 'excel', label: 'Upload Excel File', icon: 'upload_file', description: 'Import guests from a .csv or .xlsx spreadsheet' },
  ];

  const importedCount = guests.filter((g) => g.name.trim()).length;

  return (
    <div ref={containerRef}>
      {/* Heading */}
      <div ref={headingRef} className="flex flex-col items-center mb-6 mt-0">
        <h1 className="text-2xl md:text-4xl font-serif-exp text-center mb-2 relative z-10">
          Who's on the <br />
          <span className="text-[#9cb092] font-agatho">guest list?</span>
        </h1>
        <div className="w-[1px] h-4 bg-[#9cb092]/40 mt-2" />
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Delivery Preference */}
        <div className="guest-section glass-panel rounded-none p-8">
          <h3 className="font-serif-exp text-lg text-[#e4eee1] mb-6 pb-3 border-b border-white/10 flex items-center gap-3">
            <span className="material-icons text-[#9cb092] text-lg">send</span>
            How should we deliver the evite?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {prefOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onDeliveryPreferenceChange(opt.value)}
                className={`group relative overflow-hidden text-center py-5 px-4 border transition-all duration-300 ${
                  deliveryPreference === opt.value
                    ? 'border-[#9cb092] bg-[#9cb092]/10 shadow-lg shadow-[#9cb092]/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                }`}
              >
                <span className={`material-icons text-2xl mb-2 block transition-colors ${deliveryPreference === opt.value ? 'text-[#9cb092]' : 'text-[#b2c3b1]/50'}`}>
                  {opt.icon}
                </span>
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#e4eee1]">{opt.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Guest Input Method Selector */}
        <div className="guest-section glass-panel rounded-none p-8">
          <h3 className="font-serif-exp text-lg text-[#e4eee1] mb-6 pb-3 border-b border-white/10 flex items-center gap-3">
            <span className="material-icons text-[#9cb092] text-lg">group_add</span>
            How would you like to provide the guest list?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {methodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  if (opt.value === 'qr') {
                    setInputMethod('qr');
                    handleQRImport();
                  } else {
                    setInputMethod(inputMethod === opt.value ? null : opt.value);
                  }
                }}
                className={`group relative overflow-hidden text-left p-5 border transition-all duration-300 ${
                  inputMethod === opt.value
                    ? 'border-[#9cb092] bg-[#9cb092]/10 shadow-lg shadow-[#9cb092]/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                }`}
              >
                <span className={`material-icons text-2xl mb-3 block transition-colors ${inputMethod === opt.value ? 'text-[#9cb092]' : 'text-[#b2c3b1]/50'}`}>
                  {opt.icon}
                </span>
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#e4eee1] mb-1">{opt.label}</p>
                <p className="font-display text-[9px] tracking-wide text-[#b2c3b1]/50 leading-relaxed">{opt.description}</p>
                {inputMethod === opt.value && (
                  <span className="absolute top-3 right-3 material-icons text-[#9cb092] text-base">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Import intro for QR ── */}
        {inputMethod === 'qr' && (qrLoading || qrError) && (
          <div className="method-panel glass-panel rounded-none p-6">
            {qrLoading ? (
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/60">Generating QR code…</p>
              </div>
            ) : qrError ? (
              <div className="flex items-center justify-between gap-4">
                <p className="font-display text-xs text-red-400/80">{qrError}</p>
                <button
                  onClick={() => { setQrError(''); handleQRImport(); }}
                  className="py-2 px-5 border border-[#9cb092]/40 font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] hover:bg-[#9cb092]/10 transition-all flex items-center gap-2"
                >
                  <span className="material-icons text-sm">refresh</span>
                  Try Again
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Import intro for Excel ── */}
        {inputMethod === 'excel' && (
          <div className="method-panel glass-panel rounded-none p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="flex-1 w-full py-6 border-2 border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all flex items-center justify-center gap-3 cursor-pointer">
                <span className="material-icons text-[#9cb092]/70 text-2xl">upload_file</span>
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]">Choose .csv or .xlsx file</span>
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleCsvUpload} />
              </label>
              <p className="font-display text-[9px] text-[#b2c3b1]/50 leading-relaxed max-w-[240px]">
                Format: Name, Email, Phone (one per row). Header row is optional — imported rows join the table below.
              </p>
            </div>
          </div>
        )}

        {/* ── Unified Editable Guest Table ── */}
        {inputMethod && (
          <div className="method-panel glass-panel rounded-none p-6 md:p-8">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10 flex-wrap gap-3">
              <h3 className="font-serif-exp text-lg text-[#e4eee1] flex items-center gap-3">
                <span className="material-icons text-[#9cb092] text-lg">group</span>
                Guest List
              </h3>
              <span className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/50">
                {importedCount} of {guests.length} {guests.length === 1 ? 'row' : 'rows'} filled
              </span>
            </div>
            <GuestTable />
          </div>
        )}
      </div>

      {/* QR scan modal */}
      {qrSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a2418] border border-[#9cb092]/30 p-8 max-w-sm w-full text-center">
            <h3 className="font-serif-exp text-lg text-[#e4eee1] italic mb-2">Scan with Phone</h3>
            <p className="font-display text-[10px] tracking-[0.15em] text-[#b2c3b1]/60 uppercase mb-6">
              Open this QR on your phone → pick contacts → they appear here automatically
            </p>
            <img src={`data:image/png;base64,${qrSession.qr_code_base64}`} alt="QR Code" className="w-48 h-48 mx-auto mb-6 border border-white/10" />
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 border border-[#9cb092]/40 border-t-[#9cb092] rounded-full animate-spin" />
              <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/50">Waiting for contacts…</p>
            </div>
            {qrError && <p className="text-red-400 text-xs mb-4">{qrError}</p>}
            <button onClick={() => setQrSession(null)} className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 hover:text-[#9cb092] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { createGuest };
