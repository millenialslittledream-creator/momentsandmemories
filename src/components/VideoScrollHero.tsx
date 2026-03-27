import { useRef, useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

interface VideoScrollHeroProps {
  children: ReactNode;
  startScale?: number;
  className?: string;
}

export function VideoScrollHero({
  children,
  startScale = 0.25,
  className = "",
}: VideoScrollHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [scrollScale, setScrollScale] = useState(startScale);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const maxScroll = containerHeight - windowHeight;
      const progress = Math.min(scrolled / maxScroll, 1);
      setScrollScale(startScale + progress * (1 - startScale));
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldReduceMotion, startScale]);

  const scale = shouldReduceMotion ? 1 : scrollScale;

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="relative h-[200vh] bg-background-dark">
        <div className="sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden">
          <div
            className="w-full h-screen overflow-hidden"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              willChange: "transform",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
