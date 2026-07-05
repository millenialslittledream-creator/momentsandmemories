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
  /** Multi-invitation flow only. When passed, the preview switches to a
   * tabbed view (All Guests + one tab per set) showing each guest with
   * the specific invitation they will receive. */
  invitationSets?: InvitationSetPreview[];
  guests?: Guest[];
  formData: Record<string, string>;
  deliveryPreference: 'email' | 'phone' | 'both' | 'link';
  guestCount: number;
  /** Customization overrides for `selectedTemplate`, applied to the
   * stock-template render path so guests see the same edits the host made. */
  templateOverrides?: Record<string, Partial<TemplateFieldLayout>>;
  templatePhotoOverlay?: PhotoOverlay | null;
  rsvpSettings: RSVPSettings;
  onRsvpSettingsChange: (settings: RSVPSettings) => void;
  onBack: () => void;
  onClose?: () => void;
  onProceed: () => void;
}

const ALL_TAB = '__all__';

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

  const patchRsvp = (patch: Partial<RSVPSettings>) =>
    onRsvpSettingsChange({ ...rsvpSettings, ...patch });

  const toggleFoodOption = (opt: string) => {
    const has = rsvpSettings.foodOptions.includes(opt);
    patchRsvp({
      foodOptions: has
        ? rsvpSettings.foodOptions.filter((o) => o !== opt)
        : [...rsvpSettings.foodOptions, opt],
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

  const isMulti = (invitationSets?.length ?? 0) >= 2;
  const guestList = guests ?? [];

  // Per-tab counts: All + each set
  const guestsBySet = useMemo(() => {
    if (!isMulti || !invitationSets) return new Map<string, Guest[]>();
    const m = new Map<string, Guest[]>();
    const defaultSetId = invitationSets[0].id;
    for (const s of invitationSets) m.set(s.id, []);
    for (const g of guestList.filter((x) => x.name.trim())) {
      const sid = g.invitationSetId ?? defaultSetId;
      if (!m.has(sid)) m.set(sid, []);
      m.get(sid)!.push(g);
    }
    return m;
  }, [isMulti, invitationSets, guestList]);

  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);

  const activeSet = useMemo(() => {
    if (activeTab === ALL_TAB) return null;
    return invitationSets?.find((s) => s.id === activeTab) ?? null;
  }, [activeTab, invitationSets]);

  const activeTabGuests = useMemo(() => {
    if (!isMulti) return guestList.filter((g) => g.name.trim());
    if (activeTab === ALL_TAB) return guestList.filter((g) => g.name.trim());
    return guestsBySet.get(activeTab) ?? [];
  }, [activeTab, guestsBySet, guestList, isMulti]);

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

  const displayDate = formData.eventDate
    ? new Date(formData.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const deliveryLabel =
    deliveryPreference === 'email'
      ? 'Email'
      : deliveryPreference === 'phone'
      ? 'SMS'
      : deliveryPreference === 'link'
      ? 'Shareable Link'
      : 'Email + SMS';

  const customMessage = formData.customMessage?.trim() || '';

  // The invitation card the user sees on the left depends on which tab is
  // active in the multi-invitation flow. On the "All Guests" tab in multi
  // mode we show a stack of all uploaded invitations so the user can see
  // every design at a glance.
  const cardToShow =
    activeSet
      ? { kind: 'uploaded' as const, url: activeSet.url, type: activeSet.type }
      : uploadedTemplate
      ? { kind: 'uploaded' as const, url: uploadedTemplate.url, type: uploadedTemplate.type }
      : selectedTemplate
      ? { kind: 'template' as const, template: selectedTemplate }
      : null;
  const showAllInvitesStack = isMulti && activeTab === ALL_TAB && invitationSets;

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
        className="relative w-full max-w-6xl max-h-[92vh] h-full flex flex-col bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
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
          <div className="min-w-0 pr-10">
            <h2 className="font-serif-exp text-base md:text-lg text-[#e4eee1] leading-tight truncate">
              {isMulti
                ? 'Review guest assignments'
                : 'What your guests will'} {!isMulti && <span className="text-[#9cb092] font-agatho italic">receive</span>}
            </h2>
            <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/45 mt-0.5">
              {isMulti
                ? `${guestList.filter((g) => g.name.trim()).length} guests · ${invitationSets!.length} invitations · via ${deliveryLabel}`
                : `Sending to ${guestCount} ${guestCount === 1 ? 'guest' : 'guests'} · via ${deliveryLabel}`}
            </p>
          </div>
        </div>

        {/* ── Tabs (multi-invitation only) ── */}
        {isMulti && invitationSets && (
          <div className="flex-shrink-0 flex items-center gap-1 px-6 md:px-8 pt-3 border-b border-white/[0.06] bg-[#0e1712] overflow-x-auto scrollbar-subtle">
            <button
              onClick={() => setActiveTab(ALL_TAB)}
              className={`px-4 py-2 font-display text-[10px] tracking-[0.18em] uppercase transition-colors border-b-2 flex items-center gap-2 flex-shrink-0 ${
                activeTab === ALL_TAB
                  ? 'border-[#9cb092] text-[#9cb092]'
                  : 'border-transparent text-[#b2c3b1]/55 hover:text-[#9cb092]'
              }`}
            >
              All Guests
              <span
                className={`px-1.5 py-0.5 text-[9px] font-bold ${
                  activeTab === ALL_TAB
                    ? 'bg-[#9cb092]/20 text-[#9cb092]'
                    : 'bg-white/[0.06] text-[#b2c3b1]/60'
                }`}
              >
                {guestList.filter((g) => g.name.trim()).length}
              </span>
            </button>
            {invitationSets.map((s) => {
              const count = guestsBySet.get(s.id)?.length ?? 0;
              const isActive = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`px-4 py-2 font-display text-[10px] tracking-[0.18em] uppercase transition-colors border-b-2 flex items-center gap-2 flex-shrink-0 ${
                    isActive
                      ? 'border-[#9cb092] text-[#9cb092]'
                      : 'border-transparent text-[#b2c3b1]/55 hover:text-[#9cb092]'
                  }`}
                >
                  {s.name}
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold ${
                      isActive
                        ? 'bg-[#9cb092]/20 text-[#9cb092]'
                        : 'bg-white/[0.06] text-[#b2c3b1]/60'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Body — single screen, no scroll. Two side-by-side panels. ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 md:gap-8 px-6 md:px-10 py-5">
          {/* LEFT — Invitation card (changes with active tab in multi mode) */}
          <div className="flex flex-col items-center justify-center min-h-0">
            <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/60 mb-2 flex items-center gap-1.5">
              <span className="material-icons" style={{ fontSize: '12px' }}>image</span>
              {activeSet
                ? `${activeSet.name} invitation`
                : showAllInvitesStack
                ? `All ${invitationSets!.length} invitations`
                : 'Invitation Card'}
            </p>
            {showAllInvitesStack ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 h-full max-h-full overflow-hidden">
                {invitationSets!.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveTab(s.id)}
                    className="group relative bg-[#0d1512] border border-white/10 hover:border-[#9cb092]/60 transition-all overflow-hidden flex flex-col"
                    title={`View ${s.name}`}
                  >
                    <div className="aspect-[9/16] w-full overflow-hidden bg-[#192116]">
                      {s.type === 'image' ? (
                        <img src={s.url} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <video src={s.url} muted className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="material-icons text-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontSize: '20px' }}>
                          zoom_in
                        </span>
                      </div>
                    </div>
                    <p className="font-display text-[9px] tracking-[0.12em] uppercase text-[#e4eee1] px-2 py-1.5 truncate text-center bg-[#0e1712]">
                      {s.name}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
            <div className="relative bg-[#0d1512] border border-white/10 shadow-2xl overflow-hidden h-full max-h-full flex items-center">
              <div className="aspect-[9/16] h-full max-h-full w-auto max-w-full">
                {cardToShow?.kind === 'uploaded' ? (
                  cardToShow.type === 'image' ? (
                    <img
                      src={cardToShow.url}
                      alt="Invitation"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={cardToShow.url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )
                ) : cardToShow?.kind === 'template' && cardToShow.template.layout ? (
                  <TemplateRenderer
                    template={cardToShow.template}
                    formData={formData}
                    overrides={templateOverrides}
                    photoOverlay={templatePhotoOverlay}
                  />
                ) : cardToShow?.kind === 'template' ? (
                  <div className="relative w-full h-full">
                    <img
                      src={cardToShow.template.previewImage}
                      alt={cardToShow.template.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <p className="font-display text-[8px] tracking-[0.25em] uppercase text-white/55 mb-1">
                        You're invited to
                      </p>
                      <h4 className="font-serif-exp text-lg text-white leading-tight">
                        {eventTitle}
                      </h4>
                      <div className="space-y-1 mt-2">
                        {displayDate && (
                          <p className="font-display text-[9px] text-white/75 flex items-center gap-1.5">
                            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>
                              calendar_today
                            </span>
                            {displayDate}
                          </p>
                        )}
                        {formData.eventTime && (
                          <p className="font-display text-[9px] text-white/75 flex items-center gap-1.5">
                            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>
                              schedule
                            </span>
                            {formData.eventTime}
                            {formData.timezone && ` · ${formData.timezone}`}
                          </p>
                        )}
                        {formData.venue && (
                          <p className="font-display text-[9px] text-white/75 flex items-center gap-1.5">
                            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>
                              location_on
                            </span>
                            {formData.venue}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            )}
          </div>

          {/* RIGHT — Guest list (multi mode) OR plain message preview (single mode) */}
          {isMulti && invitationSets ? (
            <div className="flex flex-col min-h-0">
              <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/60 mb-2 flex items-center gap-1.5">
                <span className="material-icons" style={{ fontSize: '12px' }}>group</span>
                {activeTab === ALL_TAB
                  ? `All Guests · ${activeTabGuests.length}`
                  : `${activeSet?.name} · ${activeTabGuests.length} ${activeTabGuests.length === 1 ? 'guest' : 'guests'}`}
              </p>

              <div className="flex-1 min-h-0 bg-white/[0.02] border border-white/10 overflow-hidden flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-[#0e1712] z-10">
                      <tr className="border-b border-white/10">
                        <th className="text-left px-3 py-2 font-display text-[9px] tracking-[0.18em] uppercase text-[#9cb092]/70 w-8">#</th>
                        <th className="text-left px-3 py-2 font-display text-[9px] tracking-[0.18em] uppercase text-[#9cb092]/70">Guest</th>
                        <th className="text-left px-3 py-2 font-display text-[9px] tracking-[0.18em] uppercase text-[#9cb092]/70 hidden sm:table-cell">Contact</th>
                        {activeTab === ALL_TAB && (
                          <th className="text-left px-3 py-2 font-display text-[9px] tracking-[0.18em] uppercase text-[#9cb092]/70">Receives</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {activeTabGuests.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center font-display text-[11px] text-[#b2c3b1]/40">
                            No guests assigned to this invitation yet.
                          </td>
                        </tr>
                      ) : (
                        activeTabGuests.map((g, i) => {
                          const sid = g.invitationSetId ?? invitationSets[0].id;
                          const setName = invitationSets.find((s) => s.id === sid)?.name ?? '';
                          return (
                            <tr key={g.id} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                              <td className="px-3 py-2 font-display text-[10px] text-[#9cb092]/60">{i + 1}</td>
                              <td className="px-3 py-2 font-display text-[12px] text-[#e4eee1]">{g.name}</td>
                              <td className="px-3 py-2 font-display text-[10px] text-[#b2c3b1]/60 hidden sm:table-cell truncate max-w-[160px]">
                                {g.email || g.phone || '—'}
                              </td>
                              {activeTab === ALL_TAB && (
                                <td className="px-3 py-2">
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#9cb092]/15 border border-[#9cb092]/40 font-display text-[9px] tracking-[0.1em] uppercase text-[#9cb092]">
                                    {setName}
                                  </span>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            // SINGLE-INVITATION FLOW — plain message body
            <div className="flex flex-col min-h-0">
              <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/60 mb-2 flex items-center gap-1.5">
                <span className="material-icons" style={{ fontSize: '12px' }}>
                  {deliveryPreference === 'phone'
                    ? 'sms'
                    : deliveryPreference === 'email'
                    ? 'mail'
                    : deliveryPreference === 'link'
                    ? 'link'
                    : 'mark_email_read'}
                </span>
                Message Preview · sent via {deliveryLabel}
              </p>

              <div className="flex-1 min-h-0 bg-white/[0.03] border border-white/10 p-5 overflow-hidden flex flex-col">
                <p className="font-display text-[10px] tracking-[0.18em] uppercase text-[#b2c3b1]/50 mb-3 pb-3 border-b border-white/[0.07]">
                  From <span className="text-[#9cb092]">moments &amp; memories</span>
                </p>

                <div className="space-y-3 font-display text-[13px] text-[#e4eee1] leading-relaxed">
                  <p>
                    You're invited to{' '}
                    <span className="font-serif-exp italic text-[#9cb092]">{eventTitle}</span>
                  </p>

                  {displayDate && (
                    <p className="flex items-start gap-2">
                      <span className="material-icons text-[#9cb092] mt-0.5" style={{ fontSize: '14px' }}>event</span>
                      <span>
                        {displayDate}
                        {formData.eventTime && ` at ${formData.eventTime}`}
                        {formData.timezone && ` ${formData.timezone}`}
                      </span>
                    </p>
                  )}

                  {formData.venue && (
                    <p className="flex items-start gap-2">
                      <span className="material-icons text-[#9cb092] mt-0.5" style={{ fontSize: '14px' }}>location_on</span>
                      <span>{formData.venue}</span>
                    </p>
                  )}

                  {customMessage && (
                    <p className="text-[#e4eee1]/90 italic whitespace-pre-wrap pt-2 border-t border-white/[0.07]">
                      "{customMessage}"
                    </p>
                  )}

                  <p className="pt-2 border-t border-white/[0.07] text-[#9cb092] text-[12px]">
                    https://momentsandmemories.com/i/abc123
                  </p>
                </div>
              </div>
            </div>
          )}
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
                      rsvpSettings.enabled
                        ? 'bg-[#9cb092]/20 text-[#9cb092]'
                        : 'bg-white/[0.06] text-[#b2c3b1]/50'
                    }`}
                  >
                    {rsvpSettings.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </p>
                <p className="font-display text-[9px] text-[#b2c3b1]/50 truncate mt-0.5">
                  {rsvpSettings.enabled
                    ? `Guests can respond with — ${rsvpSummary}`
                    : "Guests won't be asked to RSVP"}
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
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 md:px-10 py-4 border-t border-white/[0.06] bg-[#0e1712]">
          <button
            onClick={onBack}
            className="py-3 px-5 border border-white/15 text-[#b2c3b1] font-display text-[10px] tracking-[0.2em] uppercase hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all flex items-center gap-2"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Back
          </button>

          <button
            onClick={onProceed}
            className="py-3 px-8 font-display text-[11px] tracking-[0.22em] uppercase font-bold bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3] transition-colors flex items-center gap-2"
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
          <div
            className="relative w-full max-w-md bg-[#141d18] border border-white/[0.1] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
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
                  {/* Response options */}
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
                            onClick={() =>
                              patchRsvp({
                                responseOptions: { ...rsvpSettings.responseOptions, [k]: !on },
                              })
                            }
                            className={`flex-1 px-3 py-1.5 font-display text-[10px] tracking-[0.1em] uppercase transition-colors border ${
                              on
                                ? 'bg-[#9cb092]/15 border-[#9cb092]/50 text-[#9cb092]'
                                : 'bg-white/[0.03] border-white/10 text-[#b2c3b1]/45'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Count toggles — full-width rows so the switches align */}
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

                  {/* Food preference */}
                  <div>
                    <RsvpToggleRow
                      label="Food Preference"
                      sub="Collect meal choices for catering."
                      on={rsvpSettings.collectFoodPreference}
                      onToggle={() =>
                        patchRsvp({ collectFoodPreference: !rsvpSettings.collectFoodPreference })
                      }
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
                                on
                                  ? 'bg-[#9cb092]/15 border-[#9cb092]/50 text-[#9cb092]'
                                  : 'bg-white/[0.03] border-white/10 text-[#b2c3b1]/45'
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
                    onToggle={() =>
                      patchRsvp({ collectAdditionalInfo: !rsvpSettings.collectAdditionalInfo })
                    }
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
        className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-300 ${
          on ? 'bg-[#9cb092]' : 'bg-white/15'
        }`}
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
