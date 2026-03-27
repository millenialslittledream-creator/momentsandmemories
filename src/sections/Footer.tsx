import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const footerBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Scrubbed entrance: footer fades and rises into view ──
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0.5, y: 40 },
        {
          opacity: 1,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 90%',
            end: 'top 50%',
            scrub: 0.5,
          },
        }
      );

      // Icon animation — fires after scrubbed entrance
      gsap.fromTo(
        iconRef.current,
        { opacity: 0, scale: 0 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'back.out(2)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Heading animation
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 55%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Buttons animation
      gsap.fromTo(
        buttonsRef.current?.children || [],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          delay: 0.4,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 50%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Footer bottom animation
      gsap.fromTo(
        footerBottomRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.8,
          delay: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 45%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={sectionRef}
      className="bg-black text-white py-24 relative overflow-hidden"
    >
      {/* Background liquid effect */}
      <div className="absolute inset-0 bg-primary/10 liquid-bg opacity-20" />

      <div className="container mx-auto px-6 relative z-10 text-center">
        {/* Icon */}
        <div ref={iconRef} className="mb-12">
          <span className="material-icons text-6xl text-[#9cb092] animate-pulse">all_inclusive</span>
        </div>

        {/* Heading */}
        <h2
          ref={headingRef}
          className="text-3xl md:text-5xl font-serif-exp mb-8"
        >
          The celebration begins with you.
        </h2>

        {/* CTA Buttons */}
        <div
          ref={buttonsRef}
          className="flex flex-col md:flex-row justify-center gap-6 items-center"
        >
          {/* Start Designing Button */}
          <div className="noise-btn-container">
            <div className="noise-btn-bg" />
            <div className="noise-texture" />
            <button className="btn-inner bg-[#3d4a35] text-white backdrop-blur-md border border-black/10 px-10 py-4 font-display font-semibold text-lg hover:bg-[#4d5a44] transition-all shadow-lg">
              Start Designing
            </button>
          </div>

          {/* Explore Shop Button */}
          <div className="noise-btn-container">
            <div className="noise-btn-bg" />
            <div className="noise-texture" />
            <button className="btn-inner bg-gradient-to-br from-neutral-800 to-neutral-900 text-white border border-white/10 px-10 py-4 font-display font-semibold text-lg hover:from-neutral-700 hover:to-neutral-800 transition-all shadow-lg">
              Explore the Shop
            </button>
          </div>
        </div>

        {/* Footer Bottom */}
        <div
          ref={footerBottomRef}
          className="mt-24 pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-sm text-[#b4beb2] font-display"
        >
          <p>© 2023 MOMENTS & MEMORIES. THE ART OF CELEBRATION.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-[#9cb092] transition-colors">
              Instagram
            </a>
            <a href="#" className="hover:text-[#9cb092] transition-colors">
              Pinterest
            </a>
            <a href="#" className="hover:text-[#9cb092] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
