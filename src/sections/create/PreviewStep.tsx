import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import FlowStepper from './FlowStepper';
import TemplateRenderer, { type PhotoOverlay } from '@/components/TemplateRenderer';
import { eventTypes, type EventType } from '@/data/eventFields';
import type { EviteTemplate, TemplateFieldLayout } from '@/data/eviteTemplates';
import type { Guest } from './GuestDetails';

export interface InvitationSetPreview {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
}

// What guests are asked to provide when they RSVP. Held in the create-flow
// state and shown/edited on the Preview step.
export interface RSVPSettings {
  enabled: boolean;
  responseOptions: { yes: boolean; no: boolean; maybe: boolean };
  collectGuestCount: boolean;
  collectKidsCount: boolean;
  collectFoodPreference: boolean;
  foodOptions: string[];
  collectAdditionalInfo: boolean;
}

export const ALL_FOOD_OPTIONS = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Kids Meal'];

export const DEFAULT_RSVP_SETTINGS: RSVPSettings = {
  enabled: true,
  responseOptions: { yes: true, no: true, maybe: true },
  collectGuestCount: true,
  collectKidsCount: true,
  collectFoodPreference: true,
  foodOptions: [...ALL_FOOD_OPTIONS],
  collectAdditionalInfo: true,
};

interface PreviewStepProps {
  eventType: EventType | null;
  selectedTemplate: EviteTemplate | null;
  uploadedTemplate: { url: string; type: 'image' | 'video'; fileName?: string } | null;
  invitationSets?: InvitationSetPreview[];
  guests?: Guest[];
  formData: Record<string, string>;
  deliveryPreference: 'email' | 'phone' | 'both' | 'link';
  guestCount: number;
  templateOverrides?: Record<string, Partial<TemplateFieldLayout>>;
  templatePhotoOverlay?: PhotoOverlay | null;
  rsvpSettings: RSVPSettings;
  onRsvpSettingsChange: (settings: RSVPSettings) => void;
  onBack: () => void;
  onClose?: () => void;
  onProceed: () => void;
}

interface SubEventInfo {
  idx: number;
  name: string;
  date: string;
  time: string;
  venue: string;
}

