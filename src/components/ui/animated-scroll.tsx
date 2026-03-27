import { useState, useEffect, useRef } from 'react';

export interface PageData {
  leftBgImage: string | null;
  rightBgImage: string | null;
  leftContent: { heading: string; description: string } | null;
  rightContent: { heading: string; description: string } | null;
  leftBgColor?: string;
  rightBgColor?: string;
  leftTextDark?: boolean;
  rightTextDark?: boolean;
}

interface Props {
  pages: PageData[];
}

export default function AnimatedScroll({ pages }: Props) {
  const [current, setCurrent] = useState(0); // 0-indexed
  const numPages = pages.length;
  const isAnimating = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(0);

  // Keep ref in sync with state so wheel handler always reads latest value
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const idx = currentRef.current;
      const goingDown = e.deltaY > 0;
      const goingUp = e.deltaY < 0;

      // At boundaries — let the page scroll normally
      if (goingUp && idx === 0) return;
      if (goingDown && idx === numPages - 1) return;

      e.preventDefault();
      if (isAnimating.current) return;
      isAnimating.current = true;

      setCurrent(p => (goingDown ? p + 1 : p - 1));
      setTimeout(() => { isAnimating.current = false; }, 1000);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [numPages]);

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden">
      {pages.map((page, i) => {
        const isActive = current === i;
        // Left half enters from bottom, right half enters from top
        const leftY = isActive ? '0%' : '100%';
        const rightY = isActive ? '0%' : '-100%';

        const leftText = page.leftTextDark ? '#211119' : '#ffffff';
        const rightText = page.rightTextDark ? '#211119' : '#ffffff';

        return (
          <div key={i} className="absolute inset-0 pointer-events-none">
            {/* ── Left Half ── */}
            <div
              className="absolute inset-y-0 left-0 w-1/2 transition-transform duration-1000 ease-in-out"
              style={{ transform: `translateY(${leftY})` }}
            >
              <div
                className="relative w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: page.leftBgImage ? `url(${page.leftBgImage})` : undefined,
                  backgroundColor: page.leftBgColor ?? (page.leftBgImage ? undefined : '#211119'),
                }}
              >
                {page.leftBgImage && <div className="absolute inset-0 bg-black/35" />}
                {page.leftContent && (
                  <div
                    className="relative z-10 flex flex-col items-center justify-center h-full px-10 text-center"
                    style={{ color: leftText }}
                  >
                    <h2 className="font-serif-exp text-3xl md:text-4xl leading-tight mb-4">
                      {page.leftContent.heading}
                    </h2>
                    <p className="font-display text-sm leading-relaxed opacity-75 max-w-xs">
                      {page.leftContent.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Half ── */}
            <div
              className="absolute inset-y-0 left-1/2 w-1/2 transition-transform duration-1000 ease-in-out"
              style={{ transform: `translateY(${rightY})` }}
            >
              <div
                className="relative w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: page.rightBgImage ? `url(${page.rightBgImage})` : undefined,
                  backgroundColor: page.rightBgColor ?? (page.rightBgImage ? undefined : '#211119'),
                }}
              >
                {page.rightBgImage && <div className="absolute inset-0 bg-black/35" />}
                {page.rightContent && (
                  <div
                    className="relative z-10 flex flex-col items-center justify-center h-full px-10 text-center"
                    style={{ color: rightText }}
                  >
                    <h2 className="font-serif-exp text-3xl md:text-4xl leading-tight mb-4">
                      {page.rightContent.heading}
                    </h2>
                    <p className="font-display text-sm leading-relaxed opacity-75 max-w-xs">
                      {page.rightContent.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Divider line ── */}
            <div className="absolute inset-y-0 left-1/2 w-px bg-white/10 z-10 pointer-events-none" />
          </div>
        );
      })}

      {/* ── Page dots ── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => { if (!isAnimating.current) setCurrent(i); }}
            className={`rounded-full transition-all duration-300 ${
              current === i ? 'w-2 h-2 bg-primary scale-125' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
