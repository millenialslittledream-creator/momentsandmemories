import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface GuestDetailsProps {
  guests: Guest[];
  onGuestsChange: (guests: Guest[]) => void;
  deliveryPreference: 'email' | 'phone' | 'both';
  onDeliveryPreferenceChange: (pref: 'email' | 'phone' | 'both') => void;
}

let guestIdCounter = 0;

function createGuest(): Guest {
  return { id: `guest-${++guestIdCounter}`, name: '', email: '', phone: '' };
}

type GuestInputMethod = 'manual' | 'qr' | 'excel';

export default function GuestDetails({
  guests,
  onGuestsChange,
  deliveryPreference,
  onDeliveryPreferenceChange,
}: GuestDetailsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  // Always tracks the latest guests so async QR callbacks never use stale data
  const guestsRef = useRef(guests);
  useEffect(() => { guestsRef.current = guests; }, [guests]);

  const [inputMethod, setInputMethod] = useState<GuestInputMethod | null>(null);
  const [qrSession, setQrSession] = useState<{ token: string; qr_code_base64: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');

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

  const addGuest = () => onGuestsChange([...guests, createGuest()]);

  const removeGuest = (id: string) => {
    if (guests.length <= 1) return;
    onGuestsChange(guests.filter((g) => g.id !== id));
  };

  const applyContacts = (contacts: Array<{ name: string; email?: string; phone?: string }>) => {
    const newGuests = contacts.map((c) => ({
      id: `guest-${++guestIdCounter}`,
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
    }));
    // Use guestsRef so we always merge against the current list, not the closed-over snapshot
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

      // Poll every 2s as fallback when Realtime WebSocket is unavailable
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

  const updateGuest = (id: string, field: keyof Guest, value: string) => {
    onGuestsChange(guests.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
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

  const inputClass =
    'bg-white/[0.06] backdrop-blur-sm border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30';

  const prefOptions: { value: 'email' | 'phone' | 'both'; label: string; icon: string }[] = [
    { value: 'email', label: 'Email', icon: 'email' },
    { value: 'phone', label: 'Phone / SMS', icon: 'smartphone' },
    { value: 'both', label: 'Both', icon: 'mark_email_read' },
  ];

  const methodOptions: { value: GuestInputMethod; label: string; icon: string; description: string }[] = [
    { value: 'manual', label: 'Add Guests Manually', icon: 'edit_note', description: 'Type guest names, emails, and phone numbers one by one' },
    { value: 'qr', label: 'Upload from Mobile', icon: 'qr_code_2', description: 'Scan a QR code with your phone to import contacts' },
    { value: 'excel', label: 'Upload Excel File', icon: 'upload_file', description: 'Import guests from a .csv or .xlsx spreadsheet' },
  ];

  const importedGuests = guests.filter((g) => g.name.trim());

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

      <div className="max-w-2xl mx-auto space-y-6">
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
                    // Always trigger QR immediately — re-clicking re-starts a new scan
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
                <p className="font-display text-[9px] text-[#b2c3b1]/50 leading-relaxed">{opt.description}</p>
                {inputMethod === opt.value && (
                  <span className="absolute top-3 right-3 material-icons text-[#9cb092] text-base">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Method Panel: Manual Entry ── */}
        {inputMethod === 'manual' && (
          <div className="method-panel glass-panel rounded-none p-8">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
              <h3 className="font-serif-exp text-lg text-[#e4eee1] flex items-center gap-3">
                <span className="material-icons text-[#9cb092] text-lg">group</span>
                Guest List
              </h3>
              <span className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/50">
                {guests.length} {guests.length === 1 ? 'guest' : 'guests'}
              </span>
            </div>

            <div className="space-y-6">
              {guests.map((guest, index) => (
                <div key={guest.id} className="relative p-5 border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092]">Guest {index + 1}</span>
                    {guests.length > 1 && (
                      <button onClick={() => removeGuest(guest.id)} className="text-[#b2c3b1]/30 hover:text-red-400/70 transition-colors">
                        <span className="material-icons text-sm">close</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                        Name <span className="text-[#9cb092]">*</span>
                      </Label>
                      <Input type="text" value={guest.name} onChange={(e) => updateGuest(guest.id, 'name', e.target.value)} placeholder="Guest name" className={inputClass} />
                    </div>
                    {(deliveryPreference === 'email' || deliveryPreference === 'both') && (
                      <div className="space-y-1.5">
                        <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                          Email <span className="text-[#9cb092]">*</span>
                        </Label>
                        <Input type="email" value={guest.email} onChange={(e) => updateGuest(guest.id, 'email', e.target.value)} placeholder="guest@email.com" className={inputClass} />
                      </div>
                    )}
                    {(deliveryPreference === 'phone' || deliveryPreference === 'both') && (
                      <div className="space-y-1.5">
                        <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                          Phone <span className="text-[#9cb092]">*</span>
                        </Label>
                        <Input type="tel" value={guest.phone} onChange={(e) => updateGuest(guest.id, 'phone', e.target.value)} placeholder="+1 (555) 000-0000" className={inputClass} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={addGuest}
                className="py-3 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
              >
                <span className="material-icons text-sm">add</span>
                Add Guest
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
        )}

        {/* ── Method Panel: QR Code ── */}
        {inputMethod === 'qr' && (
          <div className="method-panel glass-panel rounded-none p-8">
            <h3 className="font-serif-exp text-lg text-[#e4eee1] mb-6 pb-3 border-b border-white/10 flex items-center gap-3">
              <span className="material-icons text-[#9cb092] text-lg">qr_code_2</span>
              Import from Phone
            </h3>

            {qrLoading ? (
              <div className="flex flex-col items-center gap-4 py-10">
                <div className="w-8 h-8 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/60">Generating QR code…</p>
              </div>
            ) : qrError ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <p className="font-display text-xs text-red-400/80">{qrError}</p>
                <button
                  onClick={() => { setQrError(''); handleQRImport(); }}
                  className="py-2 px-6 border border-[#9cb092]/40 font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] hover:bg-[#9cb092]/10 transition-all flex items-center gap-2"
                >
                  <span className="material-icons text-sm">refresh</span>
                  Try Again
                </button>
              </div>
            ) : importedGuests.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#9cb092]">
                    {importedGuests.length} contact{importedGuests.length !== 1 ? 's' : ''} imported
                  </p>
                  <button
                    onClick={() => { setQrError(''); handleQRImport(); }}
                    className="flex items-center gap-1 font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/50 hover:text-[#9cb092] transition-colors"
                  >
                    <span className="material-icons text-xs">add</span>
                    Scan More
                  </button>
                </div>
                <div className="space-y-2">
                  {importedGuests.map((guest, index) => (
                    <div key={guest.id} className="flex items-center justify-between px-4 py-2.5 border border-white/5 bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                        <span className="font-display text-[9px] tracking-widest text-[#9cb092]/60 w-5 text-right">{index + 1}</span>
                        <div>
                          <p className="font-display text-xs text-[#e4eee1]">{guest.name}</p>
                          {guest.email && <p className="font-display text-[9px] text-[#b2c3b1]/50">{guest.email}</p>}
                          {guest.phone && <p className="font-display text-[9px] text-[#b2c3b1]/50">{guest.phone}</p>}
                        </div>
                      </div>
                      {importedGuests.length > 1 && (
                        <button onClick={() => removeGuest(guest.id)} className="text-[#b2c3b1]/30 hover:text-red-400/70 transition-colors ml-4">
                          <span className="material-icons text-sm">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="w-6 h-6 border-2 border-[#9cb092]/20 border-t-[#9cb092]/60 rounded-full animate-spin" />
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/40">Opening scanner…</p>
              </div>
            )}
          </div>
        )}

        {/* ── Method Panel: Excel / CSV Upload ── */}
        {inputMethod === 'excel' && (
          <div className="method-panel glass-panel rounded-none p-8">
            <h3 className="font-serif-exp text-lg text-[#e4eee1] mb-6 pb-3 border-b border-white/10 flex items-center gap-3">
              <span className="material-icons text-[#9cb092] text-lg">table_chart</span>
              Upload Guest Spreadsheet
            </h3>
            <div className="flex flex-col items-center gap-6 py-4">
              <label className="w-full max-w-sm py-10 border-2 border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer">
                <span className="material-icons text-[#9cb092]/70 text-4xl">upload_file</span>
                <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]">Choose .csv or .xlsx file</span>
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleCsvUpload} />
              </label>
              <p className="font-display text-[9px] text-[#b2c3b1]/40 leading-relaxed text-center max-w-sm">
                CSV/Excel format: Name, Email, Phone (one guest per row). Header row is optional.
              </p>
              {importedGuests.length > 0 && (
                <div className="w-full mt-2">
                  <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#9cb092] mb-3">
                    {importedGuests.length} guest{importedGuests.length === 1 ? '' : 's'} imported
                  </p>
                  <div className="space-y-2">
                    {importedGuests.map((guest, index) => (
                      <div key={guest.id} className="flex items-center justify-between px-4 py-2.5 border border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <span className="font-display text-[9px] tracking-widest text-[#9cb092]/60 w-5 text-right">{index + 1}</span>
                          <div>
                            <p className="font-display text-xs text-[#e4eee1]">{guest.name}</p>
                            {guest.email && <p className="font-display text-[9px] text-[#b2c3b1]/50">{guest.email}</p>}
                            {guest.phone && <p className="font-display text-[9px] text-[#b2c3b1]/50">{guest.phone}</p>}
                          </div>
                        </div>
                        {importedGuests.length > 1 && (
                          <button onClick={() => removeGuest(guest.id)} className="text-[#b2c3b1]/30 hover:text-red-400/70 transition-colors ml-4">
                            <span className="material-icons text-sm">close</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
