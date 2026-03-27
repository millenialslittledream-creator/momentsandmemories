import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function DecorGifts() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const decorRowRef = useRef<HTMLDivElement>(null);
  const giftRowRef = useRef<HTMLDivElement>(null);
  const decorLineRef = useRef<HTMLDivElement>(null);
  const giftLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── ClipPath reveal entrance — section opens like an expanding card ──
      gsap.fromTo(
        sectionRef.current,
        { clipPath: 'inset(12% 8% 12% 8% round 32px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)',
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            end: 'top 25%',
            scrub: 0.8,
          },
        }
      );

      // Heading animation — fires after clip opens
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 65%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Decor row animation
      gsap.fromTo(
        decorRowRef.current,
        { opacity: 0, x: -80 },
        {
          opacity: 1,
          x: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: decorRowRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Decor line animation
      gsap.fromTo(
        decorLineRef.current,
        { height: '0%' },
        {
          height: '100%',
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: decorRowRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Gift row animation
      gsap.fromTo(
        giftRowRef.current,
        { opacity: 0, x: 80 },
        {
          opacity: 1,
          x: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: giftRowRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Gift line animation
      gsap.fromTo(
        giftLineRef.current,
        { height: '0%' },
        {
          height: '100%',
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: giftRowRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Parallax for images
      const decorImage = decorRowRef.current?.querySelector('img');
      const giftImage = giftRowRef.current?.querySelector('img');

      if (decorImage) {
        gsap.to(decorImage, {
          y: -40,
          scrollTrigger: {
            trigger: decorRowRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      if (giftImage) {
        gsap.to(giftImage, {
          y: -40,
          scrollTrigger: {
            trigger: giftRowRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-32 bg-[#EADDD7] text-[#e4eee1] overflow-hidden"
    >
      {/* Texture overlay */}
      <div
        className="absolute inset-0 z-0 opacity-30 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0yNSOWSBJLsv1-47TiuxQ15AFQ4nsrk2tyl20R-zvNNsiDXBNDhZVYz1yHqSCTtqtGcVjl35j2rrDIrA-d5xW6tM2FPDinMxC7wGNXKzBCT0JhfwdSkLFQPVqU1yfc1GtqRHSfxSmlitg3lWmrbcCqzLdzR4XsiD9nN9-_O7fp4ViDdX7MFMvLLa9exuWvETBq8HCVRb7NcpP7tWvqDoEWCeegHipJmlKBCM4gpRO9AROi6bPaa2gmQvHKabiYnelhLueCkgQ9QIe')`,
        }}
      />
      <div className="absolute inset-0 z-[1] bg-[#111914]/70 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Heading */}
        <div ref={headingRef} className="flex flex-col items-center mb-32">
          <h2 className="text-5xl font-serif-exp italic text-center relative z-10">
            The room, <br />
            <span className="text-[#9cb092] not-italic font-bold font-agatho">curated in stone.</span>
          </h2>
        </div>

        {/* Content Rows */}
        <div className="flex flex-col gap-32">
          {/* Décor Row */}
          <div
            ref={decorRowRef}
            className="flex flex-col md:flex-row items-center justify-around w-full group"
          >
            {/* Text Content */}
            <div className="order-2 md:order-1 md:w-1/3 p-8 border-l border-white/15 relative">
              <div
                ref={decorLineRef}
                className="absolute top-0 left-0 w-1 bg-[#9cb092] origin-top"
              />
              <h3 className="text-4xl font-serif-exp leading-tight mb-2">Décor & Ambience</h3>
              <p className="text-xs md:text-sm font-display tracking-[0.18em] text-[#b2c3b1] mb-6 uppercase">
                TABLESCAPES • LIGHTING • CENTERPIECES
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold opacity-0"></span>
                <button className="px-6 py-3 border border-white/35 hover:bg-white hover:text-[#111914] transition-colors uppercase text-xs tracking-widest font-display font-semibold">
                  Explore Décor
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="order-1 md:order-2 md:w-1/2 relative h-[500px] w-full md:w-auto">
              <div className="absolute -top-10 -right-10 w-full h-full border border-white/15 z-0" />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d"
                alt="Artistic sculptural candle on stone surface"
                className="relative z-10 w-full h-full object-cover filter contrast-110 brightness-90 grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>

          {/* Gifts Row */}
          <div
            ref={giftRowRef}
            className="flex flex-col md:flex-row items-center justify-around w-full group"
          >
            {/* Image */}
            <div className="md:w-1/2 relative h-[500px] w-full md:w-auto">
              <div className="absolute -bottom-10 -left-10 w-full h-full border border-white/15 z-0" />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ"
                alt="Ceramic minimalist vase with dried flowers"
                className="relative z-10 w-full h-full object-cover filter contrast-110 brightness-90 grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </div>

            {/* Text Content */}
            <div className="md:w-1/3 p-8 border-r border-white/15 relative text-right">
              <div
                ref={giftLineRef}
                className="absolute top-0 right-0 w-1 bg-[#9cb092] origin-top"
              />
              <h3 className="text-4xl font-serif-exp leading-tight mb-2">Return Gifts</h3>
              <p className="text-xs md:text-sm font-display tracking-[0.18em] text-[#b2c3b1] mb-6 uppercase">
                CURATED • PERSONALIZED • FESTIVE
              </p>
              <div className="flex items-center justify-between flex-row-reverse">
                <span className="text-lg font-bold opacity-0"></span>
                <button className="px-6 py-3 border border-white/35 hover:bg-white hover:text-[#111914] transition-colors uppercase text-xs tracking-widest font-display font-semibold">
                  Shop Gifts
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
