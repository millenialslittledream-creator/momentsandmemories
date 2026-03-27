import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextEffect } from '@/components/ui/text-effect';

gsap.registerPlugin(ScrollTrigger);

const blurSlideVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.018 },
    },
    exit: {
      transition: { staggerChildren: 0.012, staggerDirection: 1 },
    },
  },
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(10px) brightness(0%)',
      y: 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px) brightness(100%)',
      transition: { duration: 0.4 },
    },
    exit: {
      opacity: 0,
      y: -28,
      filter: 'blur(10px) brightness(0%)',
      transition: { duration: 0.35 },
    },
  },
};

export default function ChapterTransition() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineTopRef = useRef<HTMLDivElement>(null);
  const lineBottomRef = useRef<HTMLDivElement>(null);
  const chapterRef = useRef<HTMLSpanElement>(null);

  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    gsap.set([lineTopRef.current, lineBottomRef.current], { scaleY: 0 });
    gsap.set(chapterRef.current, { opacity: 0, y: 20 });

    let wasTriggered = false;

    const ctx = gsap.context(() => {
      // Single scrubbed timeline replaces 4 separate onEnter/onLeave handlers
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          end: 'top 30%',
          scrub: 0.8,
          onUpdate: (self) => {
            // Toggle TextEffect at 30% progress
            const shouldTrigger = self.progress > 0.3;
            if (shouldTrigger !== wasTriggered) {
              wasTriggered = shouldTrigger;
              setTrigger(shouldTrigger);
            }
          },
        },
      });

      // Lines grow in
      tl.to([lineTopRef.current, lineBottomRef.current], {
        scaleY: 1, duration: 0.5, ease: 'power3.out',
      }, 0);

      // Chapter label fades in
      tl.to(chapterRef.current, {
        opacity: 1, y: 0, duration: 0.4, ease: 'power3.out',
      }, 0.15);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    // No border, no separate bg — flows directly from Invitations as one surface
    <section
      ref={sectionRef}
      className="relative w-full py-20 overflow-hidden text-[#1f2a1c]"
    >

      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center text-center">

        {/* Top line */}
        <div
          ref={lineTopRef}
          className="w-px h-16 bg-gradient-to-b from-transparent to-primary/50 mb-8 origin-top"
        />

        {/* Chapter label */}
        <span
          ref={chapterRef}
          className="text-xs tracking-[0.3em] font-bold text-primary mb-6 font-ciguatera"
        >
          CHAPTER II
        </span>

        {/* Title */}
        <div className="mb-8 max-w-4xl min-h-[1.2em]">
          <TextEffect
            per='word'
            as='h2'
            variants={blurSlideVariants}
            trigger={trigger}
            className="text-3xl md:text-5xl font-serif-exp text-[#1b2618] leading-tight"
          >
            Once the invite is sent, the scene comes next.
          </TextEffect>
        </div>

        {/* Description */}
        <div className="min-h-[3em]">
          <TextEffect
            per='word'
            as='p'
            variants={blurSlideVariants}
            trigger={trigger}
            delay={0.3}
            className="text-[#4a5d49] font-display text-lg leading-relaxed max-w-xl"
          >
            Now the space takes shape — décor, gifts, and details that make it feel intentional. Everything stays cohesive. Everything stays easy.
          </TextEffect>
        </div>

        {/* Bottom line */}
        <div
          ref={lineBottomRef}
          className="w-px h-16 bg-gradient-to-t from-transparent to-primary/50 mt-8 origin-bottom"
        />
      </div>
    </section>
  );
}
