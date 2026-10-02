import { useState, useCallback, useEffect, useRef, useMemo, type ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import gsap from 'gsap';
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
import FlowStepper from '@/sections/create/FlowStepper';
import FlowLogo from '@/sections/create/FlowLogo';
import EventIllustration from '@/sections/create/EventIllustration';
import PreviewStep, { DEFAULT_RSVP_SETTINGS, type RSVPSettings } from '@/sections/create/PreviewStep';
import TemplateRenderer, { type PhotoOverlay } from '@/components/TemplateRenderer';
import CanvasEditor from '@/components/CanvasEditor';
import { type CanvasTemplate } from '@/data/canvasTemplates';
import type { TemplateFieldLayout } from '@/data/eviteTemplates';
import { FONT_CATEGORIES, COLOR_SWATCHES } from '@/components/CanvasEditor/types';

type EventTypeFilter = EventType;
type ModalPhase = 'upload' | 'canvas-editor' | 'editor' | 'signin' | 'share' | 'guests' | 'preview' | 'payment' | 'sent' | null;

// The entry flow now has four stages:
//   'picker'        — "What are we celebrating today?" event grid (first thing users see)
//   'loading'       — brief "Creating your perfect experience…" transition after a pick
//   'choose-design' — "How would you like to design your invitation?" method cards
//   'gallery'       — the template gallery, filtered to the chosen event
type FlowStage = 'picker' | 'loading' | 'choose-design' | 'gallery';

// Example invitation-group names shown beside each upload slot so hosts
// understand what "Invitation Name" means (Family vs Friends vs Colleagues…).
const INVITE_NAME_EXAMPLES = [
  ['Family & Close Friends', 'Relatives', 'Elders', 'VIP Guests'],
  ['Close Friends', 'College Friends', 'Neighbors', 'Colleagues'],
  ['Reception Only', 'Extended Family', 'Work Friends', 'Plus Ones'],
  ['Mehendi Guests', 'Sangeet Guests', 'Cousins', 'Family Friends'],
];

interface UploadedTemplate {
  url: string;
  type: 'image' | 'video';
  fileName?: string;
}

interface InvitationSlot {
  id: string;
  url: string;
  type: 'image' | 'video' | null;
  fileName: string;
  name: string;
  formData?: Record<string, string>;
}

const SUPPORTS_MULTI_EVENTS: EventType[] = ['marriage', 'custom'];

// ── Single field renderer (used for everything except the grouped date/time/tz block) ──
function renderEditorField(
  field: EventField,
  value: string,
  onChange: (name: string, value: string) => void
) {
  const baseInputClass =
    'bg-white/[0.06] border border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 px-4 h-12 text-sm rounded-sm w-full outline-none transition-colors';

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
            className={`${baseInputClass} h-auto min-h-[90px] py-3 resize-none`}
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

// Shared textured background used across the site (shop page, gallery). The
// entry flow (event picker + loading transition) reuses it so the whole
// experience feels consistent.
const ENTRY_BG_TEXTURE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD0yNSOWSBJLsv1-47TiuxQ15AFQ4nsrk2tyl20R-zvNNsiDXBNDhZVYz1yHqSCTtqtGcVjl35j2rrDIrA-d5xW6tM2FPDinMxC7wGNXKzBCT0JhfwdSkLFQPVqU1yfc1GtqRHSfxSmlitg3lWmrbcCqzLdzR4XsiD9nN9-_O7fp4ViDdX7MFMvLLa9exuWvETBq8HCVRb7NcpP7tWvqDoEWCeegHipJmlKBCM4gpRO9AROi6bPaa2gmQvHKabiYnelhLueCkgQ9QIe';

// The two stacked layers (textured image + dark wash) that produce that look.
// Rendered inside the fixed entry-flow overlays so they fully cover the screen.
function EntryBackground() {
  return (
    <>
      <div
        className="absolute inset-0 z-0 opacity-30 mix-blend-multiply pointer-events-none"
        style={{ backgroundImage: `url('${ENTRY_BG_TEXTURE}')` }}
      />
      <div className="absolute inset-0 z-[1] bg-[#111914]/70 pointer-events-none" />
    </>
  );
}

// ── Main component ──────────────────────────────────────────────────────
export default function CreateEvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const editorBackdropRef = useRef<HTMLDivElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);

  const [activeFilter, setActiveFilter] = useState<EventTypeFilter>('birthday');
  // Entry flow: users first pick an event, watch a short transition, then land
  // on the gallery pre-filtered to that event.
  const [flowStage, setFlowStage] = useState<FlowStage>('picker');
  const [pickerEvent, setPickerEvent] = useState<EventType | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const chooseDesignRef = useRef<HTMLDivElement>(null);
  const loadingBarRef = useRef<HTMLDivElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [uploadedTemplate, setUploadedTemplate] = useState<UploadedTemplate | null>(null);
  const [modalPhase, setModalPhase] = useState<ModalPhase>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [guests, setGuests] = useState<Guest[]>([createGuest()]);
  // Default to the shareable link: the previous step already hands the host a
  // live link, so the guest step opens with "no guest list needed" and only
  // asks for guest names if the host opts into email / SMS delivery.
  const [deliveryPreference, setDeliveryPreference] = useState<'email' | 'phone' | 'both' | 'link'>('link');
  const [rsvpSettings, setRsvpSettings] = useState<RSVPSettings>(DEFAULT_RSVP_SETTINGS);
  const [hasSubEvents, setHasSubEvents] = useState(false);
  const [multipleInvitations, setMultipleInvitations] = useState(false);
  const [currentSlotIdx, setCurrentSlotIdx] = useState(0);
  const [invitationSlots, setInvitationSlots] = useState<InvitationSlot[]>([
    { id: 'slot-1', url: '', type: null, fileName: '', name: 'Main Invitation' },
  ]);
  const [pickedCanvasTemplate, setPickedCanvasTemplate] = useState<CanvasTemplate | null>(null);

  // ── Template customization (font/color/position overrides + photo) ──
  // Local-only until the real event is created; persisted to the
  // evite_customizations table right after api.createEvent succeeds.
  const [rightPanelTab, setRightPanelTab] = useState<'details' | 'customize'>('details');
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, Partial<TemplateFieldLayout>>>({});
  const [photoOverlay, setPhotoOverlay] = useState<PhotoOverlay | null>(null);
  const [selectedOverrideKey, setSelectedOverrideKey] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // ── Publish / share (the evite goes live at the Share step) ──────────
  const [publishedEventId, setPublishedEventId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // ── Resume-in-progress prompt (H10) ──────────────────────────────────
  // If the host left a half-finished evite behind (saved in localStorage),
  // greet them on return with a "pick up where you left off?" popup instead
  // of silently dropping them on the event picker.
  const [showResume, setShowResume] = useState(false);
  const [resumeLabel, setResumeLabel] = useState('');

  // ── Derived state ────────────────────────────────────────────────
  const selectedTemplate = useMemo(
    () => eviteTemplates.find((t) => t.id === selectedTemplateId) || null,
    [selectedTemplateId]
  );

  // Templates filtered by chip. Upload tile is injected as the first item.
  // 'custom' is special: there are no inherently-custom designs, so we show
  // every template (any of them can be repurposed for a custom event).
  const visibleTemplates = useMemo(() => {
    if (activeFilter === 'custom') return eviteTemplates;
    return eviteTemplates.filter((t) => t.eventType === activeFilter);
  }, [activeFilter]);

  // For the editor modal's prev/next navigation we use only real templates
  // (uploaded design has no neighbours in the gallery).
  const currentIdx = useMemo(() => {
    if (!selectedTemplateId) return -1;
    return visibleTemplates.findIndex((t) => t.id === selectedTemplateId);
  }, [selectedTemplateId, visibleTemplates]);

  // When Multiple Events is ON and the selected template belongs to a variant
  // group, the carousel navigates WITHIN that group (2-event ↔ 3-event ↔ 4-event
  // ↔ 5-event variants) instead of across the full gallery.
  const variantTemplates = useMemo(() => {
    if (!hasSubEvents || !selectedTemplate?.variantGroup) return null;
    return eviteTemplates.filter((t) => t.variantGroup === selectedTemplate.variantGroup);
  }, [hasSubEvents, selectedTemplate]);

  const variantIdx = useMemo(() => {
    if (!variantTemplates || !selectedTemplateId) return -1;
    return variantTemplates.findIndex((t) => t.id === selectedTemplateId);
  }, [variantTemplates, selectedTemplateId]);

  // When working with an uploaded template, the editor form should ask for
  // the SAME fields a stock template of that event-type would ask for — so a
  // birthday upload still asks for celebrant name, a baby shower still asks
  // for parent + baby gender, etc. The image is the only thing that changed.
  const currentEventType: EventType | null = uploadedTemplate
    ? activeFilter
    : selectedTemplate?.eventType ?? null;

  const editorFields: EventField[] = useMemo(() => {
    if (!currentEventType) return [];
    // Some templates override the default fields (e.g. the pre-wedding
    // "Champagne Toast" collects bride + groom names instead of one celebrant).
    return getEditorFields(currentEventType, selectedTemplate?.id);
  }, [currentEventType, selectedTemplate]);

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

  // ── Customizable text fields for the active template ───────────────
  // Each entry's key matches the override key TemplateRenderer merges on
  // (formKey, falling back to `field-${idx}`) so selecting a row here and
  // editing it updates exactly the field the live preview highlights.
  const customizableFields = useMemo(() => {
    if (!selectedTemplate?.layout) return [];
    return selectedTemplate.layout.fields.map((field, idx) => ({
      key: field.formKey ?? `field-${idx}`,
      label: field.formKey
        ? field.formKey.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
        : field.text || `Text ${idx + 1}`,
      field,
    }));
  }, [selectedTemplate]);

  const selectedOverrideField = useMemo(() => {
    const entry = customizableFields.find((f) => f.key === selectedOverrideKey);
    if (!entry) return null;
    return { ...entry.field, ...fieldOverrides[entry.key] };
  }, [customizableFields, selectedOverrideKey, fieldOverrides]);

  const setOverride = useCallback((key: string, patch: Partial<TemplateFieldLayout>) => {
    setFieldOverrides((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }, []);

  const nudgeOverride = useCallback(
    (key: string, axis: 'x' | 'y', delta: number, baseField: TemplateFieldLayout) => {
      setFieldOverrides((prev) => {
        const current = prev[key] ?? {};
        const base = current[axis] ?? baseField[axis];
        return { ...prev, [key]: { ...current, [axis]: base + delta } };
      });
    },
    []
  );

  const handlePhotoUpload = useCallback(async (file: File) => {
    setPhotoUploading(true);
    try {
      const uploaded = await api.uploadMedia(file);
      const naturalWidth = selectedTemplate?.layout?.naturalWidth ?? 1024;
      const naturalHeight = selectedTemplate?.layout?.naturalHeight ?? 1536;
      setPhotoOverlay({
        src: uploaded.public_url,
        x: Math.round(naturalWidth / 2),
        y: Math.round(naturalHeight * 0.3),
        size: Math.round(naturalWidth * 0.3),
        shape: 'circle',
      });
    } catch (e) {
      console.warn('Photo upload failed:', e);
    } finally {
      setPhotoUploading(false);
    }
  }, [selectedTemplate]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleFieldChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Entry-flow: user picks an event → filter the gallery to it and play a
  // short "creating your experience" transition before revealing the templates.
  const chooseEvent = useCallback((eventId: EventType) => {
    setPickerEvent(eventId);
    setActiveFilter(eventId);
    setFlowStage('loading');
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

  // On arrival, offer to resume a saved-but-unfinished evite (H10). Skipped
  // when we're mid sign-in-return (pendingPhase handles that separately).
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mm_evite_draft');
      if (!saved) return;
      const p = JSON.parse(saved);
      if (p.pendingPhase) return;
      const hasContent =
        !!p.selectedTemplateId ||
        !!p.uploadedTemplate ||
        (p.formData && Object.keys(p.formData).length > 0);
      if (!hasContent) return;
      const et = p.selectedTemplateId
        ? eviteTemplates.find((t) => t.id === p.selectedTemplateId)?.eventType
        : null;
      setResumeLabel(et ? eventTypes.find((e) => e.id === et)?.label ?? '' : '');
      setShowResume(true);
    } catch {
      /* ignore */
    }
    // Runs once on mount.
  }, []);

  // "Continue editing" — re-apply the saved draft and drop the host straight
  // back into the editor for their in-progress design.
  const resumeDraft = useCallback(() => {
    setShowResume(false);
    try {
      const saved = localStorage.getItem('mm_evite_draft');
      const p = saved ? JSON.parse(saved) : {};
      if (p.formData) setFormData(p.formData);
      if (p.guests?.length) setGuests(p.guests);
      if (p.deliveryPreference) setDeliveryPreference(p.deliveryPreference);
      if (p.hasSubEvents) setHasSubEvents(!!p.hasSubEvents);
      if (p.selectedTemplateId) {
        const t = eviteTemplates.find((x) => x.id === p.selectedTemplateId);
        if (t) setActiveFilter(t.eventType);
        setSelectedTemplateId(p.selectedTemplateId);
        setUploadedTemplate(null);
        setFlowStage('gallery');
        setModalPhase('editor');
        animateModalIn();
      } else if (p.uploadedTemplate) {
        setUploadedTemplate(p.uploadedTemplate);
        setFlowStage('gallery');
        setModalPhase('editor');
        animateModalIn();
      } else {
        // Only form details were saved — take them to the gallery to re-pick a design.
        setFlowStage('gallery');
      }
    } catch {
      /* ignore */
    }
  }, [animateModalIn]);

  // "Start fresh" — throw the old draft away and begin from the event picker.
  const discardDraft = useCallback(() => {
    setShowResume(false);
    try {
      localStorage.removeItem('mm_evite_draft');
    } catch {
      /* ignore */
    }
    setFormData({});
    setSelectedTemplateId(null);
    setUploadedTemplate(null);
    setHasSubEvents(false);
    setGuests([createGuest()]);
    setFlowStage('picker');
  }, []);

  const openTemplate = useCallback(
    (templateId: string) => {
      setUploadedTemplate(null);
      setSelectedTemplateId(templateId);
      // Fresh template click starts a fresh celebration — clear any stale
      // formData (e.g. sub_events_count left over from an abandoned wedding
      // draft) so the Guests page doesn't show event checkboxes that belong
      // to a previous session.
      setFormData({});
      setHasSubEvents(false);
      setFieldOverrides({});
      setPhotoOverlay(null);
      setSelectedOverrideKey(null);
      setRightPanelTab('details');
      setModalPhase('editor');
      animateModalIn();
    },
    [animateModalIn]
  );

  const openUploadFlow = useCallback(() => {
    setSelectedTemplateId(null);
    setUploadedTemplate(null);
    // Clear stale formData from any previous abandoned session so sub-event
    // checkboxes don't bleed into a fresh upload flow.
    setFormData({});
    setHasSubEvents(false);
    setFieldOverrides({});
    setPhotoOverlay(null);
    setSelectedOverrideKey(null);
    setRightPanelTab('details');
    // Everyone starts on the single-invitation upload ("No, same invite to all
    // guests" is the default). For wedding/others the upload modal shows a
    // "Multiple Invitations" toggle so the host can opt into different invites
    // for different guest groups; all other events only ever upload one design.
    setMultipleInvitations(false);
    setModalPhase('upload');
    animateModalIn();
  }, [animateModalIn]);

  const openCanvasEditor = useCallback(() => {
    setSelectedTemplateId(null);
    setUploadedTemplate(null);
    setPickedCanvasTemplate(null);
    setFormData({});
    setHasSubEvents(false);
    setModalPhase('canvas-editor');
  }, []);

  const handleCanvasEditorFinish = useCallback((pngDataUrl: string) => {
    setUploadedTemplate({ url: pngDataUrl, type: 'image', fileName: 'custom-design.png' });
    setPickedCanvasTemplate(null);
    setModalPhase('editor');
    animateModalIn();
  }, [animateModalIn]);

  const closeAnyModal = useCallback(() => {
    if (!editorBackdropRef.current || !editorPanelRef.current) {
      setSelectedTemplateId(null);
      setUploadedTemplate(null);
      setPickedCanvasTemplate(null);
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
        setPickedCanvasTemplate(null);
        setModalPhase(null);
      },
    });
  }, []);

  const closeToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Switching the design mid-browse invalidates any font/color/position
  // overrides + photo overlay tuned for the PREVIOUS template's layout —
  // clear them so they don't silently misplace text on the new design.
  const resetCustomization = useCallback(() => {
    setFieldOverrides({});
    setPhotoOverlay(null);
    setSelectedOverrideKey(null);
  }, []);

  const prevTemplate = useCallback(() => {
    if (uploadedTemplate) return;
    // In multi-event mode, navigate within the variant group only.
    if (variantTemplates) {
      if (variantIdx > 0) {
        setSelectedTemplateId(variantTemplates[variantIdx - 1].id);
        resetCustomization();
      }
      return;
    }
    if (currentIdx > 0) {
      setSelectedTemplateId(visibleTemplates[currentIdx - 1].id);
      resetCustomization();
    }
  }, [currentIdx, visibleTemplates, uploadedTemplate, variantTemplates, variantIdx, resetCustomization]);

  const nextTemplate = useCallback(() => {
    if (uploadedTemplate) return;
    // In multi-event mode, navigate within the variant group only.
    if (variantTemplates) {
      if (variantIdx < variantTemplates.length - 1) {
        setSelectedTemplateId(variantTemplates[variantIdx + 1].id);
        resetCustomization();
      }
      return;
    }
    if (currentIdx >= 0 && currentIdx < visibleTemplates.length - 1) {
      setSelectedTemplateId(visibleTemplates[currentIdx + 1].id);
      resetCustomization();
    }
  }, [currentIdx, visibleTemplates, uploadedTemplate, variantTemplates, variantIdx, resetCustomization]);

  const isEditorValid = useMemo(() => {
    if (!currentEventType) return false;
    for (const field of editorFields) {
      if (field.required && !formData[field.name]?.trim()) return false;
    }
    // Additional events are optional; only validate the rows the host actually
    // added (each must at least be named so guests can be assigned to it).
    if (supportsMultipleEvents && subEventCount > 0) {
      for (let i = 0; i < subEventCount; i++) {
        if (!formData[`sub_${i}_name`]?.trim()) return false;
      }
    }
    return true;
  }, [editorFields, formData, currentEventType, supportsMultipleEvents, subEventCount]);

  // Customize is gated behind a fully-filled details form. If validity is lost
  // while the user is on the Customize tab (e.g. clearing a field, switching
  // templates), snap them back to Details so they can't edit a locked design.
  useEffect(() => {
    if (!isEditorValid && rightPanelTab === 'customize') {
      setRightPanelTab('details');
    }
  }, [isEditorValid, rightPanelTab]);

  // After event details are captured we ask the user to sign in (so we can save
  // their design + guest list). Already-signed-in users skip straight to guests.
  //
  // Multi-invite flow: the host enters event details ONCE on a single editor
  // screen. The slot arrows let them preview each uploaded invitation, but
  // formData (date / venue / bride+groom / etc.) is shared across all slots.
  // Below we mirror the single shared formData into every slot so downstream
  // (preview, send) sees consistent details no matter which slot is "current".
  const proceedFromEditor = useCallback(() => {
    if (multipleInvitations) {
      setInvitationSlots((prev) =>
        prev.map((s) => (s.url && s.type ? { ...s, formData } : s))
      );
    }
    if (user) {
      setModalPhase('share');
    } else {
      try {
        const existing = localStorage.getItem('mm_evite_draft');
        const parsed = existing ? JSON.parse(existing) : {};
        localStorage.setItem(
          'mm_evite_draft',
          JSON.stringify({ ...parsed, pendingPhase: 'share' })
        );
      } catch {
        /* ignore */
      }
      setModalPhase('signin');
    }
  }, [user, multipleInvitations, invitationSlots, currentSlotIdx, formData]);

  const backToEditor = useCallback(() => setModalPhase('editor'), []);

  // Back from the editor: uploaded designs return to the upload modal (so the
  // image isn't lost); gallery templates return to the gallery grid.
  const backFromEditor = useCallback(() => {
    if (uploadedTemplate) {
      setModalPhase('upload');
    } else {
      setSelectedTemplateId(null);
      setModalPhase(null);
    }
  }, [uploadedTemplate]);

  const proceedToPreview = useCallback(() => setModalPhase('preview'), []);
  const proceedToPayment = useCallback(() => setModalPhase('payment'), []);
  const backToGuests = useCallback(() => setModalPhase('guests'), []);
  const backToPreview = useCallback(() => setModalPhase('preview'), []);

  // ── Publish the evite so its public link works immediately ───────────
  // Called on entering the Share step (and as a fallback at payment).
  // Upserts: creates a published event the first time, updates it on
  // re-entry (e.g. the host went Back, tweaked the design, and returned).
  // Returns the event id, or null on failure.
  const publishEvite = useCallback(async (): Promise<string | null> => {
    setPublishing(true);
    setPublishError('');
    try {
      // Uploaded / canvas designs are local blob:/data: URLs — upload them so
      // the public page has a real, hosted cover image to render.
      let coverImageUrl: string | null = null;
      if (uploadedTemplate?.url) {
        if (uploadedTemplate.url.startsWith('blob:') || uploadedTemplate.url.startsWith('data:')) {
          try {
            const res = await fetch(uploadedTemplate.url);
            const blob = await res.blob();
            const file = new File([blob], uploadedTemplate.fileName || 'invitation.png', {
              type: blob.type || 'image/png',
            });
            const up = await api.uploadMedia(file);
            coverImageUrl = up.public_url;
          } catch (e) {
            console.warn('Cover image upload failed:', e);
          }
        } else {
          coverImageUrl = uploadedTemplate.url;
        }
      } else if (selectedTemplate && !selectedTemplate.layout) {
        // Stock template without a positioned layout — its flat preview image
        // already conveys the design.
        coverImageUrl = selectedTemplate.previewImage;
      }

      const payload: Record<string, unknown> = {
        title:
          formData.eventName ||
          formData.celebrantName ||
          formData.brideName ||
          formData.motherName ||
          formData.parentNames ||
          formData.hostName ||
          'My Event',
        description: formData.customMessage || null,
        event_date: formData.eventDate || new Date().toISOString().split('T')[0],
        event_time: formData.eventTime || null,
        location: formData.venue || null,
        template_id: selectedTemplateId,
        cover_image_url: coverImageUrl,
        form_data: formData,
        status: 'published',
      };

      let eventId = publishedEventId;
      if (eventId) {
        await api.updateEvent(eventId, payload);
      } else {
        const evt = await api.createEvent(payload);
        eventId = evt.id;
        setPublishedEventId(eventId);
      }

      // Persist the font/color/size/position overrides + photo overlay so the
      // public page re-renders the design exactly as the host arranged it.
      if (eventId && selectedTemplateId && (Object.keys(fieldOverrides).length > 0 || photoOverlay)) {
        try {
          await api.createEviteCustomization({
            event_id: eventId,
            template_id: selectedTemplateId,
            field_overrides: fieldOverrides,
            photo_overlay: photoOverlay as unknown as Record<string, unknown> | null,
          });
        } catch (e) {
          console.warn('Evite customization save skipped:', e);
        }
      }

      return eventId;
    } catch (e) {
      console.warn('Evite publish failed:', e);
      setPublishError(e instanceof Error ? e.message : 'Could not publish your evite. Please try again.');
      return null;
    } finally {
      setPublishing(false);
    }
  }, [uploadedTemplate, selectedTemplate, selectedTemplateId, formData, fieldOverrides, photoOverlay, publishedEventId]);

  const handlePaymentConfirm = useCallback(async () => {
    try {
      // The evite was already created + published at the Share step; reuse it.
      // Fallback to publishing now if we somehow arrived here without an id.
      const eventId = publishedEventId ?? (await publishEvite());

      const filledGuests = guests.filter((g) => g.name.trim());
      if (eventId && filledGuests.length > 0) {
        const invitees = filledGuests.map((g) => ({
          name: g.name,
          email: g.email || undefined,
          phone: g.phone || undefined,
          source: 'manual' as const,
        }));
        await api.addInvitees(eventId, invitees);
      }

      try {
        localStorage.removeItem('mm_evite_draft');
      } catch {
        /* ignore */
      }
    } catch (e) {
      console.warn('Evite send skipped (likely logged out or offline):', e);
    }
    setModalPhase('sent');
  }, [publishedEventId, publishEvite, guests]);

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
        JSON.stringify({ ...parsed, pendingPhase: 'share' })
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
    // Keep the (now hidden) multi-events flag in sync so variant-template
    // navigation and the draft backup stay consistent.
    setHasSubEvents(true);
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
    // Removing the last event clears the hidden multi-events flag.
    if (subEventCount - 1 <= 0) setHasSubEvents(false);
  };

  // Selecting "Yes, different invitations" seeds two empty, unnamed slots so
  // the host starts from the same two-invitation layout the examples show
  // (unless they already have real slots in progress).
  const selectMultiInvitations = (multi: boolean) => {
    setMultipleInvitations(multi);
    if (multi) {
      setInvitationSlots((prev) => {
        // The default seed slot is named "Main Invitation" — treat that as empty
        // so a first-time "Yes" still expands to the two-slot starting layout.
        const hasContent = prev.some(
          (s) => s.url || (s.name.trim() && s.name !== 'Main Invitation')
        );
        if (prev.length >= 2 || hasContent) return prev;
        return [
          { id: 'slot-1', url: '', type: null, fileName: '', name: '' },
          { id: `slot-${Date.now()}`, url: '', type: null, fileName: '', name: '' },
        ];
      });
    }
  };

  // ── Invitation slots helpers (multiple invitations in upload) ───
  const addInvitationSlot = () => {
    setInvitationSlots((prev) => [
      ...prev,
      { id: `slot-${Date.now()}`, url: '', type: null, fileName: '', name: '' },
    ]);
  };

  const removeInvitationSlot = (id: string) => {
    setInvitationSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlotName = (id: string, name: string) => {
    setInvitationSlots((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleSlotFilePicked = (id: string, file: File, kind: 'image' | 'video') => {
    const url = URL.createObjectURL(file);
    setInvitationSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, url, type: kind, fileName: file.name } : s))
    );
  };


  // ── Upload handler ───────────────────────────────────────────────
  const handleFilePicked = useCallback(
    (file: File, kind: 'image' | 'video') => {
      const url = URL.createObjectURL(file);
      setUploadedTemplate({ url, type: kind, fileName: file.name });
    },
    []
  );

  const proceedFromUpload = useCallback(() => {
    if (multipleInvitations) {
      const filled = invitationSlots.filter((s) => s.url && s.type);
      if (!filled.length) return;
      setCurrentSlotIdx(0);
      setUploadedTemplate({ url: filled[0].url, type: filled[0].type!, fileName: filled[0].fileName });
      // With 2+ invitations the host is almost always running a multi-event
      // celebration (Mehendi/Sangeet/Wedding/Reception, etc.), so light up
      // the Multiple Events toggle by default AND seed the table with one
      // empty row so they can start typing right away. Form details (date,
      // venue, etc.) are shared across all uploaded invitations — clear
      // them once and let the host fill them on a single editor screen.
      if (filled.length >= 2) {
        setHasSubEvents(true);
        setFormData({ sub_events_count: '1' });
      } else {
        setFormData({});
      }
    } else {
      if (!uploadedTemplate) return;
    }
    setModalPhase('editor');
  }, [multipleInvitations, invitationSlots, uploadedTemplate]);

  // Multi-invite slot navigation — arrows in the editor preview that swap
  // which uploaded invitation is shown on the left. Does NOT touch formData;
  // event details stay constant across all slots.
  const filledSlots = useMemo(
    () => invitationSlots.filter((s) => s.url && s.type),
    [invitationSlots]
  );
  const prevSlot = useCallback(() => {
    if (!multipleInvitations || filledSlots.length < 2 || currentSlotIdx <= 0) return;
    const next = filledSlots[currentSlotIdx - 1];
    setCurrentSlotIdx(currentSlotIdx - 1);
    setUploadedTemplate({ url: next.url, type: next.type!, fileName: next.fileName });
  }, [multipleInvitations, filledSlots, currentSlotIdx]);
  const nextSlot = useCallback(() => {
    if (!multipleInvitations || filledSlots.length < 2 || currentSlotIdx >= filledSlots.length - 1)
      return;
    const next = filledSlots[currentSlotIdx + 1];
    setCurrentSlotIdx(currentSlotIdx + 1);
    setUploadedTemplate({ url: next.url, type: next.type!, fileName: next.fileName });
  }, [multipleInvitations, filledSlots, currentSlotIdx]);

  // ── Escape closes modal ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (modalPhase === 'editor' || modalPhase === 'upload' || modalPhase === 'signin' || modalPhase === 'canvas-editor'))
        closeAnyModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalPhase, closeAnyModal]);

  // Publish the evite the moment the host reaches the Share step so its link
  // works right away. Also covers resuming here after a sign-in redirect. The
  // guard prevents duplicate publishes; failures surface a Retry button below.
  useEffect(() => {
    if (modalPhase === 'share' && !publishedEventId && !publishing) {
      publishEvite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalPhase, publishedEventId]);

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

  // Restore the "choose design" step when returning from a route that lives
  // outside this component (e.g. the premium website builder). The builder's
  // Back button sends us to /create?stage=design&event=<id> so the user lands
  // back on the design-method screen instead of the event picker.
  useEffect(() => {
    if (searchParams.get('stage') !== 'design') return;
    const ev = searchParams.get('event');
    if (ev && eventTypes.some((e) => e.id === ev)) {
      setActiveFilter(ev as EventType);
      setPickerEvent(ev as EventType);
      setFlowStage('choose-design');
    }
    // Run once on mount — we only consume the query params on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Event-picker card staggered entrance.
  useEffect(() => {
    if (flowStage !== 'picker' || !pickerRef.current) return;
    const cards = pickerRef.current.querySelectorAll<HTMLElement>('.picker-card');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.05,
        duration: 0.4,
        ease: 'power3.out',
        // Clear the inline transform GSAP leaves behind, otherwise it overrides
        // the CSS hover:scale and the cards won't enlarge on hover.
        clearProps: 'transform',
      }
    );
  }, [flowStage]);

  // Loading transition — fill the progress bar, then reveal the gallery.
  useEffect(() => {
    if (flowStage !== 'loading') return;
    if (loadingBarRef.current) {
      gsap.fromTo(
        loadingBarRef.current,
        { width: '0%' },
        { width: '100%', duration: 2.8, ease: 'power1.inOut' }
      );
    }
    const t = setTimeout(() => setFlowStage('choose-design'), 3000);
    return () => clearTimeout(t);
  }, [flowStage]);

  // Design-method card staggered entrance.
  useEffect(() => {
    if (flowStage !== 'choose-design' || !chooseDesignRef.current) return;
    const cards = chooseDesignRef.current.querySelectorAll<HTMLElement>('.design-card');
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.07, duration: 0.42, ease: 'power3.out', clearProps: 'transform' }
    );
  }, [flowStage]);

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
    formData.motherName ||
    formData.parentNames ||
    formData.homeownerName ||
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
      className="page-bokeh-bg h-screen flex flex-col overflow-hidden relative"
    >
      <div
        className="fixed inset-0 z-0 opacity-30 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0yNSOWSBJLsv1-47TiuxQ15AFQ4nsrk2tyl20R-zvNNsiDXBNDhZVYz1yHqSCTtqtGcVjl35j2rrDIrA-d5xW6tM2FPDinMxC7wGNXKzBCT0JhfwdSkLFQPVqU1yfc1GtqRHSfxSmlitg3lWmrbcCqzLdzR4XsiD9nN9-_O7fp4ViDdX7MFMvLLa9exuWvETBq8HCVRb7NcpP7tWvqDoEWCeegHipJmlKBCM4gpRO9AROi6bPaa2gmQvHKabiYnelhLueCkgQ9QIe')`,
        }}
      />
      <div className="fixed inset-0 z-[1] bg-[#111914]/70 pointer-events-none" />

      {/* ════════════════════════════════════════════════════════════
          RESUME PROMPT (H10) — greet a returning host with their
          in-progress evite instead of silently dropping the draft.
          ════════════════════════════════════════════════════════════ */}
      {showResume && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(13, 21, 18, 0.94)', backdropFilter: 'blur(6px)' }}
        >
          <div className="relative w-full max-w-md bg-[#111914] border border-white/[0.09] shadow-2xl p-8 md:p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-[#9cb092]/15 border border-[#9cb092]/40 flex items-center justify-center mx-auto mb-5">
              <span className="material-icons text-[#9cb092] text-3xl">history</span>
            </div>
            <h2 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] leading-tight mb-3">
              Welcome <span className="text-[#9cb092] font-agatho italic">back</span>
            </h2>
            <p className="font-display text-sm text-[#b2c3b1]/80 leading-relaxed mb-8">
              You have {resumeLabel ? `a ${resumeLabel.toLowerCase()} ` : 'an '}invitation still in
              progress. Want to pick up where you left off?
            </p>
            <button
              onClick={resumeDraft}
              className="w-full py-3.5 bg-[#9cb092] text-[#111914] font-display text-[11px] tracking-[0.22em] uppercase font-bold hover:bg-[#adc4a3] transition-colors flex items-center justify-center gap-2"
            >
              Continue editing
              <span className="material-icons text-sm">arrow_forward</span>
            </button>
            <button
              onClick={discardDraft}
              className="mt-4 font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/55 hover:text-[#9cb092] transition-colors"
            >
              Start fresh
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          GALLERY — base page. Uses the same flow chrome as every other
          step (logo top-left · stepper · close top-right) instead of the
          marketing nav bar.
          ════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
        {flowStage === 'gallery' && (
          <>
            <FlowLogo onClick={closeToHome} size="lg" />
            <button
              onClick={closeToHome}
              aria-label="Close"
              className="absolute top-3 right-4 z-40 w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-[#9cb092]/40 transition-all duration-200"
            >
              <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
            </button>
          </>
        )}
        <div className="flex-shrink-0 px-6 md:px-10 pt-3 pb-3">
          <FlowStepper current={2} className="max-w-2xl mx-auto" />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden px-6 md:px-10">
          {/* Header — the Back control lives in the bottom bar (bottom-left),
              consistent with every other screen in the flow. */}
          <div className="py-3 md:py-4 flex-shrink-0 border-b border-white/[0.07]">
            <p className="font-display text-[9px] tracking-[0.32em] uppercase text-[#9cb092]/70 mb-1">
              {eventTypes.find((e) => e.id === activeFilter)?.label ?? 'Event'} designs
            </p>
            <h1 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] leading-tight">
              Choose your <span className="text-[#9cb092] font-agatho italic">design</span>
            </h1>
            <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#b2c3b1]/40 mt-1">
              Pick one of our ready-made designs below
            </p>
          </div>

          {/* Scroll wrapper — grid inside grows to its content height */}
          <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle">
            <div
              ref={galleryRef}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-4 pb-6"
            >
              {/* NOTE: the design-method tiles (upload / build-your-own /
                  premade / event-website) intentionally do NOT appear here.
                  The user has already chosen "Use our pre-existing designs" on
                  the previous screen, so this gallery shows only ready-made
                  templates. The other methods remain reachable via the Back
                  button (Design options). */}
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
                    No designs in this category yet — go back to try another way to design
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar — Back on the left (consistent placement site-wide) */}
          <div className="flex-shrink-0 flex items-center py-4 border-t border-white/[0.07]">
            <button
              onClick={() => setFlowStage('choose-design')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-[#9cb092]/40 transition-all duration-200 font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/70 hover:text-[#9cb092]"
            >
              <span className="material-icons text-[16px]">arrow_back</span>
              Back
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          EVENT PICKER — first step: "What are we celebrating today?"
          Covers the gallery until the user picks an event.
          ════════════════════════════════════════════════════════════ */}
      {flowStage === 'picker' && (
        <div
          className="page-bokeh-bg fixed inset-0 z-40 flex flex-col overflow-hidden"
          data-lenis-prevent
        >
          <EntryBackground />
          <FlowLogo size="lg" />
          <button
            onClick={closeToHome}
            aria-label="Close"
            className="absolute top-3 right-4 z-40 w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-[#9cb092]/40 transition-all duration-200"
          >
            <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
          </button>

          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto scrollbar-subtle">
           <div className="min-h-full flex flex-col items-center justify-center px-6 py-3 pt-16">
            <FlowStepper current={1} className="max-w-2xl mx-auto mb-4" />
            <div className="text-center mb-4">
              <p className="font-display text-[9px] tracking-[0.32em] uppercase text-[#9cb092]/70 mb-1">
                Let&apos;s begin
              </p>
              <h1 className="font-serif-exp text-xl md:text-2xl text-[#e4eee1] leading-tight">
                What are we <span className="text-[#9cb092] font-agatho italic">celebrating today?</span>
              </h1>
              <p className="font-display text-[10px] tracking-wide text-[#b2c3b1]/55 mt-1.5 max-w-md mx-auto leading-relaxed">
                Pick an event and we&apos;ll show you the designs made for it.
              </p>
            </div>

            <div
              ref={pickerRef}
              className="flex flex-wrap justify-center gap-3 w-full max-w-4xl"
            >
              {eventTypes.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => chooseEvent(ev.id)}
                  title={ev.description}
                  className="picker-card group relative overflow-hidden rounded-2xl bg-[#f3ead9] hover:bg-[#f9f2e6] border border-[#c4a882]/40 hover:border-[#9cb092]/70 shadow-sm hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:z-30 flex flex-col w-36 sm:w-40 h-[158px]"
                >
                  {/* Illustration — soft accent wash behind a hand-drawn scene */}
                  <div
                    className="relative flex-1 flex items-center justify-center px-3 pt-2"
                    style={{ background: `linear-gradient(to bottom, ${ev.color}26, transparent 85%)` }}
                  >
                    <EventIllustration id={ev.id} color={ev.color} className="w-full h-full max-h-[74px]" />
                  </div>
                  {/* Label + arrow */}
                  <div className="px-2 pb-2.5 pt-0.5 flex flex-col items-center">
                    <h3 className="font-serif-exp text-[14px] text-[#2a3328] leading-tight">
                      {ev.label}
                    </h3>
                    <span className="mt-1 w-6 h-6 rounded-full border border-[#7a8a6f]/45 flex items-center justify-center group-hover:bg-[#9cb092]/20 group-hover:border-[#9cb092]/60 transition-colors">
                      <span className="material-icons text-[#5f7256] text-[15px]">arrow_forward</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
           </div>
          </div>

          {/* Bottom bar — Back on the left (consistent placement site-wide) */}
          <div className="relative z-20 flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-white/[0.07]">
            <button
              onClick={closeToHome}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-[#9cb092]/40 transition-all duration-200 font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/70 hover:text-[#9cb092]"
            >
              <span className="material-icons text-[16px]">arrow_back</span>
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          CHOOSE-DESIGN — "How would you like to design your invitation?"
          Method cards shown after the event is picked, before the gallery.
          ════════════════════════════════════════════════════════════ */}
      {flowStage === 'choose-design' && (
        <div
          className="page-bokeh-bg fixed inset-0 z-40 flex flex-col overflow-hidden"
          data-lenis-prevent
        >
          <EntryBackground />
          <FlowLogo size="lg" />
          <button
            onClick={closeToHome}
            aria-label="Close"
            className="absolute top-3 right-4 z-40 w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-[#9cb092]/40 transition-all duration-200"
          >
            <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
          </button>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-3 pt-16 overflow-y-auto scrollbar-subtle">
            <FlowStepper current={2} className="max-w-2xl mx-auto mb-4" />
            <div className="text-center mb-4">
              <h1 className="font-serif-exp text-xl md:text-2xl text-[#e4eee1] leading-tight">
                How would you like to design your{' '}
                <span className="text-[#9cb092] font-agatho italic">
                  {eventTypes.find((e) => e.id === activeFilter)?.label ?? 'event'}
                </span>{' '}
                invitation?
              </h1>
              <p className="font-display text-[10px] tracking-wide text-[#b2c3b1]/55 mt-1.5">
                Choose the way that works best for you.
              </p>
            </div>

            <div
              ref={chooseDesignRef}
              className="flex flex-wrap justify-center gap-3 md:gap-4 w-full max-w-5xl mx-auto"
            >
              {([
                {
                  key: 'upload',
                  icon: 'cloud_upload',
                  title: 'Upload Your Own Design',
                  desc: "Upload your own design and we'll help you make it perfect.",
                  cta: 'Choose This',
                  onClick: openUploadFlow,
                  premium: false,
                },
                {
                  key: 'preexisting',
                  icon: 'grid_view',
                  title: 'Use Our Preexisting Designs',
                  desc: 'Browse our beautiful collection of ready-made templates.',
                  cta: 'Browse Templates',
                  onClick: () => setFlowStage('gallery'),
                  premium: false,
                },
                {
                  key: 'scratch',
                  icon: 'draw',
                  title: 'Build from Scratch',
                  desc: 'Start with a blank canvas and create your own unique design.',
                  cta: 'Start Designing',
                  onClick: openCanvasEditor,
                  premium: false,
                },
                {
                  key: 'premium',
                  icon: 'workspace_premium',
                  title: 'Use Our Premium Designs',
                  desc: 'Unlock exclusive, premium templates for a stunning impression.',
                  cta: 'Explore Premium',
                  onClick: () => navigate(`/website-builder?event=${activeFilter}&return=design`),
                  premium: true,
                },
              ] as const)
                .map((c) => (
                  <div
                    key={c.key}
                    className={`design-card relative flex flex-col items-center text-center px-4 py-5 border shadow-sm hover:shadow-xl transition-all duration-300 w-full sm:w-[220px] ${
                      c.premium
                        ? 'border-[#c4a882] bg-[#ece0c8] hover:bg-[#f2e8d5]'
                        : 'border-[#c4a882]/40 bg-[#f3ead9] hover:bg-[#f9f2e6] hover:border-[#9cb092]/70'
                    }`}
                    style={{ opacity: 0 }}
                  >
                    {c.premium && (
                      <span className="absolute top-2.5 right-2.5 font-display text-[7px] tracking-[0.2em] uppercase text-[#f7f2e8] bg-[#8a7346] px-2 py-0.5 font-bold">
                        Premium
                      </span>
                    )}
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center mb-3 border ${
                        c.premium
                          ? 'bg-[#9cb092]/25 border-[#7a8a6f]/60'
                          : 'bg-[#9cb092]/18 border-[#7a8a6f]/45'
                      }`}
                    >
                      <span className="material-icons text-[#5f7256] text-xl">{c.icon}</span>
                    </div>
                    <h3 className="font-serif-exp text-sm text-[#2a3328] leading-snug mb-1.5">
                      {c.title}
                    </h3>
                    <p className="font-display text-[9px] text-[#5a6b52] leading-relaxed mb-3 flex-1">
                      {c.desc}
                    </p>
                    <button
                      onClick={c.onClick}
                      className={`w-full py-2.5 font-display text-[9px] tracking-[0.2em] uppercase font-bold transition-colors ${
                        c.premium
                          ? 'bg-[#5f7256] text-[#f7f2e8] hover:bg-[#6f8465]'
                          : 'border border-[#7a8a6f]/55 text-[#4a5942] hover:bg-[#9cb092]/20'
                      }`}
                    >
                      {c.cta}
                    </button>
                  </div>
                ))}
            </div>

            {/* Reassurance strip */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-5 max-w-4xl">
              {[
                { icon: 'verified', label: 'High Quality', sub: 'HD designs for print & digital' },
                { icon: 'smartphone', label: 'Mobile Friendly', sub: 'Perfect on all devices' },
                { icon: 'palette', label: 'Fully Customizable', sub: 'Edit colors, fonts & more' },
                { icon: 'lock', label: 'Your Data is Safe', sub: 'We respect your privacy' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <span className="material-icons text-[#9cb092]/70 text-lg">{f.icon}</span>
                  <div className="text-left">
                    <p className="font-display text-[10px] tracking-[0.1em] uppercase text-[#e4eee1]/85 leading-tight">
                      {f.label}
                    </p>
                    <p className="font-display text-[8px] text-[#b2c3b1]/45 leading-tight">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar — Back on the left (consistent placement site-wide) */}
          <div className="relative z-20 flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-white/[0.07]">
            <button
              onClick={() => setFlowStage('picker')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-[#9cb092]/40 transition-all duration-200 font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/70 hover:text-[#9cb092]"
            >
              <span className="material-icons text-[16px]">arrow_back</span>
              Change Event
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          LOADING TRANSITION — "Creating your perfect experience…"
          ════════════════════════════════════════════════════════════ */}
      {flowStage === 'loading' && pickerEvent && (() => {
        const ev = eventTypes.find((e) => e.id === pickerEvent);
        if (!ev) return null;
        return (
          <div
            className="page-bokeh-bg fixed inset-0 z-40 flex flex-col items-center justify-center px-6"
          >
            <EntryBackground />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 shadow-2xl"
                style={{ backgroundColor: `${ev.color}1f`, border: `1px solid ${ev.color}55` }}
              >
                <span className="material-icons text-5xl" style={{ color: ev.color }}>
                  {ev.icon}
                </span>
              </div>
              <h2 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] leading-tight">
                {ev.label}
              </h2>
              <p className="font-display text-[11px] tracking-wide text-[#b2c3b1]/60 mt-3 max-w-xs leading-relaxed">
                {ev.description}
              </p>

              {/* Progress bar */}
              <div className="w-56 h-1 bg-white/10 rounded-full overflow-hidden mt-8">
                <div
                  ref={loadingBarRef}
                  className="h-full rounded-full"
                  style={{ width: '0%', backgroundColor: '#9cb092' }}
                />
              </div>
              <p className="font-display text-[9px] tracking-[0.3em] uppercase text-[#b2c3b1]/45 mt-4">
                Creating your perfect experience…
              </p>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════
          UPLOAD MODAL
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'upload' && (
        <div
          ref={editorBackdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3"
          style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAnyModal();
          }}
        >
          <div
            ref={editorPanelRef}
            className="relative w-full h-full bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <FlowLogo onClick={closeToHome} />
            <button
              onClick={closeToHome}
              aria-label="Close"
              className="absolute top-3 right-3 z-40 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
            >
              <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
            </button>

            <div className="px-6 md:px-10 pt-4 pb-3 border-b border-white/[0.06]">
              <FlowStepper current={2} className="max-w-2xl mx-auto mb-2.5" />
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="font-serif-exp text-lg md:text-xl text-[#e4eee1] leading-tight">
                  Upload Your Own <span className="text-[#9cb092] font-agatho italic">Design</span>
                </h2>
                <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/45">
                  Image or video
                </p>
              </div>
            </div>

            <div data-lenis-prevent className="flex-1 min-h-0 px-6 md:px-10 py-5 space-y-5 overflow-y-auto scrollbar-subtle">

              {/* ── Different-invitations question (wedding & others only) ──
                  Non-supporting events skip this entirely and go straight to a
                  single image/video upload. */}
              {SUPPORTS_MULTI_EVENTS.includes(activeFilter) && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="font-agatho italic text-base text-[#9cb092]">Let&apos;s personalize your invites</p>
                    <h3 className="font-serif-exp text-lg md:text-xl text-[#e4eee1] leading-tight mt-0.5">
                      Will different guests receive{' '}
                      <span className="text-[#9cb092] font-agatho italic">different invitations?</span>
                    </h3>
                    <p className="font-display text-[10px] tracking-wide text-[#b2c3b1]/55 mt-1.5 max-w-lg mx-auto leading-relaxed">
                      Upload multiple invitation designs and send the right invite to the right guests.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {/* YES */}
                    <button
                      onClick={() => selectMultiInvitations(true)}
                      className={`relative text-center px-5 py-5 border transition-all duration-200 ${
                        multipleInvitations
                          ? 'border-[#9cb092] bg-[#9cb092]/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-[#9cb092]/40'
                      }`}
                    >
                      {multipleInvitations && (
                        <span className="material-icons absolute top-2 right-2 text-[#9cb092] text-base">check_circle</span>
                      )}
                      <div className="w-10 h-10 rounded-full bg-[#9cb092]/15 border border-[#9cb092]/35 flex items-center justify-center mx-auto mb-2.5">
                        <span className="material-icons text-[#9cb092] text-lg">groups</span>
                      </div>
                      <p className="font-serif-exp text-[13px] text-[#e4eee1] leading-snug mb-1">
                        Yes, send different invitations to different guests
                      </p>
                      <p className="font-display text-[9px] text-[#b2c3b1]/50 leading-relaxed">
                        Upload and manage multiple invitation designs.
                      </p>
                    </button>

                    {/* NO */}
                    <button
                      onClick={() => selectMultiInvitations(false)}
                      className={`relative text-center px-5 py-5 border transition-all duration-200 ${
                        !multipleInvitations
                          ? 'border-[#9cb092] bg-[#9cb092]/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-[#9cb092]/40'
                      }`}
                    >
                      {!multipleInvitations && (
                        <span className="material-icons absolute top-2 right-2 text-[#9cb092] text-base">check_circle</span>
                      )}
                      <div className="w-10 h-10 rounded-full bg-[#9cb092]/15 border border-[#9cb092]/35 flex items-center justify-center mx-auto mb-2.5">
                        <span className="material-icons text-[#9cb092] text-lg">person</span>
                      </div>
                      <p className="font-serif-exp text-[13px] text-[#e4eee1] leading-snug mb-1">
                        No, send the same invitation to all guests
                      </p>
                      <p className="font-display text-[9px] text-[#b2c3b1]/50 leading-relaxed">
                        Upload one invitation design and send it to everyone.
                      </p>
                    </button>
                  </div>

                  <div className="border-t border-white/[0.06] pt-1" />
                </div>
              )}

              {/* ── Multiple invitations: card grid of slots ── */}
              {multipleInvitations ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {invitationSlots.map((slot, slotIdx) => {
                      const examples = INVITE_NAME_EXAMPLES[slotIdx % INVITE_NAME_EXAMPLES.length];
                      return (
                        <div
                          key={slot.id}
                          className="relative border border-white/[0.09] bg-white/[0.02] p-4 pt-10 flex flex-col"
                        >
                          {/* Number badge */}
                          <span className="absolute top-3 left-3 w-6 h-6 rounded-md bg-[#9cb092]/15 border border-[#9cb092]/40 flex items-center justify-center font-display text-[11px] text-[#9cb092] font-bold">
                            {slotIdx + 1}
                          </span>
                          {invitationSlots.length > 1 && (
                            <button
                              onClick={() => removeInvitationSlot(slot.id)}
                              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center border border-white/10 text-[#b2c3b1]/40 hover:text-red-400/80 hover:border-red-400/30 transition-all"
                              title="Remove this invitation"
                            >
                              <span className="material-icons text-sm">close</span>
                            </button>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            {/* Upload area */}
                            <div>
                              {slot.url ? (
                                <div className="relative aspect-[3/4] bg-[#0d1512] border border-white/10 overflow-hidden flex items-center justify-center">
                                  {slot.type === 'image' ? (
                                    <img src={slot.url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <video src={slot.url} muted className="w-full h-full object-cover" />
                                  )}
                                </div>
                              ) : (
                                <label className="cursor-pointer aspect-[3/4] flex flex-col items-center justify-center gap-1.5 px-2 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/70 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all text-center">
                                  <span className="material-icons text-[#9cb092] text-2xl">cloud_upload</span>
                                  <span className="font-display text-[9px] tracking-[0.1em] uppercase text-[#9cb092] leading-tight">
                                    Upload Invitation {slotIdx + 1}
                                  </span>
                                  <span className="font-display text-[8px] text-[#b2c3b1]/45 leading-tight">
                                    JPG, PNG or MP4
                                    <br />
                                    (Max. 10MB)
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*,video/mp4,video/quicktime"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      const kind = f.type.startsWith('video') ? 'video' : 'image';
                                      handleSlotFilePicked(slot.id, f, kind);
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                              )}
                              {slot.url && (
                                <label className="cursor-pointer mt-2 font-display text-[9px] tracking-[0.12em] uppercase text-[#9cb092] hover:text-[#adc4a3] transition-colors flex items-center justify-center gap-1 border border-white/15 py-1.5 hover:border-[#9cb092]/40">
                                  <span className="material-icons text-sm">refresh</span>
                                  Replace
                                  <input
                                    type="file"
                                    accept="image/*,video/mp4,video/quicktime"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      const kind = f.type.startsWith('video') ? 'video' : 'image';
                                      handleSlotFilePicked(slot.id, f, kind);
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                              )}
                            </div>

                            {/* Invite name examples */}
                            <div>
                              <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#9cb092]/80 mb-1.5">
                                Invite Name (Examples)
                              </p>
                              <ul className="space-y-1">
                                {examples.map((ex) => (
                                  <li
                                    key={ex}
                                    className="font-display text-[10px] text-[#b2c3b1]/60 flex items-center gap-1.5 leading-tight"
                                  >
                                    <span className="w-1 h-1 rounded-full bg-[#9cb092]/60 flex-shrink-0" />
                                    {ex}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Name input */}
                          <div className="mt-3">
                            <input
                              type="text"
                              value={slot.name}
                              onChange={(e) => updateSlotName(slot.id, e.target.value)}
                              placeholder="Enter a name for this invitation"
                              className={`bg-white/[0.06] border text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 px-3 h-9 text-xs rounded-sm w-full outline-none transition-colors ${
                                slot.url && !slot.name.trim()
                                  ? 'border-amber-400/50 focus:border-amber-400'
                                  : 'border-white/15 focus:border-[#9cb092]'
                              }`}
                            />
                            {slot.url && !slot.name.trim() && (
                              <p className="font-display text-[8px] text-amber-400/70 mt-1">
                                Give this invitation a name so you can assign guests to it.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Another Invitation card */}
                    <button
                      onClick={addInvitationSlot}
                      className="border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all flex flex-col items-center justify-center gap-2.5 p-4 min-h-[220px] text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#9cb092]/15 border border-[#9cb092]/40 flex items-center justify-center">
                        <span className="material-icons text-[#9cb092]">add</span>
                      </div>
                      <span className="font-serif-exp text-sm text-[#e4eee1]">Add Another Invitation</span>
                      <span className="font-display text-[9px] text-[#b2c3b1]/50 leading-relaxed max-w-[160px]">
                        You can add more invitations later
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Single upload ── */
                <>
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
                          accept="video/mp4,video/quicktime"
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
                          <span className="text-[#b2c3b1]/30">
                            · {uploadedTemplate.type === 'image' ? 'JPG/PNG ≤ 10MB' : 'MP4/MOV ≤ 50MB'}
                          </span>
                        </p>
                        <button
                          onClick={() => setUploadedTemplate(null)}
                          className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/55 hover:text-red-400/80 transition-colors flex items-center gap-1.5"
                        >
                          <span className="material-icons text-sm">refresh</span>
                          Replace
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <p className="font-display text-[10px] text-[#b2c3b1]/55 leading-relaxed border-t border-white/[0.06] pt-4">
                <span className="material-icons text-[#9cb092] text-sm align-middle mr-1">info</span>
                We won't overlay or modify anything on your uploaded design — but we'll still ask
                for the basic event details so we can manage your guest list and RSVPs.
              </p>
            </div>

            <div className="px-6 md:px-10 py-2.5 border-t border-white/[0.06] bg-[#0e1712] flex items-center justify-between gap-3">
              <button
                onClick={closeAnyModal}
                className="py-2 px-4 border border-white/15 text-[#b2c3b1] font-display text-[10px] tracking-[0.2em] uppercase hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all flex items-center gap-2"
              >
                <span className="material-icons text-sm">arrow_back</span>
                Back
              </button>
              {(() => {
                // Multi-invitation: every uploaded invitation must be given a
                // name (it's how guests are later assigned to the right invite),
                // and at least one invitation must be uploaded.
                const filledForProceed = invitationSlots.filter((s) => s.url);
                const canProceed = multipleInvitations
                  ? filledForProceed.length > 0 && filledForProceed.every((s) => s.name.trim())
                  : !!uploadedTemplate;
                return (
                  <button
                    onClick={proceedFromUpload}
                    disabled={!canProceed}
                    className={`py-2 px-7 font-display text-[11px] tracking-[0.22em] uppercase font-bold transition-colors flex items-center gap-2 ${
                      canProceed
                        ? 'bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3]'
                        : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                    }`}
                  >
                    Continue
                    <span className="material-icons text-sm">arrow_forward</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          BUILD-YOUR-OWN CANVAS EDITOR
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'canvas-editor' && (
        <CanvasEditor
          key={pickedCanvasTemplate?.id ?? 'blank'}
          eventType={activeFilter}
          initialTemplateId={null}
          canvasWidth={pickedCanvasTemplate?.canvasWidth}
          canvasHeight={pickedCanvasTemplate?.canvasHeight}
          initialBackground={pickedCanvasTemplate?.background}
          initialElements={pickedCanvasTemplate?.elements}
          onClose={() => setModalPhase(null)}
          onFinish={handleCanvasEditorFinish}
        />
      )}

      {/* ════════════════════════════════════════════════════════════
          TEMPLATE EDITOR MODAL
          ════════════════════════════════════════════════════════════ */}
      {(selectedTemplate || uploadedTemplate) && modalPhase === 'editor' && (
        <div
          ref={editorBackdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3"
          style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAnyModal();
          }}
        >
          <div
            ref={editorPanelRef}
            className="relative w-full h-full flex flex-col bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <FlowLogo onClick={closeToHome} />
            {/* ── Modal top bar: stepper on top, then title + controls ── */}
            <div className="flex-shrink-0 px-6 md:px-8 py-3 border-b border-white/[0.07] bg-[#0e1712]">
              <FlowStepper current={3} className="max-w-2xl mx-auto mb-2.5" />
              <div className="flex items-center justify-between gap-4">
              {/* Left: title + optional invitation slot label */}
              <div className="min-w-0">
                <h2 className="font-serif-exp text-base md:text-lg text-[#e4eee1] leading-tight truncate">
                  Let's bring your celebration <span className="text-[#9cb092] font-agatho italic">to life</span>
                </h2>
                {multipleInvitations && invitationSlots.filter(s => s.url && s.type).length > 1 && (
                  <p className="font-display text-[9px] tracking-[0.18em] uppercase text-[#9cb092]/55 truncate mt-0.5">
                    Invitation {currentSlotIdx + 1} of {invitationSlots.filter(s => s.url && s.type).length}
                    {' · '}
                    {invitationSlots.filter(s => s.url && s.type)[currentSlotIdx]?.name || 'Enter Details'}
                  </p>
                )}
              </div>

              {/* Right: close only. The "Multiple Events" toggle was removed —
                 hosts add extra events straight from the "Add Another Event"
                 button in the Additional Events section of the form below. */}
              <div className="flex items-center gap-3">
                <button
                  onClick={closeToHome}
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
                >
                  <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
                </button>
              </div>
              </div>
            </div>

            {/* ── Two-column body ── */}
            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

            {/* ── LEFT: image / video preview ─────────────────────── */}
            <div className="flex-shrink-0 h-[40vh] md:h-auto md:w-[50%] md:min-h-0 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-white/[0.07]">
              <div className="flex-1 relative overflow-hidden bg-[#0d1512] flex items-center justify-center">
                <div
                  className={`relative h-full max-w-full overflow-hidden${
                    selectedTemplate?.layout ? '' : ' aspect-[9/16]'
                  }`}
                  style={
                    selectedTemplate?.layout
                      ? {
                          aspectRatio: `${selectedTemplate.layout.naturalWidth} / ${selectedTemplate.layout.naturalHeight}`,
                        }
                      : undefined
                  }
                >
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
                  ) : selectedTemplate?.layout ? (
                    <TemplateRenderer
                      template={selectedTemplate}
                      formData={formData}
                      overrides={fieldOverrides}
                      photoOverlay={photoOverlay}
                      interactive={rightPanelTab === 'customize'}
                      selectedKey={selectedOverrideKey}
                      onSelectField={setSelectedOverrideKey}
                      onMoveField={(key, x, y) => setOverride(key, { x, y })}
                      onMovePhoto={(x, y) =>
                        setPhotoOverlay((prev) => (prev ? { ...prev, x, y } : prev))
                      }
                    />
                  ) : selectedTemplate ? (
                    <img
                      ref={mainImgRef}
                      src={selectedTemplate.previewImage}
                      alt={selectedTemplate.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null}

                  {/* Live overlay — only for stock templates without a positioned layout */}
                  {!uploadedTemplate && selectedTemplate && !selectedTemplate.layout && (
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
                      </div>
                    </div>
                  )}
                </div>

                {/* Prev / Next arrows.
                    • Multi-event + variant group → navigate within the variant
                      family (2-event ↔ 3-event ↔ 4-event ↔ 5-event).
                    • Otherwise → navigate across the full gallery as before. */}
                {!uploadedTemplate && (variantTemplates ? variantIdx > 0 : currentIdx > 0) && (
                  <button
                    onClick={prevTemplate}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                    title={variantTemplates ? 'Previous variant' : 'Previous template'}
                  >
                    <span className="material-icons text-white text-[18px]">chevron_left</span>
                  </button>
                )}
                {!uploadedTemplate && (
                  variantTemplates
                    ? variantIdx < variantTemplates.length - 1
                    : currentIdx < visibleTemplates.length - 1
                ) && (
                  <button
                    onClick={nextTemplate}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                    title={variantTemplates ? 'Next variant' : 'Next template'}
                  >
                    <span className="material-icons text-white text-[18px]">chevron_right</span>
                  </button>
                )}

                {/* Multi-invite slot navigation */}
                {uploadedTemplate && multipleInvitations && filledSlots.length >= 2 && currentSlotIdx > 0 && (
                  <button
                    onClick={prevSlot}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                    title="Previous invitation"
                  >
                    <span className="material-icons text-white text-[18px]">chevron_left</span>
                  </button>
                )}
                {uploadedTemplate && multipleInvitations && filledSlots.length >= 2 && currentSlotIdx < filledSlots.length - 1 && (
                  <button
                    onClick={nextSlot}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                    title="Next invitation"
                  >
                    <span className="material-icons text-white text-[18px]">chevron_right</span>
                  </button>
                )}

                {!uploadedTemplate && (
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 pointer-events-none">
                    <span className="font-display text-[10px] text-white/60 tracking-widest">
                      {variantTemplates
                        ? `${variantTemplates[variantIdx]?.variantEventCount ?? '?'} Events · Style ${variantIdx + 1} / ${variantTemplates.length}`
                        : `${currentIdx + 1} / ${visibleTemplates.length}`}
                    </span>
                  </div>
                )}
                {uploadedTemplate && multipleInvitations && filledSlots.length >= 2 && (
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 pointer-events-none">
                    <span className="font-display text-[10px] text-white/70 tracking-widest">
                      {filledSlots[currentSlotIdx]?.name?.trim() || `Invitation ${currentSlotIdx + 1}`} · {currentSlotIdx + 1} / {filledSlots.length}
                    </span>
                  </div>
                )}

                {/* The "Customize Design" entry and the "Done" / "Back to
                    details" control now live in the right-side panel headers
                    (below) rather than overlaid on the preview artwork. */}
              </div>
            </div>

            {/* ── RIGHT: form (scrollable) ────────────────────────── */}
            <div className="flex-1 md:flex-1 min-h-0 flex flex-col overflow-hidden">
              {/* Slim panel headers (side). Details mode carries the "Customize
                  Design" entry — moved off the preview so it no longer covers
                  the artwork; customize mode carries "Back to details". */}
              {selectedTemplate?.layout && rightPanelTab === 'details' && (
                <div className="flex-shrink-0 flex items-center justify-between gap-2 px-6 md:px-8 py-3 border-b border-white/[0.06] bg-[#0e1712]">
                  <p className="font-display text-[10px] tracking-[0.18em] uppercase text-[#9cb092] flex items-center gap-1.5">
                    <span className="material-icons text-[14px]">event</span>
                    Event Details
                  </p>
                  <button
                    onClick={() => { if (isEditorValid) setRightPanelTab('customize'); }}
                    disabled={!isEditorValid}
                    title={isEditorValid ? 'Customize fonts, colors, size & position' : 'Fill in all required details to customize'}
                    className={`font-display text-[9px] tracking-[0.18em] uppercase transition-colors flex items-center gap-1.5 ${
                      isEditorValid ? 'text-[#9cb092] hover:text-[#adc4a3]' : 'text-[#b2c3b1]/35 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-icons text-[13px]">{isEditorValid ? 'edit' : 'lock'}</span>
                    {isEditorValid ? 'Customize Design' : 'Fill details to customize'}
                  </button>
                </div>
              )}
              {selectedTemplate?.layout && rightPanelTab === 'customize' && (
                <div className="flex-shrink-0 flex items-center justify-between gap-2 px-6 md:px-8 py-3 border-b border-white/[0.06] bg-[#0e1712]">
                  <p className="font-display text-[10px] tracking-[0.18em] uppercase text-[#9cb092] flex items-center gap-1.5">
                    <span className="material-icons text-[14px]">tune</span>
                    Customize Design
                  </p>
                  <button
                    onClick={() => setRightPanelTab('details')}
                    className="font-display text-[9px] tracking-[0.18em] uppercase text-[#b2c3b1]/60 hover:text-[#9cb092] transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-icons text-[13px]">arrow_back</span>
                    Back to details
                  </button>
                </div>
              )}

              {selectedTemplate?.layout && rightPanelTab === 'customize' ? (
                <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 md:px-8 pt-6 pb-5 space-y-6">
                  {/* ── Text field list ── */}
                  <div>
                    <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092]/80 mb-2 flex items-center gap-1.5">
                      <span className="material-icons text-sm">text_fields</span>
                      Text Fields
                    </p>
                    <p className="font-display text-[9px] text-[#b2c3b1]/45 leading-relaxed mb-2 normal-case tracking-normal">
                      Tip: double-click any element on the preview to select it, then drag it to reposition.
                    </p>
                    <div className="space-y-1">
                      {customizableFields.map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setSelectedOverrideKey(f.key)}
                          className={`w-full text-left px-3 py-2 font-display text-[11px] tracking-wide transition-colors border ${
                            selectedOverrideKey === f.key
                              ? 'border-[#9cb092]/60 bg-[#9cb092]/10 text-[#9cb092]'
                              : 'border-white/10 text-[#e4eee1]/80 hover:border-[#9cb092]/30'
                          }`}
                        >
                          {f.label}
                          {fieldOverrides[f.key] && (
                            <span className="ml-2 text-[8px] text-[#9cb092]/70 uppercase tracking-[0.15em]">edited</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Editing controls for the selected field ── */}
                  {selectedOverrideField && selectedOverrideKey && (
                    <div className="border-t border-white/[0.07] pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092]/80">
                          Edit Field
                        </p>
                        {fieldOverrides[selectedOverrideKey] && (
                          <button
                            onClick={() =>
                              setFieldOverrides((prev) => {
                                const next = { ...prev };
                                delete next[selectedOverrideKey];
                                return next;
                              })
                            }
                            className="font-display text-[8px] tracking-[0.15em] uppercase text-[#b2c3b1]/50 hover:text-red-400/70 transition-colors"
                          >
                            Reset to default
                          </button>
                        )}
                      </div>

                      {/* Font */}
                      <div>
                        <label className="block font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 mb-1.5">
                          Font
                        </label>
                        <select
                          value={selectedOverrideField.fontFamily}
                          onChange={(e) => setOverride(selectedOverrideKey, { fontFamily: e.target.value })}
                          className="bg-white/[0.06] border border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display px-3 h-10 text-sm rounded-sm w-full outline-none transition-colors"
                        >
                          {FONT_CATEGORIES.map((cat) => (
                            <optgroup key={cat.label} label={cat.label}>
                              {cat.fonts.map((f) => (
                                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      {/* Size */}
                      <div>
                        <label className="block font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 mb-1.5">
                          Size
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setOverride(selectedOverrideKey, { fontSize: Math.max(8, Math.round(selectedOverrideField.fontSize - 4)) })}
                            className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                            title="Smaller"
                          >
                            <span className="material-icons text-[#9cb092] text-base">remove</span>
                          </button>
                          <input
                            type="range"
                            min={8}
                            max={400}
                            step={1}
                            value={Math.round(selectedOverrideField.fontSize)}
                            onChange={(e) => setOverride(selectedOverrideKey, { fontSize: Number(e.target.value) })}
                            className="flex-1 accent-[#9cb092] cursor-pointer"
                          />
                          <button
                            onClick={() => setOverride(selectedOverrideKey, { fontSize: Math.min(400, Math.round(selectedOverrideField.fontSize + 4)) })}
                            className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                            title="Bigger"
                          >
                            <span className="material-icons text-[#9cb092] text-base">add</span>
                          </button>
                          <span className="font-display text-[10px] text-[#b2c3b1]/60 w-8 text-right tabular-nums">
                            {Math.round(selectedOverrideField.fontSize)}
                          </span>
                        </div>
                      </div>

                      {/* Color */}
                      <div>
                        <label className="block font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 mb-1.5">
                          Color
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {COLOR_SWATCHES.map((c) => (
                            <button
                              key={c}
                              onClick={() => setOverride(selectedOverrideKey, { color: c })}
                              aria-label={`Set color ${c}`}
                              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                                selectedOverrideField.color === c ? 'border-[#9cb092]' : 'border-white/10'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <input
                          type="color"
                          value={selectedOverrideField.color}
                          onChange={(e) => setOverride(selectedOverrideKey, { color: e.target.value })}
                          className="h-9 w-full bg-white/[0.06] border border-white/15 rounded-sm cursor-pointer"
                        />
                      </div>

                      {/* Position */}
                      <div>
                        <label className="block font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 mb-1.5">
                          Position
                        </label>
                        <p className="font-display text-[9px] text-[#b2c3b1]/45 leading-relaxed mb-2 normal-case tracking-normal">
                          Drag the element on the preview, or nudge with the arrows for precision.
                        </p>
                        <div className="grid grid-cols-3 gap-1.5 w-fit">
                          <div />
                          <button
                            onClick={() => nudgeOverride(selectedOverrideKey, 'y', -4, customizableFields.find((f) => f.key === selectedOverrideKey)!.field)}
                            className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                          >
                            <span className="material-icons text-[#9cb092] text-base">arrow_upward</span>
                          </button>
                          <div />
                          <button
                            onClick={() => nudgeOverride(selectedOverrideKey, 'x', -4, customizableFields.find((f) => f.key === selectedOverrideKey)!.field)}
                            className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                          >
                            <span className="material-icons text-[#9cb092] text-base">arrow_back</span>
                          </button>
                          <button
                            onClick={() => setFieldOverrides((prev) => { const next = { ...prev }; delete next[selectedOverrideKey]; return next; })}
                            className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                            title="Reset position"
                          >
                            <span className="material-icons text-[#b2c3b1]/50 text-sm">restart_alt</span>
                          </button>
                          <button
                            onClick={() => nudgeOverride(selectedOverrideKey, 'x', 4, customizableFields.find((f) => f.key === selectedOverrideKey)!.field)}
                            className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                          >
                            <span className="material-icons text-[#9cb092] text-base">arrow_forward</span>
                          </button>
                          <div />
                          <button
                            onClick={() => nudgeOverride(selectedOverrideKey, 'y', 4, customizableFields.find((f) => f.key === selectedOverrideKey)!.field)}
                            className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                          >
                            <span className="material-icons text-[#9cb092] text-base">arrow_downward</span>
                          </button>
                          <div />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Photo overlay ── */}
                  <div className="border-t border-white/[0.07] pt-4 space-y-3">
                    <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092]/80 flex items-center gap-1.5">
                      <span className="material-icons text-sm">add_a_photo</span>
                      Add Your Photo
                    </p>

                    {!photoOverlay ? (
                      <label className="flex items-center justify-center gap-2 border border-dashed border-white/20 hover:border-[#9cb092]/50 py-4 cursor-pointer transition-colors font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/70">
                        <span className="material-icons text-sm">upload</span>
                        {photoUploading ? 'Uploading…' : 'Upload a photo'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={photoUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoUpload(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={photoOverlay.src} alt="Your upload" className="w-12 h-12 object-cover rounded-sm border border-white/10" />
                          <button
                            onClick={() => setPhotoOverlay(null)}
                            className="font-display text-[9px] tracking-[0.12em] uppercase text-[#b2c3b1]/50 hover:text-red-400/70 transition-colors"
                          >
                            Remove photo
                          </button>
                        </div>

                        <div>
                          <label className="block font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 mb-1.5">
                            Shape
                          </label>
                          <div className="flex gap-2">
                            {(['circle', 'square', 'arch'] as const).map((shape) => (
                              <button
                                key={shape}
                                onClick={() => setPhotoOverlay((prev) => prev && { ...prev, shape })}
                                className={`px-3 py-1.5 font-display text-[9px] tracking-[0.12em] uppercase border transition-colors ${
                                  photoOverlay.shape === shape
                                    ? 'border-[#9cb092]/60 bg-[#9cb092]/10 text-[#9cb092]'
                                    : 'border-white/10 text-[#e4eee1]/70 hover:border-[#9cb092]/30'
                                }`}
                              >
                                {shape}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 mb-1.5">
                            Position &amp; Size
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="grid grid-cols-3 gap-1.5 w-fit">
                              <div />
                              <button
                                onClick={() => setPhotoOverlay((prev) => prev && { ...prev, y: prev.y - 4 })}
                                className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                              >
                                <span className="material-icons text-[#9cb092] text-base">arrow_upward</span>
                              </button>
                              <div />
                              <button
                                onClick={() => setPhotoOverlay((prev) => prev && { ...prev, x: prev.x - 4 })}
                                className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                              >
                                <span className="material-icons text-[#9cb092] text-base">arrow_back</span>
                              </button>
                              <div />
                              <button
                                onClick={() => setPhotoOverlay((prev) => prev && { ...prev, x: prev.x + 4 })}
                                className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                              >
                                <span className="material-icons text-[#9cb092] text-base">arrow_forward</span>
                              </button>
                              <div />
                              <button
                                onClick={() => setPhotoOverlay((prev) => prev && { ...prev, y: prev.y + 4 })}
                                className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                              >
                                <span className="material-icons text-[#9cb092] text-base">arrow_downward</span>
                              </button>
                              <div />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setPhotoOverlay((prev) => prev && { ...prev, size: Math.max(40, prev.size - 20) })}
                                className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                                title="Smaller"
                              >
                                <span className="material-icons text-[#9cb092] text-base">remove</span>
                              </button>
                              <button
                                onClick={() => setPhotoOverlay((prev) => prev && { ...prev, size: prev.size + 20 })}
                                className="w-9 h-9 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10"
                                title="Bigger"
                              >
                                <span className="material-icons text-[#9cb092] text-base">add</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
              <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 md:px-8 pt-6 pb-5">
                {/* Editor fields — 2-column grid. Venue + textareas span full width. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
                  {(() => {
                    const items: ReactElement[] = [];
                    for (let idx = 0; idx < editorFields.length; idx++) {
                      const field = editorFields[idx];
                      if (field.name === 'eventDate') {
                        items.push(
                          <div key="datetime-group" className="space-y-1.5">
                            <label className="block font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]">
                              Date &amp; Time
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
                              compact
                            />
                          </div>
                        );
                        continue;
                      }
                      if (field.name === 'eventTime' || field.name === 'timezone') continue;

                      const isFullWidth = field.type === 'textarea' || field.name === 'venue';
                      items.push(
                        <div key={field.name} className={`space-y-1.5${isFullWidth ? ' sm:col-span-2' : ''}`}>
                          <label className="block font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]">
                            {field.label}
                            {field.required && <span className="text-[#9cb092] ml-1">*</span>}
                          </label>
                          {renderEditorField(field, formData[field.name] || '', handleFieldChange)}
                        </div>
                      );
                    }
                    return items;
                  })()}
                </div>

                {/* Additional Events — always available for wedding/custom.
                    The old top toggle is gone; hosts just click "Add Another
                    Event" to add rows (Mehendi, Sangeet, Reception, …). */}
                {supportsMultipleEvents && (
                  <div className="border-t border-white/[0.07] pt-4 mt-4 space-y-2">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092]/80 flex items-center gap-1.5">
                          <span className="material-icons text-sm">celebration</span>
                          Additional Events
                        </p>
                        <p className="font-display text-[9px] text-[#b2c3b1]/45 leading-relaxed mt-1 normal-case tracking-normal">
                          Hosting more than one event? Add them here — optional.
                        </p>
                      </div>
                      <button
                        onClick={addSubEvent}
                        className="flex-shrink-0 font-display text-[9px] tracking-[0.15em] uppercase text-[#9cb092] hover:text-[#adc4a3] flex items-center gap-1 transition-colors border border-[#9cb092]/30 px-2.5 py-1 hover:border-[#9cb092]/60"
                      >
                        <span className="material-icons text-sm">add</span>
                        Add Another Event
                      </button>
                    </div>

                    {/* Event rows — only rendered once at least one event is added. */}
                    {subEventCount > 0 && (
                    <div className="overflow-x-auto border border-white/[0.06]">
                      <table className="w-full min-w-[520px] border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                            <th className="px-2 py-2 text-left font-display text-[8px] tracking-[0.15em] uppercase text-[#9cb092]/70 w-8">#</th>
                            <th className="px-2 py-2 text-left font-display text-[8px] tracking-[0.15em] uppercase text-[#9cb092]/70 min-w-[120px]">Event Name <span className="text-[#9cb092]">*</span></th>
                            <th className="px-2 py-2 text-left font-display text-[8px] tracking-[0.15em] uppercase text-[#9cb092]/70 min-w-[140px]">Date &amp; Time <span className="text-[#9cb092]">*</span></th>
                            <th className="px-2 py-2 text-left font-display text-[8px] tracking-[0.15em] uppercase text-[#9cb092]/70 min-w-[120px]">Venue / Location <span className="text-[#9cb092]">*</span></th>
                            <th className="px-2 py-2 text-left font-display text-[8px] tracking-[0.15em] uppercase text-[#9cb092]/70 w-20">Guest Count</th>
                            <th className="w-8" />
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: subEventCount }, (_, i) => {
                            const subInputClass = 'bg-white/[0.06] border border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 px-2 h-9 text-xs rounded-sm w-full outline-none transition-colors';
                            return (
                              <tr key={i} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.015] transition-colors">
                                <td className="px-2 py-1.5 text-center font-display text-[10px] text-[#9cb092]/60">{i + 1}</td>
                                <td className="px-2 py-1.5">
                                  <input
                                    type="text"
                                    value={formData[`sub_${i}_name`] || ''}
                                    onChange={(e) => handleFieldChange(`sub_${i}_name`, e.target.value)}
                                    placeholder="e.g. Mehendi, Sangeet"
                                    className={subInputClass}
                                  />
                                </td>
                                <td className="px-2 py-1.5">
                                  <DateTimePicker
                                    compact
                                    size="sm"
                                    date={formData[`sub_${i}_date`] || ''}
                                    time={formData[`sub_${i}_time`] || ''}
                                    timezone={formData[`sub_${i}_timezone`] || ''}
                                    onChange={(next) => {
                                      if (next.date !== undefined) handleFieldChange(`sub_${i}_date`, next.date);
                                      if (next.time !== undefined) handleFieldChange(`sub_${i}_time`, next.time);
                                      if (next.timezone !== undefined) handleFieldChange(`sub_${i}_timezone`, next.timezone);
                                    }}
                                  />
                                </td>
                                <td className="px-2 py-1.5">
                                  <input
                                    type="text"
                                    value={formData[`sub_${i}_venue`] || ''}
                                    onChange={(e) => handleFieldChange(`sub_${i}_venue`, e.target.value)}
                                    placeholder="Venue"
                                    className={subInputClass}
                                  />
                                </td>
                                <td className="px-2 py-1.5">
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    value={formData[`sub_${i}_guestCount`] || ''}
                                    onChange={(e) => handleFieldChange(`sub_${i}_guestCount`, e.target.value)}
                                    placeholder="e.g. 50"
                                    className={subInputClass}
                                  />
                                </td>
                                <td className="px-1 py-1.5 text-center">
                                  <button onClick={() => removeSubEvent(i)} className="text-[#b2c3b1]/30 hover:text-red-400/70 transition-colors">
                                    <span className="material-icons text-sm">close</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    )}
                  </div>
                )}
              </div>
              )}

            </div>
            </div>{/* end two-column body */}

            {/* Footer — full width so Back sits at the page's bottom-left and
                Continue at the bottom-right (consistent placement site-wide) */}
            <div className="flex-shrink-0 px-6 md:px-8 py-4 border-t border-white/[0.06] bg-[#0e1712]">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={backFromEditor}
                  className="py-3 px-5 border border-white/15 text-[#b2c3b1] font-display text-[10px] tracking-[0.2em] uppercase hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all flex items-center gap-2"
                >
                  <span className="material-icons text-sm">arrow_back</span>
                  Back
                </button>
                <button
                  onClick={proceedFromEditor}
                  disabled={!isEditorValid}
                  className={`py-3 px-8 font-display text-[11px] tracking-[0.22em] uppercase font-bold transition-colors flex items-center gap-2 ${
                    isEditorValid
                      ? 'bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3]'
                      : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                  }`}
                >
                  Continue
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
              {!isEditorValid && (
                <p className="font-display text-[9px] tracking-[0.12em] uppercase text-[#b2c3b1]/40 text-center mt-2">
                  Fill required fields to continue
                </p>
              )}
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
              onClick={closeToHome}
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
          SHARE STEP (Step 4) — the evite is published here, so its link
          works immediately. Copy / share it, or continue to invite guests.
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'share' && (selectedTemplate || uploadedTemplate) && (() => {
        const shareUrl = publishedEventId ? `${window.location.origin}/event/${publishedEventId}` : '';
        const shareTitle =
          eventTitle ||
          formData.eventName ||
          formData.celebrantName ||
          formData.brideName ||
          formData.motherName ||
          formData.parentNames ||
          formData.hostName ||
          'our celebration';
        // Nicely formatted time, e.g. "10:00 AM".
        const shareTime = formData.eventTime
          ? new Date(`2000-01-01T${formData.eventTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : '';
        // "Sunday, September 6, 2026 at 10:00 AM"
        const shareWhen = [displayDate, shareTime].filter(Boolean).join(' at ');
        // Event-type-specific celebratory line so the message reads right for
        // each occasion (wedding, baby shower, birthday, …).
        const SHARE_FLAVORS: Record<EventType, { phrase: string; emoji: string }> = {
          birthday:     { phrase: 'with cake, laughter, and lots of love',                     emoji: '🎂🎉' },
          marriage:     { phrase: 'as two hearts become one, with love and blessings',         emoji: '💍❤️' },
          babyshower:   { phrase: 'with traditional rituals, love, and joyful blessings',      emoji: '🌸👶' },
          bridetobe:    { phrase: 'with love, laughter, and a little sparkle before the big day', emoji: '🥂💐' },
          genderreveal: { phrase: 'as we reveal our little secret',                            emoji: '🎉💙💗' },
          housewarming: { phrase: 'as we open the doors to our new home',                      emoji: '🏡✨' },
          custom:       { phrase: 'with joy and togetherness',                                 emoji: '🎉' },
        };
        const flavor = (currentEventType && SHARE_FLAVORS[currentEventType]) || SHARE_FLAVORS.custom;
        // Ready-to-send invite message hosts paste into WhatsApp / SMS / email.
        // shareBody is the message without the raw URL; shareMsg appends the link.
        const shareLines = [`Please join us as we celebrate ${shareTitle} ${flavor.phrase}! ${flavor.emoji}`];
        if (formData.customMessage?.trim()) shareLines.push(formData.customMessage.trim());
        if (formData.venue) shareLines.push(`📍 Where: ${formData.venue}`);
        if (shareWhen) shareLines.push(`📅 When: ${shareWhen}`);
        shareLines.push('', '🔗 RSVP & Evite Details:');
        const shareBody = shareLines.join('\n');
        const shareMsg = `${shareBody}\n${shareUrl}`;
        const waHref = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`;
        const mailHref = `mailto:?subject=${encodeURIComponent(`You're invited: ${shareTitle}`)}&body=${encodeURIComponent(shareMsg)}`;
        // Copy the full invite message (with the link) so guests get all the details.
        const copyLink = () => {
          if (!shareUrl) return;
          navigator.clipboard.writeText(shareMsg);
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        };
        const nativeShare = async () => {
          if (!shareUrl) return;
          if (navigator.share) {
            try { await navigator.share({ title: shareTitle, text: shareBody, url: shareUrl }); } catch { /* cancelled */ }
          } else {
            copyLink();
          }
        };
        const shareTileClass =
          'group flex flex-col items-center justify-center gap-1.5 py-4 border border-white/10 bg-white/[0.03] hover:border-[#9cb092]/40 hover:bg-[#9cb092]/[0.05] transition-all duration-200 font-display text-[10px] tracking-[0.15em] uppercase text-[#e4eee1]';
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3"
            style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
          >
            <div className="relative w-full h-full flex flex-col bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl">
              <FlowLogo onClick={closeToHome} />
              <button
                onClick={closeToHome}
                aria-label="Close"
                className="absolute top-4 right-4 z-40 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
              >
                <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
              </button>

              {/* Header */}
              <div className="flex-shrink-0 px-6 md:px-10 pt-2.5 pb-3 border-b border-white/[0.06]">
                <FlowStepper current={4} className="max-w-2xl mx-auto mb-2" />
                <h2 className="font-serif-exp text-lg md:text-xl text-[#e4eee1] leading-tight">
                  Your invitation is <span className="text-[#9cb092] font-agatho italic">live</span>
                </h2>
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/55 mt-1.5">
                  Copy the link and share it anywhere — or invite guests directly.
                </p>
              </div>

              {/* Body */}
              <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 md:px-10 py-6 flex flex-col items-center justify-center">
                <div className="w-full max-w-xl">
                  {publishing && !publishedEventId ? (
                    <div className="flex flex-col items-center gap-3 py-10">
                      <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
                      <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/60">
                        Publishing your invitation…
                      </p>
                    </div>
                  ) : publishError && !publishedEventId ? (
                    <div className="flex flex-col items-center gap-4 py-10 text-center">
                      <span className="material-icons text-3xl text-red-400/70">error_outline</span>
                      <p className="font-display text-[11px] text-red-400/80 max-w-sm leading-relaxed">{publishError}</p>
                      <button
                        onClick={() => publishEvite()}
                        className="py-2.5 px-6 border border-[#9cb092]/40 font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] hover:bg-[#9cb092]/10 transition-all flex items-center gap-2"
                      >
                        <span className="material-icons text-sm">refresh</span>
                        Try again
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Ready-to-send invite message — this is what Copy / Share sends */}
                      <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/80 mb-2 flex items-center gap-1.5">
                        <span className="material-icons text-sm">chat_bubble_outline</span>
                        Message guests will receive
                      </p>
                      <div className="mb-4 px-4 py-3.5 bg-white/[0.05] border border-white/12 max-h-44 overflow-y-auto scrollbar-subtle">
                        <p className="font-display text-[12px] leading-relaxed text-[#e4eee1]/85 whitespace-pre-line break-words">
                          {shareMsg}
                        </p>
                      </div>

                      {/* Link + copy — Copy grabs the full message above (link included) */}
                      <div className="flex items-stretch gap-2 mb-2">
                        <div className="flex-1 flex items-center gap-2 px-3 h-12 bg-white/[0.05] border border-white/15 overflow-hidden">
                          <span className="material-icons text-[#9cb092]/70 text-base flex-shrink-0">link</span>
                          <span className="font-display text-[12px] text-[#e4eee1]/85 truncate">{shareUrl}</span>
                        </div>
                        <button
                          onClick={copyLink}
                          className={`flex-shrink-0 px-5 h-12 flex items-center gap-2 font-display text-[10px] tracking-[0.2em] uppercase font-bold transition-colors ${
                            linkCopied
                              ? 'bg-[#9cb092]/20 text-[#9cb092] border border-[#9cb092]/50'
                              : 'bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3]'
                          }`}
                        >
                          <span className="material-icons text-base">{linkCopied ? 'check' : 'content_copy'}</span>
                          {linkCopied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="font-display text-[9px] text-[#b2c3b1]/45 mb-6">
                        Copy grabs the full message above, with your link included.
                      </p>

                      {/* Share options */}
                      <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/80 mb-2">
                        Share via
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <a href={waHref} target="_blank" rel="noopener noreferrer" className={shareTileClass}>
                          <span className="material-icons text-xl text-[#b2c3b1]/70 group-hover:text-[#9cb092] transition-colors">chat</span>
                          WhatsApp
                        </a>
                        <a href={mailHref} className={shareTileClass}>
                          <span className="material-icons text-xl text-[#b2c3b1]/70 group-hover:text-[#9cb092] transition-colors">mail</span>
                          Email
                        </a>
                        <button onClick={nativeShare} className={shareTileClass}>
                          <span className="material-icons text-xl text-[#b2c3b1]/70 group-hover:text-[#9cb092] transition-colors">ios_share</span>
                          More
                        </button>
                      </div>

                      <p className="font-display text-[9px] text-[#b2c3b1]/45 leading-relaxed mt-6 text-center">
                        Anyone with this link can view your invitation. Add guests on the next step to send it
                        by email or SMS and collect RSVPs.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 md:px-10 py-2.5 border-t border-white/[0.06] bg-[#0e1712]">
                <button
                  onClick={backToEditor}
                  className="py-2.5 px-5 border border-white/15 text-[#b2c3b1] font-display text-[10px] tracking-[0.2em] uppercase hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all flex items-center gap-2"
                >
                  <span className="material-icons text-sm">arrow_back</span>
                  Back
                </button>
                <button
                  onClick={() => setModalPhase('guests')}
                  disabled={!publishedEventId}
                  className={`py-2.5 px-8 font-display text-[11px] tracking-[0.22em] uppercase font-bold transition-colors flex items-center gap-2 ${
                    publishedEventId
                      ? 'bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3]'
                      : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
                  }`}
                >
                  Invite guests
                  <span className="material-icons text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════
          GUEST POPUP
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'guests' && (selectedTemplate || uploadedTemplate) && (
        <GuestPopup
          guests={guests}
          onGuestsChange={setGuests}
          deliveryPreference={deliveryPreference}
          onDeliveryPreferenceChange={setDeliveryPreference}
          onBack={() => setModalPhase('share')}
          onClose={closeToHome}
          onProceed={proceedToPreview}
          formData={formData}
          invitationSets={
            multipleInvitations
              ? invitationSlots
                  .filter((s) => s.url && s.type)
                  .map((s, i) => ({ id: s.id, name: s.name?.trim() || `Invitation ${i + 1}` }))
              : undefined
          }
        />
      )}

      {/* ════════════════════════════════════════════════════════════
          PREVIEW MODAL (Step 3)
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'preview' && (selectedTemplate || uploadedTemplate) && (
        <PreviewStep
          eventType={currentEventType}
          selectedTemplate={selectedTemplate}
          uploadedTemplate={uploadedTemplate}
          formData={formData}
          deliveryPreference={deliveryPreference}
          guestCount={guests.filter((g) => g.name.trim()).length}
          guests={guests}
          templateOverrides={fieldOverrides}
          templatePhotoOverlay={photoOverlay}
          rsvpSettings={rsvpSettings}
          onRsvpSettingsChange={setRsvpSettings}
          invitationSets={
            multipleInvitations
              ? invitationSlots
                  .filter((s) => s.url && s.type)
                  .map((s, i) => ({
                    id: s.id,
                    name: s.name?.trim() || `Invitation ${i + 1}`,
                    url: s.url,
                    type: s.type!,
                  }))
              : undefined
          }
          onBack={backToGuests}
          onClose={closeToHome}
          onProceed={proceedToPayment}
        />
      )}

      {/* ════════════════════════════════════════════════════════════
          PAYMENT MODAL
          ════════════════════════════════════════════════════════════ */}
      {modalPhase === 'payment' && (
        <PaymentModal
          guestCount={guests.filter((g) => g.name.trim()).length}
          deliveryPreference={deliveryPreference}
          invitationCount={
            multipleInvitations ? invitationSlots.filter((s) => s.url && s.type).length : 1
          }
          onBack={backToPreview}
          onClose={closeToHome}
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
