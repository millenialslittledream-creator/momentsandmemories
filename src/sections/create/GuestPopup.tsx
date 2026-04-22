import { useEffect, useRef, useState } from 'react';
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
  onProceed: () => void;
}

type ImportMethod = 'manual' | 'csv' | 'phone' | 'qr' | '';

let guestIdCounter = Date.now();

export default function GuestPopup({
  guests,
  onGuestsChange,
  deliveryPreference,
  onDeliveryPreferenceChange,
  onBack,
  onProceed,
}: GuestPopupProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [importMethod, setImportMethod] = useState<ImportMethod>('manual');
  const [qrSession, setQrSession] = useState<{ token: string; qr_code_base64: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');

  // Animate in
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

  // ── Guest operations ────────────────────────────────────────────────
  const addGuest = () => onGuestsChange([...guests, createGuest()]);

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

  // ── Import: CSV ─────────────────────────────────────────────────────
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
          newGuests.push({
            id: `guest-csv-${++guestIdCounter}`,
            name: cols[0] || '',
            email: cols[1] || '',
            phone: cols[2] || '',
          });
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

  // ── Import: Phone contacts ──────────────────────────────────────────
  const handlePhoneContacts = async () => {
    try {
      if ('contacts' in navigator && (navigator as any).contacts) {
        const contacts = await (navigator as any).contacts.select(
          ['name', 'email', 'tel'],
          { multiple: true }
        );
        const newGuests: Guest[] = contacts.map((c: any) => ({
          id: `guest-phone-${++guestIdCounter}`,
          name: c.name?.[0] || '',
          email: c.email?.[0] || '',
          phone: c.tel?.[0] || '',
        }));
        if (newGuests.length > 0) {
          const existing = guests.filter((g) => g.name.trim());
          onGuestsChange([...existing, ...newGuests]);
        }
      } else {
        alert(
          'Contact picker is only available on Android Chrome. Please use CSV upload or QR option.'
        );
      }
    } catch {
      /* cancelled */
    }
  };

  // ── Import: QR ──────────────────────────────────────────────────────
  const handleQRImport = async () => {
    setQrError('');
    const { data: { session: authSession } } = await supabase.auth.getSession();
    if (!authSession) {
      setQrError('QR import requires sign-in. Use manual entry, CSV, or phone contacts instead.');
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
        const newGuests: Guest[] = contacts.map((c) => ({
          id: `guest-qr-${++guestIdCounter}`,
          name: c.name || '',
          email: c.email || '',
          phone: c.phone || '',
        }));
        const existing = guests.filter((g) => g.name.trim());
        onGuestsChange([...existing, ...newGuests]);
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

  const importOptions: { value: ImportMethod; label: string; icon: string }[] = [
    { value: 'manual', label: 'Add manually', icon: 'edit_note' },
    { value: 'csv', label: 'Upload .csv or .xlsx', icon: 'upload_file' },
    { value: 'phone', label: 'Import from phone contacts', icon: 'contacts' },
    { value: 'qr', label: 'Scan QR code from phone', icon: 'qr_code_2' },
  ];

  const selectClass =
    'bg-white/[0.06] border border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display text-sm outline-none transition-colors w-full px-3 py-2 rounded-sm appearance-none cursor-pointer pr-8';

  const importedCount = guests.filter((g) => g.name.trim()).length;

  const handleMethodChange = (method: ImportMethod) => {
    setImportMethod(method);
    if (method === 'qr') handleQRImport();
  };

  const handleProceed = () => {
    if (importedCount === 0) return;
    onProceed();
  };

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
        className="relative w-full max-w-5xl h-full max-h-[88vh] flex flex-col bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onBack}
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
        </div>

        {/* Body: left table | right dropdown */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* ── LEFT — Guest table ─────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-white/[0.06]">
            <div className="flex-shrink-0 flex items-center justify-between px-6 md:px-8 py-3 border-b border-white/[0.04]">
              <h3 className="font-display text-[10px] tracking-[0.22em] uppercase text-[#b2c3b1] flex items-center gap-2">
                <span className="material-icons text-[#9cb092] text-[16px]">group</span>
                Guest List
              </h3>
              <span className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/50">
                {importedCount} added
              </span>
            </div>

            <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-4 md:px-6 py-4">
              <div className="border border-white/5 bg-white/[0.015] overflow-x-auto">
                <table className="w-full border-collapse min-w-[420px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03]">
                      <th className={`${headerCellClass} w-8 text-center`}>#</th>
                      <th className={`${headerCellClass} min-w-[120px]`}>Name</th>
                      {showEmail && (
                        <th className={`${headerCellClass} min-w-[160px]`}>Email</th>
                      )}
                      {showPhone && (
                        <th className={`${headerCellClass} min-w-[120px]`}>Phone</th>
                      )}
                      <th className={`${headerCellClass} w-8`} />
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
                        <td className="px-1 py-1.5 text-center">
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

              <button
                onClick={addGuest}
                className="w-full mt-3 py-2.5 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
              >
                <span className="material-icons text-sm">add</span>
                Add Row
              </button>
            </div>
          </div>

          {/* ── RIGHT — Dropdown options ────────────────────────── */}
          <div data-lenis-prevent className="w-full md:w-[36%] md:min-w-[260px] md:max-w-[360px] flex-shrink-0 flex flex-col overflow-y-auto scrollbar-subtle bg-white/[0.015]">
            <div className="px-6 md:px-7 py-6 space-y-6">
              {/* Delivery preference */}
              <div>
                <label className="block font-display text-[9px] tracking-[0.22em] uppercase text-[#b2c3b1] mb-2">
                  Delivery Method
                </label>
                <div className="relative">
                  <select
                    value={deliveryPreference}
                    onChange={(e) =>
                      onDeliveryPreferenceChange(
                        e.target.value as 'email' | 'phone' | 'both'
                      )
                    }
                    className={selectClass}
                  >
                    <option value="email" className="bg-[#1a2418]">
                      Email
                    </option>
                    <option value="phone" className="bg-[#1a2418]">
                      Phone / SMS
                    </option>
                    <option value="both" className="bg-[#1a2418]">
                      Both
                    </option>
                  </select>
                  <span
                    className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[#9cb092] pointer-events-none"
                    style={{ fontSize: '16px' }}
                  >
                    expand_more
                  </span>
                </div>
                <p className="font-display text-[9px] text-[#b2c3b1]/45 mt-1.5 leading-relaxed">
                  Choose how guests receive the evite
                </p>
              </div>

              {/* Add guests dropdown */}
              <div>
                <label className="block font-display text-[9px] tracking-[0.22em] uppercase text-[#b2c3b1] mb-2">
                  Add Guests
                </label>
                <div className="relative">
                  <select
                    value={importMethod}
                    onChange={(e) => handleMethodChange(e.target.value as ImportMethod)}
                    className={selectClass}
                  >
                    {importOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#1a2418]">
                        {opt.label}
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
                <p className="font-display text-[9px] text-[#b2c3b1]/45 mt-1.5 leading-relaxed">
                  Choose a method to populate your list
                </p>
              </div>

              {/* Action panel based on selected method */}
              <div className="pt-2 border-t border-white/[0.06]">
                {importMethod === 'manual' && (
                  <div className="flex items-start gap-2 text-[#b2c3b1]/60">
                    <span className="material-icons text-[#9cb092]/60 text-base mt-0.5">
                      info
                    </span>
                    <p className="font-display text-[10px] leading-relaxed">
                      Use the table on the left to add, edit, or remove guests manually.
                    </p>
                  </div>
                )}

                {importMethod === 'csv' && (
                  <label className="w-full py-5 border-2 border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer">
                    <span className="material-icons text-[#9cb092]/70 text-2xl">
                      upload_file
                    </span>
                    <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] text-center px-3">
                      Choose .csv or .xlsx
                    </span>
                    <span className="font-display text-[8px] text-[#b2c3b1]/45 text-center px-3 leading-relaxed">
                      Format: Name, Email, Phone
                    </span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={handleCsvUpload}
                    />
                  </label>
                )}

                {importMethod === 'phone' && (
                  <button
                    onClick={handlePhoneContacts}
                    className="w-full py-5 border border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <span className="material-icons text-[#9cb092]/70 text-2xl">contacts</span>
                    <span className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]">
                      Open Contacts
                    </span>
                    <span className="font-display text-[8px] text-[#b2c3b1]/45 text-center px-3 leading-relaxed">
                      Android Chrome only
                    </span>
                  </button>
                )}

                {importMethod === 'qr' && (
                  <div className="space-y-3">
                    {qrLoading && (
                      <div className="flex items-center justify-center gap-2 py-6">
                        <div className="w-4 h-4 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
                        <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/60">
                          Generating QR…
                        </p>
                      </div>
                    )}
                    {qrError && (
                      <div className="flex items-start gap-2">
                        <span className="material-icons text-red-400/70 text-base mt-0.5">
                          error_outline
                        </span>
                        <p className="font-display text-[10px] text-red-400/80 leading-relaxed">
                          {qrError}
                        </p>
                      </div>
                    )}
                    {!qrLoading && !qrError && !qrSession && (
                      <button
                        onClick={handleQRImport}
                        className="w-full py-3 border border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]"
                      >
                        Generate QR
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
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

      {/* QR scan modal */}
      {qrSession && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1a2418] border border-[#9cb092]/30 p-8 max-w-sm w-full text-center">
            <h3 className="font-serif-exp text-lg text-[#e4eee1] italic mb-2">Scan with Phone</h3>
            <p className="font-display text-[10px] tracking-[0.15em] text-[#b2c3b1]/60 uppercase mb-6">
              Open this QR on your phone → pick contacts → they appear here automatically
            </p>
            <img
              src={`data:image/png;base64,${qrSession.qr_code_base64}`}
              alt="QR Code"
              className="w-48 h-48 mx-auto mb-6 border border-white/10"
            />
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 border border-[#9cb092]/40 border-t-[#9cb092] rounded-full animate-spin" />
              <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/50">
                Waiting for contacts…
              </p>
            </div>
            <button
              onClick={() => setQrSession(null)}
              className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 hover:text-[#9cb092] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
