import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import WebsiteRenderer from './WebsiteRenderer';
import SectionEditorForm from './SectionEditorForm';
import {
  type WebsiteSection,
  type SectionType,
  type WebsiteTheme,
  DEFAULT_THEME,
  THEME_PRESETS,
  resolveTheme,
  SECTION_LABELS,
  nextSectionId,
  defaultContentFor,
} from './types';

const AUTOSAVE_DELAY_MS = 1500;
const SECTION_TYPES: SectionType[] = ['hero', 'our_story', 'schedule', 'gallery', 'rsvp', 'map', 'faq', 'custom_text'];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface WebsiteBuilderProps {
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  onClose: () => void;
}

export default function WebsiteBuilder({ eventId, eventTitle, eventDate, eventLocation, onClose }: WebsiteBuilderProps) {
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [slug, setSlug] = useState(() => slugify(eventTitle));
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [theme, setTheme] = useState<WebsiteTheme>(DEFAULT_THEME);
  const [published, setPublished] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loaded, setLoaded] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutosave = useRef(true);

  useEffect(() => {
    api.listEventWebsites().then((sites) => {
      const existing = sites.find((s) => s.event_id === eventId);
      if (existing) {
        api.getEventWebsite(existing.id).then((full) => {
          skipNextAutosave.current = true;
          setWebsiteId(full.id);
          setSlug(full.slug);
          setSections((full.sections as unknown as WebsiteSection[]) || []);
          setTheme((full.theme as unknown as WebsiteTheme) || DEFAULT_THEME);
          setPublished(full.published);
          setLoaded(true);
        });
      } else {
        // Nothing fetched to re-apply, so any edit already made while loading should still autosave.
        skipNextAutosave.current = false;
        setLoaded(true);
      }
    }).catch(() => setLoaded(true));
  }, [eventId]);

  const persist = useCallback(async (publishOverride?: boolean) => {
    setSaveStatus('saving');
    try {
      const payload = {
        sections: sections as unknown as Record<string, unknown>[],
        theme: theme as unknown as Record<string, unknown>,
        published: publishOverride ?? published,
      };
      if (websiteId) {
        await api.updateEventWebsite(websiteId, { ...payload, slug });
      } else {
        const created = await api.createEventWebsite({ event_id: eventId, slug, ...payload });
        setWebsiteId(created.id);
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [websiteId, eventId, slug, sections, theme, published]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => persist(), AUTOSAVE_DELAY_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, theme, slug, loaded]);

  const addSection = (type: SectionType) => {
    const newSection: WebsiteSection = { id: nextSectionId(), type, content: defaultContentFor(type) };
    setSections((prev) => [...prev, newSection]);
    setSelectedSectionId(newSection.id);
    setShowAddMenu(false);
  };

  const updateSectionContent = (id: string, content: WebsiteSection['content']) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)));
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const reorderSection = (id: string, direction: 'up' | 'down') => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const publicUrl = `${window.location.origin}/w/${slug}`;

  const togglePublish = async () => {
    const next = !published;
    setPublished(next);
    await persist(next);
    if (next) {
      toast.success('Your website is live!', { description: publicUrl });
    } else {
      toast('Website unpublished', { description: 'Your page is no longer publicly visible.' });
    }
  };

  const copyPublicUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Link copied!');
  };

  const applyPreset = (preset: WebsiteTheme) => {
    setTheme(preset);
  };

  const handleClose = async () => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      await persist();
    }
    onClose();
  };

  const selectedSection = useMemo(() => sections.find((s) => s.id === selectedSectionId) ?? null, [sections, selectedSectionId]);

  // Block editing until we know whether a website already exists for this event — editing
  // before that resolves can either silently lose the edit or create a stray duplicate row.
  if (!loaded) {
    return (
      <div data-testid="website-builder" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1512]">
        <p className="font-display text-[10px] tracking-[0.28em] uppercase text-[#b2c3b1]/50">Loading…</p>
      </div>
    );
  }

  return (
    <div data-testid="website-builder" className="fixed inset-0 z-50 flex flex-col bg-[#0d1512]">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.07] bg-[#111914]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose} aria-label="Close website builder">
            <span className="material-icons text-base">arrow_back</span>
          </Button>
          <p className="font-display text-[10px] tracking-[0.28em] uppercase text-[#9cb092]">Website Builder</p>
        </div>

        <div className="flex items-center gap-2">
          {published ? (
            <button
              onClick={copyPublicUrl}
              title="Copy live link"
              className="flex items-center gap-1.5 bg-[#9cb092]/10 border border-[#9cb092]/30 text-[#e4eee1] text-xs px-2.5 py-1.5 hover:border-[#9cb092]/60 transition-colors"
            >
              <span className="material-icons text-[13px] text-[#9cb092]">public</span>
              <span className="max-w-[220px] truncate">{publicUrl}</span>
              <span className="material-icons text-[13px] text-[#b2c3b1]/60">content_copy</span>
            </button>
          ) : (
            <>
              <span className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55">
                mymomentsnmemories.com/w/
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className="bg-[#192116] border border-white/[0.1] text-[#e4eee1] text-xs px-2 py-1 w-40 focus:outline-none focus:border-[#9cb092]/50"
              />
            </>
          )}
          <span className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/50 w-16 text-right">
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'error' && 'Save failed'}
          </span>
          <Button size="sm" variant={published ? 'outline' : 'default'} onClick={togglePublish}>
            {published ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      {published && (
        <div className="px-4 py-2 border-b border-white/[0.07] bg-[#9cb092]/[0.06] flex items-center gap-2">
          <span className="material-icons text-[14px] text-[#9cb092]">check_circle</span>
          <p className="font-display text-[9px] tracking-[0.18em] uppercase text-[#b2c3b1]/80">
            Live — anyone with the link above can view this page now.
          </p>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div className="w-56 shrink-0 border-r border-white/[0.07] bg-[#141c15] px-3 py-5 overflow-y-auto scrollbar-subtle">
          <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092] mb-3 px-1">Sections</p>
          <div className="space-y-1">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                onClick={() => setSelectedSectionId(section.id)}
                className={`group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors ${
                  selectedSectionId === section.id ? 'bg-[#9cb092]/15 border border-[#9cb092]/40' : 'border border-transparent hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex-1 truncate text-[11px] text-[#e4eee1]">{SECTION_LABELS[section.type]}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); reorderSection(section.id, 'up'); }}
                  aria-label="Move section up"
                  disabled={idx === 0}
                  className="opacity-0 group-hover:opacity-100 text-[#b2c3b1]/60 hover:text-[#9cb092] disabled:opacity-0"
                >
                  <span className="material-icons text-xs">arrow_upward</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); reorderSection(section.id, 'down'); }}
                  aria-label="Move section down"
                  disabled={idx === sections.length - 1}
                  className="opacity-0 group-hover:opacity-100 text-[#b2c3b1]/60 hover:text-[#9cb092] disabled:opacity-0"
                >
                  <span className="material-icons text-xs">arrow_downward</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                  aria-label="Remove section"
                  className="opacity-0 group-hover:opacity-100 text-[#b2c3b1]/60 hover:text-red-400"
                >
                  <span className="material-icons text-xs">delete</span>
                </button>
              </div>
            ))}
          </div>

          <div className="relative mt-3">
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              className="w-full py-1.5 border border-dashed border-[#9cb092]/40 text-[#9cb092] text-[11px] hover:border-[#9cb092]"
            >
              + Add Section
            </button>
            {showAddMenu && (
              <div className="absolute left-0 right-0 mt-1 bg-[#192116] border border-white/[0.1] z-10">
                {SECTION_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => addSection(type)}
                    className="w-full text-left px-3 py-2 text-[11px] text-[#e4eee1] hover:bg-[#9cb092]/10"
                  >
                    {SECTION_LABELS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092] mt-8 mb-3 px-1">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_PRESETS.map((preset) => {
              const r = resolveTheme(preset.theme);
              const isActive = (theme.accentColor ?? theme.primaryColor) === r.accentColor && (theme.headingFont ?? theme.fontFamily) === r.headingFont;
              return (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.theme)}
                  title={preset.description}
                  aria-label={`Apply ${preset.name} theme`}
                  className={`group flex flex-col items-center gap-1 p-1.5 border transition-colors ${
                    isActive ? 'border-[#9cb092]/60 bg-[#9cb092]/10' : 'border-white/[0.08] hover:border-white/[0.2]'
                  }`}
                >
                  <span
                    className="w-full h-8 border border-black/10"
                    style={{ backgroundColor: r.backgroundColor }}
                  >
                    <span className="block w-3 h-3 mt-1 ml-1 rounded-full" style={{ backgroundColor: r.accentColor }} />
                  </span>
                  <span className="text-[8px] tracking-[0.06em] text-[#b2c3b1]/70 text-center leading-tight">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-subtle bg-[#1a1a1a] flex justify-center py-8 px-4">
          <div className="w-full max-w-2xl bg-white shadow-2xl">
            <WebsiteRenderer sections={sections} theme={theme} eventTitle={eventTitle} eventDate={eventDate} eventLocation={eventLocation} eventId={eventId} />
          </div>
        </div>

        <div className="w-72 shrink-0 border-l border-white/[0.07] bg-[#141c15] px-4 py-5 overflow-y-auto scrollbar-subtle">
          {selectedSection ? (
            <>
              <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092] mb-2">
                {SECTION_LABELS[selectedSection.type]}
              </p>
              <SectionEditorForm
                section={selectedSection}
                onChange={(content) => updateSectionContent(selectedSection.id, content)}
              />
            </>
          ) : (
            <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#b2c3b1]/40">
              Select a section to edit
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
