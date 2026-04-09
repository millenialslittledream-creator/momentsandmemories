import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Tilt } from '@/components/ui/tilt';
import { Spotlight } from '@/components/ui/spotlight';

gsap.registerPlugin(ScrollTrigger);

const invitationCards = [
  {
    id: 1,
    title: 'The Wedding Suite',
    subtitle: 'DIGITAL ONLY',
    image: '/wedding.jpeg',
    objectPosition: 'center 25%',
    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
    offset: 'mt-12',
  },
  {
    id: 2,
    title: 'Birthday Glow',
    subtitle: 'HYBRID SUITE',
    image: '/bady.jpeg',
    objectPosition: 'center 15%',
    borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
    offset: '-mt-12 md:-mt-24',
  },
  {
    id: 3,
    title: 'Baby Shower Bloom',
    subtitle: 'PRINT & DIGITAL',
    image: '/babyshower.jpeg',
    objectPosition: 'center center',
    borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
    offset: 'mt-8',
  },
];

export default function Invitations() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 80 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 95%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Cards staggered entrance
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { opacity: 0, y: 80, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardsRef.current[0],
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Parallax
      gsap.to(cardsRef.current.filter(Boolean), {
        y: (i: number) => (i % 2 === 0 ? -30 : -50),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-32 overflow-hidden bg-[#EADDD7] text-[#e4eee1]"
    >
      {/* Stone texture overlay — consistent theme */}
      <div
        className="absolute inset-0 z-0 opacity-30 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0yNSOWSBJLsv1-47TiuxQ15AFQ4nsrk2tyl20R-zvNNsiDXBNDhZVYz1yHqSCTtqtGcVjl35j2rrDIrA-d5xW6tM2FPDinMxC7wGNXKzBCT0JhfwdSkLFQPVqU1yfc1GtqRHSfxSmlitg3lWmrbcCqzLdzR4XsiD9nN9-_O7fp4ViDdX7MFMvLLa9exuWvETBq8HCVRb7NcpP7tWvqDoEWCeegHipJmlKBCM4gpRO9AROi6bPaa2gmQvHKabiYnelhLueCkgQ9QIe')`,
        }}
      />
      <div className="absolute inset-0 z-[1] bg-[#111914]/70 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Heading */}
        <div ref={headingRef} className="flex flex-col md:flex-row items-start justify-between mb-24">
          <div className="md:w-1/2">
            <h2 className="text-4xl md:text-5xl font-serif-exp italic mb-6 text-[#e4eee1] leading-tight">
              Design Invitations That Move <br />
              <span className="text-primary not-italic font-agatho">With Your Celebration.</span>
            </h2>
            <p className="text-[#b2c3b1] font-display text-lg leading-relaxed max-w-md">
              Our invitations aren't static cards. They're living canvases that carry the emotion of your moment.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 min-h-[60vh]">
          {invitationCards.map((card, index) => (
            <div
              key={card.id}
              ref={(el) => { cardsRef.current[index] = el; }}
              className={`relative group flex flex-col items-center ${card.offset}`}
              style={{ willChange: 'transform' }}
            >
              {/* Blob Card */}
              <Tilt
                className="w-2/3 md:w-[58%] aspect-[4/5] blob-shape glass-panel overflow-hidden relative"
                style={{
                  borderRadius: card.borderRadius,
                  animation: `morph 8s ease-in-out infinite`,
                  animationDelay: `${index * 2}s`,
                } as React.CSSProperties}
                rotationFactor={6}
                isRevese
                springOptions={{ stiffness: 26.7, damping: 4.1, mass: 0.2 }}
              >
                <Spotlight
                  className="z-10 from-white/50 via-white/20 to-white/5 blur-2xl"
                  size={220}
                  springOptions={{ stiffness: 26.7, damping: 4.1, mass: 0.2 }}
                />
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
                  style={{ objectPosition: card.objectPosition }}
                />
              </Tilt>

              {/* Card Info */}
              <div className="mt-6 text-center w-full">
                <h3 className="text-xl font-serif-exp text-[#e4eee1]">
                  {card.title}
                </h3>
                <p className="text-xs tracking-widest text-[#b2c3b1] mt-2">
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
