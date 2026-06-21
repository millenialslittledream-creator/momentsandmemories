import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import WebsiteRenderer from '@/components/WebsiteBuilder/WebsiteRenderer';
import { DEFAULT_THEME, type WebsiteSection, type WebsiteTheme } from '@/components/WebsiteBuilder/types';

interface PublicWebsiteData {
  id: string;
  slug: string;
  event_id: string;
  sections: WebsiteSection[];
  theme: WebsiteTheme;
  event: { title: string; event_date: string; event_time: string | null; location: string | null } | null;
}

export default function PublicWebsite() {
  const { slug } = useParams<{ slug: string }>();
  const [site, setSite] = useState<PublicWebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    api.getPublicWebsite(slug)
      .then((data) => setSite(data as unknown as PublicWebsiteData))
      .catch(() => setError('This page is not available or has not been published yet.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-[#fbf9f4] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
    </div>
  );

  if (error || !site) return (
    <div className="min-h-screen bg-[#fbf9f4] flex flex-col items-center justify-center gap-4 px-6">
      <span className="material-icons text-4xl text-[#9cb092]/40">language</span>
      <p className="text-sm uppercase tracking-[0.2em] text-[#8a8470] text-center">
        {error || 'Page not found'}
      </p>
    </div>
  );

  const dateStr = site.event?.event_date
    ? new Date(site.event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : undefined;

  return (
    <WebsiteRenderer
      sections={site.sections || []}
      theme={site.theme || DEFAULT_THEME}
      eventTitle={site.event?.title}
      eventDate={dateStr}
      eventLocation={site.event?.location ?? undefined}
      eventId={site.event_id}
    />
  );
}
