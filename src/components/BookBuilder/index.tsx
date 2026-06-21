import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import BookViewer, { type BookPage } from './BookViewer';
import { FRAME_PRESETS } from './frames';

const AUTOSAVE_DELAY_MS = 1500;

function nextPageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface BookBuilderProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export default function BookBuilder({ eventId, eventTitle, onClose }: BookBuilderProps) {
  const [bookId, setBookId] = useState<string | null>(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [published, setPublished] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutosave = useRef(true);

  useEffect(() => {
    api.listInvitationBooks().then((books) => {
      const existing = books.find((b) => b.event_id === eventId);
      if (existing) {
        api.getInvitationBook(existing.id).then((full) => {
          skipNextAutosave.current = true;
          setBookId(full.id);
          setPages(full.pages || []);
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
      const payload = { title: eventTitle, pages, published: publishOverride ?? published };
      if (bookId) {
        await api.updateInvitationBook(bookId, payload);
      } else {
        const created = await api.createInvitationBook({ event_id: eventId, ...payload });
        setBookId(created.id);
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [bookId, eventId, eventTitle, pages, published]);

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
  }, [pages, loaded]);

  const handleAddPage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const uploaded = await api.uploadMedia(file);
        setPages((prev) => [...prev, { id: nextPageId(), image_url: uploaded.public_url }]);
      }
    } catch (err) {
      console.error('Page upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const removePage = (id: string) => setPages((prev) => prev.filter((p) => p.id !== id));

  const setPageFrame = (id: string, frame: string | undefined) =>
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, frame } : p)));

  const reorderPage = (id: string, direction: 'up' | 'down') => {
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const togglePublish = async () => {
    const next = !published;
    setPublished(next);
    await persist(next);
  };

  const handleClose = async () => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      await persist();
    }
    onClose();
  };

  // Block editing until we know whether a book already exists for this event — editing
  // before that resolves can either silently lose the edit or create a stray duplicate row.
  if (!loaded) {
    return (
      <div data-testid="book-builder" className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1512]">
        <p className="font-display text-[10px] tracking-[0.28em] uppercase text-[#b2c3b1]/50">Loading…</p>
      </div>
    );
  }

  return (
    <div data-testid="book-builder" className="fixed inset-0 z-50 flex flex-col bg-[#0d1512]">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.07] bg-[#111914]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose} aria-label="Close book builder">
            <span className="material-icons text-base">arrow_back</span>
          </Button>
          <p className="font-display text-[10px] tracking-[0.28em] uppercase text-[#9cb092]">Invitation Book</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <span className="material-icons text-base mr-1">add_photo_alternate</span>
            {uploading ? 'Uploading…' : 'Add Page(s)'}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddPage} />
          <span className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/50 w-16 text-right">
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'error' && 'Save failed'}
          </span>
          <Button size="sm" variant={published ? 'outline' : 'default'} onClick={togglePublish} disabled={pages.length === 0}>
            {published ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-56 shrink-0 border-r border-white/[0.07] bg-[#141c15] px-3 py-5 overflow-y-auto scrollbar-subtle">
          <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092] mb-3 px-1">Pages</p>
          {pages.length === 0 && (
            <p className="font-display text-[9px] tracking-[0.18em] text-[#b2c3b1]/40 px-1">
              No pages yet — add images to build your book
            </p>
          )}
          <div className="space-y-1">
            {pages.map((page, idx) => (
              <div key={page.id} className="group border border-white/[0.06] hover:bg-white/[0.04] px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <img src={page.image_url} alt="" className="w-8 h-10 object-cover flex-shrink-0" />
                  <span className="flex-1 truncate text-[11px] text-[#e4eee1]">Page {idx + 1}</span>
                  <button
                    onClick={() => reorderPage(page.id, 'up')}
                    aria-label="Move page up"
                    disabled={idx === 0}
                    className="opacity-0 group-hover:opacity-100 text-[#b2c3b1]/60 hover:text-[#9cb092] disabled:opacity-0"
                  >
                    <span className="material-icons text-xs">arrow_upward</span>
                  </button>
                  <button
                    onClick={() => reorderPage(page.id, 'down')}
                    aria-label="Move page down"
                    disabled={idx === pages.length - 1}
                    className="opacity-0 group-hover:opacity-100 text-[#b2c3b1]/60 hover:text-[#9cb092] disabled:opacity-0"
                  >
                    <span className="material-icons text-xs">arrow_downward</span>
                  </button>
                  <button
                    onClick={() => removePage(page.id)}
                    aria-label="Remove page"
                    className="opacity-0 group-hover:opacity-100 text-[#b2c3b1]/60 hover:text-red-400"
                  >
                    <span className="material-icons text-xs">delete</span>
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-1.5 pl-1">
                  <button
                    onClick={() => setPageFrame(page.id, undefined)}
                    aria-label="No frame"
                    title="No frame"
                    className={`w-4 h-4 rounded-full border ${!page.frame ? 'border-[#9cb092] ring-1 ring-[#9cb092]' : 'border-white/20'} bg-transparent`}
                  />
                  {FRAME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setPageFrame(page.id, preset.id)}
                      aria-label={preset.label}
                      title={preset.label}
                      className={`w-4 h-4 rounded-full border ${page.frame === preset.id ? 'border-[#9cb092] ring-1 ring-[#9cb092]' : 'border-white/20'}`}
                      style={{
                        background:
                          preset.id === 'sage-hairline'
                            ? '#9cb092'
                            : preset.id === 'ivory-double'
                              ? '#fdfaf5'
                              : '#a8893d',
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-subtle bg-[#1a1a1a] flex items-center justify-center py-8 px-4">
          <BookViewer pages={pages} />
        </div>
      </div>
    </div>
  );
}
