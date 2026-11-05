import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import InlineNotice, { type Notice } from '@/components/InlineNotice';
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';

interface PremiumSite {
  id: string;
  slug: string;
  event_key: string;
  design_id: string;
  theme_id: string;
  published: boolean;
  updated_at: string;
}

const EVENT_LABELS: Record<string, string> = {
  marriage: 'Wedding',
  birthday: 'Birthday',
  babyshower: 'Baby shower',
  bridetobe: 'Bride to be',
  genderreveal: 'Gender reveal',
  housewarming: 'Housewarming',
  custom: 'Custom event',
};

const label = (key: string) => EVENT_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);

const BUTTON =
  'flex-shrink-0 flex items-center gap-1 px-2 md:px-3 py-1.5 border transition-colors font-display text-[9px] tracking-[0.15em] uppercase disabled:opacity-50';
const NEUTRAL = `${BUTTON} border-[#3d4a35]/15 hover:border-[#5f7256]/50 hover:text-[#5f7256] text-[#5a6c50]/70`;
const DANGER = `${BUTTON} border-red-700/20 hover:border-red-700/50 hover:text-red-700 text-red-700/70`;

/**
 * "Your premium websites": the host's published premium designs (/site/<link>) with Unpublish,
 * Publish and Delete. Shows nothing at all until the host has at least one.
 */
export default function PremiumSitesPanel() {
  const [sites, setSites] = useState<PremiumSite[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PremiumSite | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    let cancelled = false;
    api.listPremiumSites()
      .then((list) => { if (!cancelled) setSites(list); })
      .catch(() => { if (!cancelled) setSites([]); });
    return () => { cancelled = true; };
  }, []);

  if (!sites || sites.length === 0) return null;

  const setPublished = async (site: PremiumSite, published: boolean) => {
    setBusyId(site.id);
    setNotice(null);
    try {
      await api.updatePremiumSite(site.id, { published });
      setSites((prev) => (prev ?? []).map((s) => (s.id === site.id ? { ...s, published } : s)));
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : `Could not ${published ? 'publish' : 'unpublish'} this website.` });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    setNotice(null);
    try {
      await api.deletePremiumSite(deleting.id);
      setSites((prev) => (prev ?? []).filter((s) => s.id !== deleting.id));
      setDeleting(null);
    } catch (error) {
      setDeleting(null);
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not delete this website.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mt-10" data-testid="premium-sites-panel">
      <h2 className="font-serif-exp text-lg italic text-[#2a3328] mb-4">Your Premium Websites</h2>
      <div className="space-y-px">
        {sites.map((site) => (
          <div
            key={site.id}
            className="flex flex-wrap items-center gap-3 md:gap-4 px-4 md:px-5 py-4 bg-white/55 border border-[#3d4a35]/10 hover:bg-white/75 transition-colors"
          >
            <div className="flex-1 min-w-[9rem]">
              <p className="text-sm text-[#2a3328] truncate">/site/{site.slug}</p>
              <p className="font-display text-[9px] tracking-[0.1em] uppercase text-[#5a6c50]/70 mt-0.5">
                {label(site.event_key)} · updated{' '}
                {new Date(site.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <span
              className={`font-display text-[9px] tracking-[0.15em] uppercase px-2 py-1 border flex-shrink-0 ${
                site.published ? 'border-[#5f7256]/40 text-[#5f7256]' : 'border-[#3d4a35]/20 text-[#5a6c50]/60'
              }`}
            >
              {site.published ? 'published' : 'private'}
            </span>
            {site.published && (
              <a
                href={`/site/${site.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View live website"
                className={NEUTRAL}
              >
                <span className="material-icons text-sm">open_in_new</span>
                <span className="hidden sm:inline">View</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setPublished(site, !site.published)}
              disabled={busyId === site.id}
              title={site.published ? 'Make this website private. The link stops working until you publish it again.' : 'Make this website public again'}
              className={NEUTRAL}
            >
              <span className="material-icons text-sm">{site.published ? 'visibility_off' : 'public'}</span>
              <span className="hidden sm:inline">{site.published ? 'Unpublish' : 'Publish'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeleting(site)}
              disabled={busyId === site.id}
              title="Delete this website"
              className={DANGER}
            >
              <span className="material-icons text-sm">delete</span>
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        ))}
      </div>
      <InlineNotice notice={notice} className="mt-2" />

      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Delete this website?"
        description={`/site/${deleting?.slug ?? ''} will be deleted permanently and its link will stop working for everyone. This cannot be undone. To hide it without losing it, use Unpublish instead.`}
        confirmLabel="Delete website"
        busy={busyId !== null && busyId === deleting?.id}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
