import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

interface PremiumPublishBarProps {
  /** 'marriage' | 'birthday' | <EventKey> — picks the render family. */
  eventKey: string;
  designId: string;
  themeId: string;
  content: unknown;
  /** Seeds the link the first time (e.g. couple / celebrant name). */
  slugSeed: string;
  /** Editor accent (gold varies per family). */
  accent?: string;
}

/**
 * Publish / share controls embedded in the premium website editors. Publishing
 * saves the design + theme + content to the user's account and exposes it at
 * /site/<slug>. Requires sign-in; once live, design edits autosave so the page
 * tracks the editor.
 */
export default function PremiumPublishBar({
  eventKey,
  designId,
  themeId,
  content,
  slugSeed,
  accent = '#c19a4b',
}: PremiumPublishBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [siteId, setSiteId] = useState<string | null>(null);
  const [slug, setSlug] = useState(() => slugify(slugSeed) || `${eventKey}-invite`);
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const seededRef = useRef(false);

  // Seed the slug once from the initial content; never stomp a typed slug.
  useEffect(() => {
    if (seededRef.current) return;
    const s = slugify(slugSeed);
    if (s) {
      setSlug(s);
      seededRef.current = true;
    }
  }, [slugSeed]);

  const publicUrl = `${window.location.origin}/site/${slug}`;

  // Once a row exists, debounce-save design/theme/content edits so the live
  // page tracks the editor. Slug + publish state go through the buttons.
  useEffect(() => {
    if (!siteId) return;
    const t = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await api.updatePremiumSite(siteId, {
          event_key: eventKey,
          design_id: designId,
          theme_id: themeId,
          content: content as Record<string, unknown>,
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [siteId, eventKey, designId, themeId, content]);

  const requireSignIn = () => {
    const back = window.location.pathname + window.location.search;
    navigate(`/sign-in?redirect=${encodeURIComponent(back)}`);
  };

  const publish = async () => {
    if (!user) {
      requireSignIn();
      return;
    }
    if (!slug) {
      toast.error('Choose a link first');
      return;
    }
    setBusy(true);
    try {
      if (siteId) {
        await api.updatePremiumSite(siteId, {
          slug,
          published: true,
          event_key: eventKey,
          design_id: designId,
          theme_id: themeId,
          content: content as Record<string, unknown>,
        });
      } else {
        const created = await api.createPremiumSite({
          slug,
          event_key: eventKey,
          design_id: designId,
          theme_id: themeId,
          content: content as Record<string, unknown>,
          published: true,
        });
        setSiteId(created.id);
        setSlug(created.slug);
      }
      setPublished(true);
      setSaveStatus('saved');
      toast.success('Your website is live!', { description: publicUrl });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not publish');
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (!siteId) return;
    setBusy(true);
    try {
      await api.updatePremiumSite(siteId, { published: false });
      setPublished(false);
      toast('Website unpublished', { description: 'Your page is no longer publicly visible.' });
    } catch {
      toast.error('Could not unpublish');
    } finally {
      setBusy(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Link copied!');
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {published ? (
        <>
          <button
            onClick={copyUrl}
            title="Copy live link"
            className="flex items-center gap-1.5 border text-[#ece5d8] text-[11px] px-2.5 py-1.5 transition-colors"
            style={{ borderColor: `${accent}55`, background: `${accent}14` }}
          >
            <span className="material-icons text-[13px]" style={{ color: accent }}>public</span>
            <span className="max-w-[170px] truncate">{publicUrl.replace(/^https?:\/\//, '')}</span>
            <span className="material-icons text-[13px] text-white/50">content_copy</span>
          </button>
          <span className="text-[8px] uppercase tracking-[0.18em] text-white/40 w-14 text-right hidden sm:block">
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'error' && 'Save failed'}
          </span>
          <button
            onClick={unpublish}
            disabled={busy}
            className="px-3 py-1.5 border border-white/15 text-[10px] uppercase tracking-[0.18em] text-[#9bb3a3] hover:border-white/30 transition-colors disabled:opacity-50"
          >
            Unpublish
          </button>
        </>
      ) : (
        <>
          <span className="text-[8px] uppercase tracking-[0.16em] text-white/45 hidden md:block">
            {window.location.host}/site/
          </span>
          <input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="your-link"
            aria-label="Choose your public link"
            className="bg-[#0c1013] border text-[#ece5d8] text-[11px] px-2 py-1.5 w-32 focus:outline-none"
            style={{ borderColor: `${accent}44` }}
          />
          <button
            onClick={publish}
            disabled={busy}
            className="px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#0c1013] transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : user ? 'Publish & Share' : 'Sign in to publish'}
          </button>
        </>
      )}
    </div>
  );
}