export default function PreviewStep({
  eventType,
  selectedTemplate,
  uploadedTemplate,
  invitationSets,
  guests,
  formData,
  deliveryPreference,
  guestCount,
  templateOverrides,
  templatePhotoOverlay,
  rsvpSettings,
  onRsvpSettingsChange,
  onBack,
  onClose,
  onProceed,
}: PreviewStepProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [rsvpEditing, setRsvpEditing] = useState(false);

  const isMulti = (invitationSets?.length ?? 0) >= 2;
  const guestList = guests ?? [];

  // ── Invitation versions shown in the left rail ──────────────────────
  const guestsBySet = useMemo(() => {
    const m = new Map<string, number>();
    if (!isMulti || !invitationSets) return m;
    const defaultSetId = invitationSets[0].id;
    for (const s of invitationSets) m.set(s.id, 0);
    for (const g of guestList.filter((x) => x.name.trim())) {
      const sid = g.invitationSetId ?? defaultSetId;
      m.set(sid, (m.get(sid) ?? 0) + 1);
    }
    return m;
  }, [isMulti, invitationSets, guestList]);

  type Version = { id: string; name: string; count: number } & (
    | { kind: 'uploaded'; url: string; type: 'image' | 'video' }
    | { kind: 'template' }
  );

  const versions: Version[] = useMemo(() => {
    if (isMulti && invitationSets) {
      return invitationSets.map((s) => ({
        id: s.id,
        name: s.name,
        count: guestsBySet.get(s.id) ?? 0,
        kind: 'uploaded' as const,
        url: s.url,
        type: s.type,
      }));
    }
    if (uploadedTemplate) {
      return [
        {
          id: 'single',
          name: 'Main Invitation',
          count: guestCount,
          kind: 'uploaded' as const,
          url: uploadedTemplate.url,
          type: uploadedTemplate.type,
        },
      ];
    }
    return [{ id: 'single', name: 'Main Invitation', count: guestCount, kind: 'template' as const }];
  }, [isMulti, invitationSets, guestsBySet, uploadedTemplate, guestCount]);

  const [selectedId, setSelectedId] = useState(versions[0]?.id ?? 'single');
  const selectedVersion = versions.find((v) => v.id === selectedId) ?? versions[0];

  // ── Events in this invitation (sub-events from the editor) ──────────
  const subEvents: SubEventInfo[] = useMemo(() => {
    const count = parseInt(formData['sub_events_count'] || '0', 10) || 0;
    return Array.from({ length: count }, (_, i) => ({
      idx: i,
      name: formData[`sub_${i}_name`]?.trim() || `Event ${i + 1}`,
      date: formData[`sub_${i}_date`] || '',
      time: formData[`sub_${i}_time`] || '',
      venue: formData[`sub_${i}_venue`] || '',
    }));
  }, [formData]);

  useEffect(() => {
    if (backdropRef.current && panelRef.current) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' });
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.96, y: 24 },
        { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'power3.out' }
      );
    }
  }, []);

  const eventInfo = eventType ? eventTypes.find((e) => e.id === eventType) : null;

  const displayName =
    formData.celebrantName ||
    formData.eventName ||
    formData.brideName ||
    formData.parentNames ||
    formData.homeownerName ||
    formData.hostName ||
    '';

  const eventTitle =
    eventInfo?.label === 'Wedding'
      ? `${formData.brideName || 'Bride'} & ${formData.groomName || 'Groom'}`
      : eventType === 'custom'
      ? formData.eventName || displayName || 'Your Event'
      : displayName
      ? `${displayName}'s ${eventInfo?.label ?? ''}`
      : eventInfo?.label ?? 'Your Event';

  const fmtDate = (iso: string) =>
    iso
      ? new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

  const displayDate = fmtDate(formData.eventDate || '');
  const customMessage = formData.customMessage?.trim() || '';

  const deliveryOptions = [
    { key: 'email', label: 'Email', icon: 'mail' },
    { key: 'phone', label: 'SMS', icon: 'sms' },
    { key: 'both', label: 'Email + SMS', icon: 'mark_email_read' },
    { key: 'link', label: 'Shareable Link', icon: 'link' },
  ] as const;

  const totalGuests = guestList.filter((g) => g.name.trim()).length || guestCount;
  const totalEvents = subEvents.length || 1;

  // ── RSVP settings helpers ───────────────────────────────────────────
  const patchRsvp = (patch: Partial<RSVPSettings>) => onRsvpSettingsChange({ ...rsvpSettings, ...patch });
  const toggleFoodOption = (opt: string) => {
    const has = rsvpSettings.foodOptions.includes(opt);
    patchRsvp({
      foodOptions: has ? rsvpSettings.foodOptions.filter((o) => o !== opt) : [...rsvpSettings.foodOptions, opt],
    });
  };
  const rsvpSummary = (() => {
    const ro = rsvpSettings.responseOptions;
    const parts: string[] = [];
    const roList = [ro.yes && 'Yes', ro.no && 'No', ro.maybe && 'Maybe'].filter(Boolean).join(' / ');
    if (roList) parts.push(roList);
    if (rsvpSettings.collectGuestCount) parts.push('Guest count');
    if (rsvpSettings.collectKidsCount) parts.push('Kids count');
    if (rsvpSettings.collectFoodPreference) parts.push('Food preference');
    if (rsvpSettings.collectAdditionalInfo) parts.push('Notes to host');
    return parts.join(' · ') || 'No fields selected';
  })();

  // ── Render the invitation artwork for the selected version ──────────
  const renderCard = () => {
    if (selectedVersion?.kind === 'uploaded') {
      return selectedVersion.type === 'image' ? (
        <img src={selectedVersion.url} alt="Invitation" className="w-full h-full object-cover" />
      ) : (
        <video src={selectedVersion.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
      );
    }
    if (selectedTemplate?.layout) {
      return (
        <TemplateRenderer
          template={selectedTemplate}
          formData={formData}
          overrides={templateOverrides}
          photoOverlay={templatePhotoOverlay}
        />
      );
    }
    if (selectedTemplate) {
      return (
        <div className="relative w-full h-full">
          <img src={selectedTemplate.previewImage} alt={selectedTemplate.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4">
            <p className="font-display text-[8px] tracking-[0.25em] uppercase text-white/55 mb-1">You're invited to</p>
            <h4 className="font-serif-exp text-lg text-white leading-tight">{eventTitle}</h4>
            {displayDate && <p className="font-display text-[9px] text-white/75 mt-1">{displayDate}</p>}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onBack();
      }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-6xl h-[92vh] max-h-[92vh] flex flex-col bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
          >
            <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
          </button>
        )}

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-6 md:px-8 py-3 border-b border-white/[0.06] bg-[#0e1712]">
          <FlowStepper current={5} className="max-w-2xl mx-auto mb-3" />
          <div className="pr-10">
            <h2 className="font-serif-exp text-lg md:text-xl text-[#e4eee1] leading-tight">
              Preview &amp; <span className="text-[#9cb092] font-agatho italic">Send</span>
            </h2>
            <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/45 mt-0.5">
              Preview how your guests will see the invitation and send it to them.
            </p>
          </div>
        </div>

        {/* ── Body — three columns ── */}
        <div
          data-lenis-prevent
          className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 md:px-8 py-5 grid grid-cols-1 lg:grid-cols-[0.85fr_1.05fr_0.95fr] gap-6"
        >
          {/* COL 1 — Select invitation version */}
          <div>
            <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/70 mb-3">
              {isMulti ? 'Select Invitation Version' : 'Your Invitation'}
            </p>
            <div className="space-y-2">
              {versions.map((v, i) => {
                const active = v.id === selectedId;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`w-full text-left p-3 border flex items-center gap-3 transition-all ${
                      active
                        ? 'border-[#9cb092] bg-[#9cb092]/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-[#9cb092]/40'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-display text-[11px] font-bold ${
                        active ? 'bg-[#9cb092] text-[#111914]' : 'bg-white/[0.06] text-[#b2c3b1]/60'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-[12px] text-[#e4eee1] truncate">{v.name}</p>
                      <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#b2c3b1]/45 mt-0.5">
                        {v.count} {v.count === 1 ? 'guest' : 'guests'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COL 2 — Phone preview + events */}
          <div className="flex flex-col items-center min-h-0">
            {/* Phone frame */}
            <div className="relative w-[190px] flex-shrink-0 rounded-[26px] border-[6px] border-[#0a0f0c] bg-[#0d1512] shadow-2xl overflow-hidden">
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-black/50 z-10" />
              <div className="aspect-[9/16] w-full overflow-hidden">{renderCard()}</div>
            </div>

            {/* Events in this invitation */}
            <div className="w-full mt-5">
              <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/70 mb-2">
                Events in this invitation
              </p>
              <div className="space-y-2">
                {subEvents.length > 0 ? (
                  subEvents.map((ev) => (
                    <div key={ev.idx} className="border border-white/10 bg-white/[0.02] p-3">
                      <p className="font-display text-[11px] text-[#e4eee1]">{ev.name}</p>
                      <div className="mt-1 space-y-0.5">
                        {(ev.date || ev.time) && (
                          <p className="font-display text-[9px] text-[#b2c3b1]/55 flex items-center gap-1.5">
                            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>event</span>
                            {fmtDate(ev.date)}
                            {ev.time && ` · ${ev.time}`}
                          </p>
                        )}
                        {ev.venue && (
                          <p className="font-display text-[9px] text-[#b2c3b1]/55 flex items-center gap-1.5">
                            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>location_on</span>
                            {ev.venue}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="border border-white/10 bg-white/[0.02] p-3">
                    <p className="font-display text-[11px] text-[#e4eee1]">{eventTitle}</p>
                    <div className="mt-1 space-y-0.5">
                      {displayDate && (
                        <p className="font-display text-[9px] text-[#b2c3b1]/55 flex items-center gap-1.5">
                          <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>event</span>
                          {displayDate}
                          {formData.eventTime && ` · ${formData.eventTime}`}
                        </p>
                      )}
                      {formData.venue && (
                        <p className="font-display text-[9px] text-[#b2c3b1]/55 flex items-center gap-1.5">
                          <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>location_on</span>
                          {formData.venue}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COL 3 — Summary + delivery + message */}
          <div className="space-y-5">
            {/* Invitation summary */}
            <div className="border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-display text-[10px] tracking-[0.22em] uppercase text-[#9cb092] mb-3">
                Invitation Summary
              </p>
              <div className="space-y-2 font-display text-[11px]">
                <div className="flex justify-between text-[#b2c3b1]">
                  <span>Total Invitations</span>
                  <span className="text-[#e4eee1]">{versions.length}</span>
                </div>
                <div className="flex justify-between text-[#b2c3b1]">
                  <span>Total Guests</span>
                  <span className="text-[#e4eee1]">{totalGuests}</span>
                </div>
                <div className="flex justify-between text-[#b2c3b1]">
                  <span>Total Events</span>
                  <span className="text-[#e4eee1]">{totalEvents}</span>
                </div>
              </div>
            </div>

            {/* How you'll send */}
            <div className="border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-display text-[10px] tracking-[0.22em] uppercase text-[#9cb092] mb-3">
                How you'll send
              </p>
              <div className="grid grid-cols-2 gap-2">
                {deliveryOptions.map((opt) => {
                  const active = deliveryPreference === opt.key;
                  return (
                    <div
                      key={opt.key}
                      className={`p-2.5 border flex items-center gap-2 ${
                        active
                          ? 'border-[#9cb092] bg-[#9cb092]/10 text-[#9cb092]'
                          : 'border-white/10 bg-white/[0.02] text-[#b2c3b1]/35'
                      }`}
                    >
                      <span className="material-icons text-base">{opt.icon}</span>
                      <span className="font-display text-[9px] tracking-[0.1em] uppercase leading-tight">
                        {opt.label}
                      </span>
                      {active && <span className="material-icons text-sm ml-auto">check_circle</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Your message */}
            <div className="border border-white/[0.07] bg-white/[0.02] p-4">
              <p className="font-display text-[10px] tracking-[0.22em] uppercase text-[#9cb092] mb-2">
                Your message
              </p>
              {customMessage ? (
                <p className="font-display text-[11px] text-[#e4eee1]/85 italic leading-relaxed whitespace-pre-wrap">
                  "{customMessage}"
                </p>
              ) : (
                <p className="font-display text-[10px] text-[#b2c3b1]/40 leading-relaxed">
                  No custom message — guests will see the invitation details only. You can add one on the
                  event-details step.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── RSVP settings summary bar (edit opens a compact popup) ── */}
        <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#0e1712]">
          <div className="px-6 md:px-10 py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-icons text-[#9cb092] text-base">how_to_reg</span>
              <div className="min-w-0">
                <p className="font-display text-[10px] tracking-[0.18em] uppercase text-[#e4eee1] flex items-center gap-2">
                  RSVP Settings
                  <span
                    className={`px-1.5 py-0.5 text-[8px] tracking-[0.15em] uppercase font-bold ${
                      rsvpSettings.enabled ? 'bg-[#9cb092]/20 text-[#9cb092]' : 'bg-white/[0.06] text-[#b2c3b1]/50'
                    }`}
                  >
                    {rsvpSettings.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </p>
                <p className="font-display text-[9px] text-[#b2c3b1]/50 truncate mt-0.5">
                  {rsvpSettings.enabled ? `Guests can respond with — ${rsvpSummary}` : "Guests won't be asked to RSVP"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setRsvpEditing(true)}
              className="flex-shrink-0 font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092] hover:text-[#adc4a3] transition-colors flex items-center gap-1.5 border border-[#9cb092]/40 hover:border-[#9cb092]/70 px-3 py-1.5"
            >
              <span className="material-icons text-sm">tune</span>
              Edit RSVP Settings
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 md:px-10 py-3 border-t border-white/[0.06] bg-[#0e1712]">
          <button
            onClick={onBack}
            className="py-2.5 px-5 border border-white/15 text-[#b2c3b1] font-display text-[10px] tracking-[0.2em] uppercase hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all flex items-center gap-2"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Back
          </button>
          <button
            onClick={onProceed}
            className="py-2.5 px-8 font-display text-[11px] tracking-[0.22em] uppercase font-bold bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3] transition-colors flex items-center gap-2"
          >
            Continue
            <span className="material-icons text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* ── Compact RSVP settings popup ── */}
      {rsvpEditing && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(13, 21, 18, 0.82)', backdropFilter: 'blur(3px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRsvpEditing(false);
          }}
        >
          <div className="relative w-full max-w-md bg-[#141d18] border border-white/[0.1] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
              <h3 className="font-serif-exp text-base text-[#e4eee1] flex items-center gap-2">
                <span className="material-icons text-[#9cb092] text-lg">how_to_reg</span>
                RSVP Settings
              </h3>
              <button
                onClick={() => setRsvpEditing(false)}
                className="w-7 h-7 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all hover:border-[#9cb092]/40"
              >
                <span className="material-icons text-[#b2c3b1] text-base">close</span>
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <RsvpToggleRow
                label="Collect RSVPs from guests"
                sub="Let guests confirm whether they'll attend."
                on={rsvpSettings.enabled}
                onToggle={() => patchRsvp({ enabled: !rsvpSettings.enabled })}
              />

              {rsvpSettings.enabled && (
                <div className="space-y-3 pt-1 border-t border-white/[0.06]">
                  <div>
                    <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/60 mb-1.5">
                      Response Options
                    </p>
                    <div className="flex gap-1.5">
                      {(['yes', 'no', 'maybe'] as const).map((k) => {
                        const on = rsvpSettings.responseOptions[k];
                        const label = k === 'yes' ? 'Yes' : k === 'no' ? 'No' : 'Maybe';
                        return (
                          <button
                            key={k}
                            onClick={() => patchRsvp({ responseOptions: { ...rsvpSettings.responseOptions, [k]: !on } })}
                            className={`flex-1 px-3 py-1.5 font-display text-[10px] tracking-[0.1em] uppercase transition-colors border ${
                              on ? 'bg-[#9cb092]/15 border-[#9cb092]/50 text-[#9cb092]' : 'bg-white/[0.03] border-white/10 text-[#b2c3b1]/45'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <RsvpToggleRow
                    label="Guests Count"
                    sub="Ask how many people are coming."
                    on={rsvpSettings.collectGuestCount}
                    onToggle={() => patchRsvp({ collectGuestCount: !rsvpSettings.collectGuestCount })}
                  />
                  <RsvpToggleRow
                    label="Kids Count"
                    sub="Ask how many children are attending."
                    on={rsvpSettings.collectKidsCount}
                    onToggle={() => patchRsvp({ collectKidsCount: !rsvpSettings.collectKidsCount })}
                  />

                  <div>
                    <RsvpToggleRow
                      label="Food Preference"
                      sub="Collect meal choices for catering."
                      on={rsvpSettings.collectFoodPreference}
                      onToggle={() => patchRsvp({ collectFoodPreference: !rsvpSettings.collectFoodPreference })}
                    />
                    {rsvpSettings.collectFoodPreference && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {ALL_FOOD_OPTIONS.map((opt) => {
                          const on = rsvpSettings.foodOptions.includes(opt);
                          return (
                            <button
                              key={opt}
                              onClick={() => toggleFoodOption(opt)}
                              className={`px-2.5 py-1 font-display text-[9px] tracking-[0.08em] uppercase transition-colors border ${
                                on ? 'bg-[#9cb092]/15 border-[#9cb092]/50 text-[#9cb092]' : 'bg-white/[0.03] border-white/10 text-[#b2c3b1]/45'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <RsvpToggleRow
                    label="Additional Information"
                    sub="Dietary restrictions, allergies, a message to the host."
                    on={rsvpSettings.collectAdditionalInfo}
                    onToggle={() => patchRsvp({ collectAdditionalInfo: !rsvpSettings.collectAdditionalInfo })}
                  />
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-white/[0.07] flex justify-end">
              <button
                onClick={() => setRsvpEditing(false)}
                className="font-display text-[10px] tracking-[0.2em] uppercase text-[#111914] bg-[#9cb092] hover:bg-[#adc4a3] transition-colors flex items-center gap-1.5 px-5 py-2 font-bold"
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

// Compact labelled on/off row used inside the RSVP settings editor.
function RsvpToggleRow({
  label,
  sub,
  on,
  onToggle,
}: {
  label: string;
  sub: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-display text-[11px] text-[#e4eee1] leading-tight">{label}</p>
        <p className="font-display text-[9px] text-[#b2c3b1]/45 leading-tight mt-0.5">{sub}</p>
      </div>
      <button
        onClick={onToggle}
        aria-pressed={on}
        className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-300 ${on ? 'bg-[#9cb092]' : 'bg-white/15'}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${
            on ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
