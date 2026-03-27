import { useState, useEffect, useRef } from 'react';

// Each half mirrors the Hero's exact appearance (dark top / stone bottom split)
// so it looks like the actual Hero page splitting open to reveal Invitations.
const HERO_HALF = 'linear-gradient(to bottom, #2a3025 50%, #d5ddd0 50%)';

export default function AnimatedScrollSection() {
  const [split, setSplit] = useState(false);
  const splitRef = useRef(false);
  const animRef = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { inView.current = entry.isIntersecting; },
      { threshold: 0.01 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!inView.current || animRef.current) return;
      const down = e.deltaY > 0;

      // Scrolling DOWN and not yet split → trigger the split
      if (down && !splitRef.current) {
        e.preventDefault();
        animRef.current = true;
        splitRef.current = true;
        setSplit(true);
        setTimeout(() => {
          animRef.current = false;
          // Jump directly to Invitations — no dead-scroll after split
          document.getElementById('invitations')?.scrollIntoView({ behavior: 'instant' });
        }, 1000);
        return;
      }

      // Scrolling UP and already split → reverse the split
      if (!down && splitRef.current) {
        e.preventDefault();
        animRef.current = true;
        splitRef.current = false;
        setSplit(false);
        setTimeout(() => {
          animRef.current = false;
          // Jump directly back to Hero
          document.getElementById('hero')?.scrollIntoView({ behavior: 'instant' });
        }, 1000);
        return;
      }

      // At boundaries: let natural scroll pass through to Hero / Invitations
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    // bg-background-dark shows through once both halves have slid away
    <div ref={sectionRef} className="relative overflow-hidden h-screen bg-background-dark">

      {/* Left half — slides DOWN */}
      <div
        className="absolute inset-y-0 left-0 w-1/2"
        style={{
          background: HERO_HALF,
          transform: split ? 'translateY(100%)' : 'translateY(0)',
          transition: 'transform 1000ms cubic-bezier(0.76, 0, 0.24, 1)',
        }}
      />

      {/* Right half — slides UP */}
      <div
        className="absolute inset-y-0 left-1/2 w-1/2"
        style={{
          background: HERO_HALF,
          transform: split ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 1000ms cubic-bezier(0.76, 0, 0.24, 1)',
        }}
      />

    </div>
  );
}
