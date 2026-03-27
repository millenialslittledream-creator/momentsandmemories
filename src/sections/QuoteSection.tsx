import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function QuoteSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const lineLeftRef = useRef<HTMLDivElement>(null);
  const lineRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Quote fade in and scale — scrubbed for cinematic feel
      gsap.fromTo(
        quoteRef.current,
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            end: 'top 40%',
            scrub: 0.6,
          },
        }
      );

      // Decorative lines grow inward
      gsap.fromTo(
        [lineLeftRef.current, lineRightRef.current],
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'top 35%',
            scrub: 0.6,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 md:py-32 bg-[#EADDD7] flex items-center justify-center overflow-hidden"
    >
      {/* Subtle texture overlay — matches DecorGifts & Timeline */}
      <div
        className="absolute inset-0 z-0 opacity-20 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0yNSOWSBJLsv1-47TiuxQ15AFQ4nsrk2tyl20R-zvNNsiDXBNDhZVYz1yHqSCTtqtGcVjl35j2rrDIrA-d5xW6tM2FPDinMxC7wGNXKzBCT0JhfwdSkLFQPVqU1yfc1GtqRHSfxSmlitg3lWmrbcCqzLdzR4XsiD9nN9-_O7fp4ViDdX7MFMvLLa9exuWvETBq8HCVRb7NcpP7tWvqDoEWCeegHipJmlKBCM4gpRO9AROi6bPaa2gmQvHKabiYnelhLueCkgQ9QIe')`,
        }}
      />
      <div className="absolute inset-0 z-[1] bg-[#111914]/70 pointer-events-none" />

      <div className="text-center z-10 px-6 flex flex-col items-center">
        {/* Decorative lines + quote */}
        <div className="flex items-center gap-6 md:gap-10 w-full max-w-2xl">
          <div
            ref={lineLeftRef}
            className="flex-1 h-px bg-white/25 origin-right"
          />
          <p
            ref={quoteRef}
            className="text-lg md:text-2xl font-serif-exp italic text-[#e3eee2] leading-relaxed"
          >
            "An invitation sets the tone.<br className="hidden md:block" />
            The details complete the story."
          </p>
          <div
            ref={lineRightRef}
            className="flex-1 h-px bg-white/25 origin-left"
          />
        </div>
      </div>
    </section>
  );
}
