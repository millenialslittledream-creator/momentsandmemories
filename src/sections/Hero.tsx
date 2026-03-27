import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const floatingImages = [
  {
    src: 'https://static.wixstatic.com/media/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg',
    alt: 'Wedding ceremony decor',
    className: 'w-[120px] h-[160px] md:w-[150px] md:h-[200px] top-[6%] left-[2%] md:top-[8%] md:left-[5%]',
    radius: '40% 60% 70% 30% / 40% 50% 60% 50%',
    delay: 0,
    float: 'animate-float-slow',
  },
  {
    src: 'https://static.wixstatic.com/media/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg',
    alt: 'Wedding floral arrangement',
    className: 'w-[100px] h-[130px] md:w-[120px] md:h-[160px] top-[14%] right-[2%] md:right-[6%]',
    radius: '60% 40% 30% 70% / 60% 30% 70% 40%',
    delay: 0.15,
    float: 'animate-float-medium',
  },
  {
    src: 'https://static.wixstatic.com/media/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg',
    alt: 'Reception venue decor',
    className: 'w-[110px] h-[140px] md:w-[130px] md:h-[170px] bottom-[10%] left-[4%] md:left-[8%]',
    radius: '30% 70% 70% 30% / 30% 30% 70% 70%',
    delay: 0.3,
    float: 'animate-float-fast',
  },
  {
    src: 'https://static.wixstatic.com/media/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg',
    alt: 'Reception celebration',
    className: 'w-[140px] h-[180px] md:w-[170px] md:h-[220px] bottom-[6%] right-[2%] md:right-[5%]',
    radius: '50% 50% 20% 80% / 25% 80% 20% 75%',
    delay: 0.2,
    float: 'animate-float-slow',
  },
  {
    src: 'https://static.wixstatic.com/media/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg',
    alt: 'Birthday party decoration',
    className: 'w-[80px] h-[100px] md:w-[100px] md:h-[130px] top-[45%] left-[1%] md:top-[50%] md:left-[3%]',
    radius: '70% 30% 50% 50% / 30% 60% 40% 70%',
    delay: 0.4,
    float: 'animate-float-medium',
  },
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const imagesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title entrance
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 }
      );

      // Staggered image entrance — bloom in from center
      imagesRef.current.forEach((img, i) => {
        if (!img) return;
        gsap.fromTo(
          img,
          { opacity: 0, scale: 0.6, filter: 'blur(12px) brightness(0.5)' },
          {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px) brightness(1)',
            duration: 1.4,
            ease: 'power3.out',
            delay: 0.5 + (floatingImages[i]?.delay || 0),
          }
        );
      });

      // Title fade out on scroll
      gsap.fromTo(
        titleRef.current,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -50,
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: '30% top',
            end: '60% top',
            scrub: true,
          },
        }
      );

      // Images parallax + fade on scroll
      imagesRef.current.forEach((img, i) => {
        if (!img) return;
        gsap.fromTo(
          img,
          { y: 0, opacity: 1, scale: 1 },
          {
            y: -60 - i * 15,
            opacity: 0.2,
            immediateRender: false,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: '20% top',
              end: '70% top',
              scrub: true,
            },
          }
        );
      });

      // Section exit: pin hero, scale down gently, fade, round corners
      gsap.fromTo(
        sectionRef.current,
        { scale: 1, opacity: 1, borderRadius: '0px' },
        {
          scale: 0.92,
          opacity: 0.3,
          borderRadius: '24px',
          ease: 'none',
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'bottom bottom',
            end: '+=80%',
            scrub: 0.6,
            pin: true,
            pinSpacing: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full liquid-bg z-10 overflow-hidden"
    >
      {/* Vignette overlay for depth */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(15,5,10,0.5) 100%)',
        }}
      />
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/15 via-transparent to-black/30 pointer-events-none" />

      {/* Floating image collage */}
      {floatingImages.map((img, i) => (
        <div
          key={i}
          ref={(el) => { imagesRef.current[i] = el; }}
          className={`absolute ${img.className} ${img.float} z-[3] pointer-events-none`}
          style={{ borderRadius: img.radius, overflow: 'hidden' }}
        >
          <img
            src={img.src}
            alt={img.alt}
            className="w-full h-full object-cover opacity-50 mix-blend-luminosity contrast-[1.1] saturate-50"
          />
          {/* Warm tint overlay */}
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        </div>
      ))}

      {/* Center Content - Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[30]">
        <h1
          ref={titleRef}
          className="font-serif-exp leading-none tracking-tighter text-center"
        >
          <span className="block italic text-[#556c4d] text-[6vw]">moments & memories</span>
        </h1>
      </div>
    </section>
  );
}
