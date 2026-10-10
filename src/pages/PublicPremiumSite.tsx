import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { resolvePremiumSite } from '@/lib/premiumSites';

interface PremiumSiteData {
  slug: string;
  event_key: string;
  design_id: string;
  theme_id: string;
  content: Record<string, unknown>;
}

export default function PublicPremiumSite() {
  const { slug } = useParams<{ slug: string }>();
  const [site, setSite] = useState<PremiumSiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    api.getPublicPremiumSite(slug)
      .then((d) => setSite(d as PremiumSiteData))
      .catch(() => setError('This page is not available or has not been published yet.'))
      .finally(() => setLoading(false));
  }, [slug]);

  // Map the stored design + theme ids back to their React component + theme.
  const resolved = useMemo(() => {
    if (!site) return null;
    try {
      return resolvePremiumSite(site.event_key, site.design_id, site.theme_id);
    } catch {
      return null;
    }
  }, [site]);

  if (loading) return (
    <div className="page-bokeh-bg product-light-shell min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#c19a4b]/30 border-t-[#c19a4b] rounded-full animate-spin" />
    </div>
  );

  if (error || !site || !resolved) return (
    <div className="page-bokeh-bg product-light-shell min-h-screen flex flex-col items-center justify-center gap-4 px-6">
      <span className="material-icons text-4xl text-[#c19a4b]/40">language</span>
      <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#9bb3a3]/70 text-center">
        {error || 'Page not found'}
      </p>
    </div>
  );

  const { Component, theme } = resolved;

  // Mirror the editor's device frame (minus the phone bezel): the design fills
  // a 390/844 column, centered, and manages its own internal scrolling.
  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(circle at 50% 30%, #16201f, #0c1013)' }}
    >
      <div className="relative" style={{ aspectRatio: '390 / 844', height: 844, maxHeight: '100%', maxWidth: '100%' }}>
        <div className="absolute inset-0 overflow-hidden shadow-2xl">
          <Suspense fallback={<div className="w-full h-full bg-[#0c1013]" />}>
            <Component theme={theme} content={site.content} autoOpen />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
