import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import MasonryGallery, { type GalleryPhoto } from '@/components/GuestGallery/MasonryGallery';
import type { WebsiteSection, WebsiteTheme, ScheduleItem, FaqItem } from './types';
import { resolveTheme } from './types';

interface WebsiteRendererProps {
  sections: WebsiteSection[];
  theme: WebsiteTheme;
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
  eventId?: string;
}

const BORDER_CLASS: Record<string, string> = {
  none: 'border-b-0',
  hairline: 'border-b border-[#e7e1d2]',
  double: 'border-b-4 border-double border-[#e7e1d2]',
};

function readableAccent(accent: string, background: string) {
  const parse = (value: string) => {
    const match = value.trim().match(/^#([\da-f]{6})$/i);
    if (!match) return null;
    return [0, 2, 4].map((offset) => Number.parseInt(match[1].slice(offset, offset + 2), 16));
  };
  const luminance = (rgb: number[]) => {
    const channels = rgb.map((value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const accentRgb = parse(accent);
  const backgroundRgb = parse(background);
  if (!accentRgb || !backgroundRgb) return accent;
  const backgroundLuminance = luminance(backgroundRgb);
  const contrast = (rgb: number[]) => {
    const value = luminance(rgb);
    return (Math.max(value, backgroundLuminance) + 0.05) / (Math.min(value, backgroundLuminance) + 0.05);
  };
  if (contrast(accentRgb) >= 3.5) return accent;
  for (let factor = 0.9; factor >= 0.25; factor -= 0.05) {
    const candidate = accentRgb.map((value) => Math.round(value * factor));
    if (contrast(candidate) >= 3.5) {
      return `#${candidate.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  return '#3d4a35';
}

function useRevealOnScroll() {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, revealed };
}

function RevealSection({ borderClass, children }: { borderClass: string; children: React.ReactNode }) {
  const { ref, revealed } = useRevealOnScroll();
  return (
    <section
      ref={ref}
      className={`px-6 md:px-16 py-14 last:border-b-0 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${borderClass} ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </section>
  );
}

export default function WebsiteRenderer({ sections, theme, eventTitle, eventDate, eventLocation, eventId }: WebsiteRendererProps) {
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const hasGallerySection = sections.some((s) => s.type === 'gallery');
  const resolved = resolveTheme(theme);
  const headingAccent = readableAccent(resolved.accentColor, resolved.backgroundColor);
  const borderClass = BORDER_CLASS[resolved.borderStyle] ?? BORDER_CLASS.hairline;

  useEffect(() => {
    if (!eventId || !hasGallerySection) return;
    api.getGalleryPhotos(eventId).then(setGalleryPhotos).catch(() => {});
  }, [eventId, hasGallerySection]);

  return (
    <div
      className="min-h-full text-[#2c2a24]"
      style={{
        backgroundColor: resolved.backgroundColor,
        fontFamily: `'${resolved.bodyFont}', serif`,
        ['--heading-font' as string]: `'${resolved.headingFont}', serif`,
      }}
    >
      {sections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-[#8a8470]">No sections yet</p>
          <p className="text-xs text-[#8a8470] mt-2">Add a section from the panel to start building this page.</p>
        </div>
      )}

      {sections.map((section) => (
        <RevealSection key={section.id} borderClass={borderClass}>
          {section.type === 'hero' && (
            <div className="text-center max-w-2xl mx-auto">
              {section.content.coverImageUrl && (
                <img
                  src={section.content.coverImageUrl}
                  alt=""
                  className="w-full max-h-80 object-cover mb-8"
                />
              )}
              <h1
                className="text-4xl md:text-5xl italic"
                style={{ color: headingAccent, fontFamily: 'var(--heading-font)' }}
              >
                {section.content.heading || eventTitle || "Let's Celebrate"}
              </h1>
              {(section.content.subtitle || eventLocation) && (
                <p className="mt-3 text-sm uppercase tracking-[0.2em] text-[#8a8470]">
                  {section.content.subtitle || eventLocation}
                </p>
              )}
              {(section.content.date || eventDate) && (
                <p className="mt-2 text-base">{section.content.date || eventDate}</p>
              )}
            </div>
          )}

          {section.type === 'our_story' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl italic mb-4" style={{ color: headingAccent, fontFamily: 'var(--heading-font)' }}>
                {section.content.heading}
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-[#46433a]">{section.content.body}</p>
              {!!section.content.photos?.length && (
                <div className="grid grid-cols-3 gap-2 mt-6">
                  {section.content.photos.map((src, i) => (
                    <img key={i} src={src} alt="" className="aspect-square object-cover" />
                  ))}
                </div>
              )}
            </div>
          )}

          {section.type === 'schedule' && (
            <div className="max-w-xl mx-auto">
              <h2 className="text-2xl italic mb-6 text-center" style={{ color: headingAccent, fontFamily: 'var(--heading-font)' }}>
                {section.content.heading}
              </h2>
              <div className="space-y-4">
                {((section.content.items as ScheduleItem[]) || []).map((item, i) => (
                  <div key={i} className="flex items-baseline justify-between border-b border-[#e7e1d2] pb-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-[#8a8470]">{item.location}</p>
                    </div>
                    <p className="text-sm uppercase tracking-[0.1em] text-[#8a8470]">{item.time}</p>
                  </div>
                ))}
                {((section.content.items as ScheduleItem[]) || []).length === 0 && (
                  <p className="text-center text-sm text-[#8a8470]">Schedule coming soon.</p>
                )}
              </div>
            </div>
          )}

          {section.type === 'gallery' && (
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl italic mb-6" style={{ color: headingAccent, fontFamily: 'var(--heading-font)' }}>
                {section.content.heading}
              </h2>
              {galleryPhotos.length > 0 ? (
                <div className="text-left">
                  <MasonryGallery photos={galleryPhotos} />
                </div>
              ) : (
                <p className="text-sm text-[#8a8470]">Guest photos will appear here once shared.</p>
              )}
            </div>
          )}

          {section.type === 'rsvp' && (
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-2xl italic mb-4" style={{ color: headingAccent, fontFamily: 'var(--heading-font)' }}>
                {section.content.heading}
              </h2>
              <p className="text-sm text-[#46433a]">{section.content.body}</p>
            </div>
          )}

          {section.type === 'map' && (
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-2xl italic mb-4" style={{ color: headingAccent, fontFamily: 'var(--heading-font)' }}>
                {section.content.heading}
              </h2>
              <p className="text-sm text-[#46433a] mb-4">{section.content.address}</p>
              {section.content.mapEmbedUrl && (
                <iframe
                  src={section.content.mapEmbedUrl}
                  className="w-full h-64 border-0"
                  loading="lazy"
                  title="Venue map"
                />
              )}
            </div>
          )}

          {section.type === 'faq' && (
            <div className="max-w-xl mx-auto">
              <h2 className="text-2xl italic mb-6 text-center" style={{ color: headingAccent, fontFamily: 'var(--heading-font)' }}>
                {section.content.heading}
              </h2>
              <div className="space-y-4">
                {((section.content.items as FaqItem[]) || []).map((item, i) => (
                  <div key={i}>
                    <p className="font-medium">{item.question}</p>
                    <p className="text-sm text-[#8a8470] mt-1">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.type === 'custom_text' && (
            <div className="max-w-xl mx-auto">
              {section.content.heading && (
                <h2 className="text-2xl italic mb-4" style={{ color: headingAccent, fontFamily: 'var(--heading-font)' }}>
                  {section.content.heading}
                </h2>
              )}
              <p className="whitespace-pre-line leading-relaxed text-[#46433a]">{section.content.body}</p>
            </div>
          )}
        </RevealSection>
      ))}
    </div>
  );
}
