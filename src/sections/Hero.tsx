import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Real products mirrored from Shop page so the phone preview matches what
// the user will actually see on /shop.
const shopPreviewItems = [
  {
    name: 'Speckled Ceramic Vase',
    price: 299,
    bestseller: true,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ',
  },
  {
    name: 'Bubble Cube Candle',
    price: 349,
    bestseller: true,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d',
  },
  {
    name: 'Brass Lotus Diya',
    price: 559,
    bestseller: false,
    image:
      'https://static.wixstatic.com/media/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg',
  },
];

// Mirrors the real baby-shower evite — uses the same image-background + dark
// gradient + sage accents pattern from FinalPreview/TemplateGallery.
const evitePreviewImage =
  'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=560&fit=crop';

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const phoneFrontRef = useRef<HTMLDivElement>(null);
  const phoneBackRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Entrance ───────────────────────────────────────────────
      gsap.fromTo(
        leftRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: 0.3 }
      );

      gsap.fromTo(
        rightRef.current,
        { opacity: 0, x: 30, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, duration: 1.2, ease: 'power3.out', delay: 0.5 }
      );

      // ── Seamless scroll transition into the next section ──────
      // As the user scrolls past the hero we run a scrubbed timeline that:
      //   1. Gently floats content upward + fades it out
      //   2. Parallaxes the two phones at different depths (depth illusion)
      //   3. Scales the right phone cluster slightly inward
      //   4. Fades a dark bottom gradient in to blend into Timeline's
      //      `#EADDD7 + #111914/70` overlay color — no hard section cut.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });

      tl.to(
        leftRef.current,
        { y: -60, opacity: 0, ease: 'none' },
        0
      )
        .to(
          phoneFrontRef.current,
          { y: -90, rotate: -6, scale: 0.94, ease: 'none' },
          0
        )
        .to(
          phoneBackRef.current,
          { y: -50, rotate: 6, scale: 0.96, ease: 'none' },
          0
        )
        .to(
          rightRef.current,
          { opacity: 0.3, ease: 'none' },
          0.3
        )
        .fromTo(
          fadeRef.current,
          { opacity: 0 },
          { opacity: 1, ease: 'none' },
          0
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen w-full hero-bokeh-bg z-10 overflow-hidden flex items-center"
    >
      {/* Subtle vignette for depth */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(90, 80, 60, 0.15) 100%)',
        }}
      />

      <div className="relative z-10 container mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center py-24 md:py-16">
        {/* LEFT COLUMN — Text + CTAs */}
        <div ref={leftRef} className="max-w-xl">
          {/* Brand tagline (small eyebrow) */}
          <p className="font-serif-exp italic text-[#5a6c50] text-sm tracking-wide mb-3">
            moments &amp; memories
          </p>

          <h1 className="font-serif-exp text-[#2a3328] leading-[1.05] tracking-tight text-4xl md:text-5xl lg:text-[3.4rem]">
            Create Beautiful <span className="italic">Evites</span>
            <br />
            &amp; Discover Perfect <span className="italic">Gifts</span>
            <br />
            <span className="font-agatho not-italic text-[#3d4a35] text-3xl md:text-4xl lg:text-[2.5rem]">
              for Every Celebration
            </span>
          </h1>

          <p className="mt-6 text-[#3d4a35] font-display text-sm md:text-base leading-relaxed max-w-md">
            Plan your special moments effortlessly. Design invitations, invite loved
            ones, and explore curated gifts — all in one seamless experience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3 mt-7">
            <button
              onClick={() => navigate('/create')}
              className="px-7 py-3 bg-[#2a3328] text-[#e4eee1] font-display text-[11px] tracking-[0.2em] uppercase hover:bg-[#3d4a35] transition-all shadow-lg shadow-[#2a3328]/25 flex items-center gap-2"
            >
              Create Your Evite
              <span className="material-icons text-sm">arrow_forward</span>
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="px-7 py-3 border-2 border-[#9cb092] text-[#3d4a35] font-display text-[11px] tracking-[0.2em] uppercase hover:bg-[#9cb092]/15 transition-all"
            >
              Explore Gifts
            </button>
          </div>

          <p className="mt-6 text-[#5a6c50] font-serif-exp italic text-[13px]">
            Trusted for birthdays, baby showers &amp; special moments
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-5 mt-5 text-[#3d4a35] font-display text-xs tracking-wide">
            <div className="flex items-center gap-1.5">
              <span className="material-icons text-[#9cb092] text-base">celebration</span>
              100+ Templates
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-icons text-[#9cb092] text-base">card_giftcard</span>
              Curated Gifts
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-icons text-[#9cb092] text-base">share</span>
              Easy Sharing
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Phone Mockups */}
        <div
          ref={rightRef}
          className="relative hidden md:flex items-center justify-center h-[540px]"
        >
          {/* Back Phone — Décor & Gifts (mirrors /shop) */}
          <div
            ref={phoneBackRef}
            className="absolute right-0 top-6 w-[215px] h-[440px] bg-[#1a1612] rounded-[30px] shadow-2xl border border-white/10 p-[3px] rotate-[4deg] translate-x-10 will-change-transform"
          >
            <div className="w-full h-full rounded-[27px] overflow-hidden relative bg-[#EADDD7]">
              {/* Dark theme overlay matching Shop page */}
              <div className="absolute inset-0 bg-[#111914]/70 pointer-events-none" />

              {/* Content layer */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Status bar */}
                <div className="h-6 flex items-center justify-between px-5 pt-1 text-[9px] text-[#e4eee1] font-semibold flex-shrink-0">
                  <span>9:41</span>
                  <div className="flex gap-0.5 items-center">
                    <span className="material-icons text-[9px]">signal_cellular_alt</span>
                    <span className="material-icons text-[9px]">wifi</span>
                    <span className="material-icons text-[9px]">battery_full</span>
                  </div>
                </div>

                {/* Shop header — exactly matches Shop.tsx */}
                <div className="px-4 pt-2 pb-2 text-center flex-shrink-0">
                  <h3 className="font-serif-exp italic text-[#e4eee1] text-base leading-none">
                    Décor{' '}
                    <span className="text-[#9cb092] not-italic font-bold font-agatho">&amp;</span>{' '}
                    Gifts
                  </h3>
                  <p className="font-display text-[6px] tracking-[0.25em] text-[#b2c3b1] uppercase mt-0.5">
                    Discover gifts that create memories
                  </p>
                </div>

                {/* Tab filter row */}
                <div className="px-3 flex gap-2 border-b border-white/10 flex-shrink-0">
                  <span className="font-serif-exp italic text-[8px] text-[#e4eee1] pb-1 border-b border-[#e4eee1]">
                    Bestsellers
                  </span>
                  <span className="font-serif-exp italic text-[8px] text-[#b2c3b1]/50 pb-1">
                    New
                  </span>
                  <span className="font-serif-exp italic text-[8px] text-[#b2c3b1]/50 pb-1">
                    Premium
                  </span>
                </div>

                {/* Product grid — 2×2 cream cards mimicking Shop.tsx */}
                <div className="px-2.5 py-2 grid grid-cols-2 gap-1.5 flex-1 overflow-hidden">
                  {shopPreviewItems.slice(0, 4).map((item, i) => (
                    <div
                      key={i}
                      className="bg-[#EADDD7] border border-[#d5cbc3] overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#ddd2ca]">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {item.bestseller && (
                          <span className="absolute top-1 left-1 bg-[#9cb092] text-[#111914] text-[5px] font-display tracking-[0.15em] uppercase font-bold px-1 py-[1px]">
                            Best
                          </span>
                        )}
                      </div>
                      <div className="px-1.5 py-1">
                        <h4 className="font-serif-exp italic text-[7px] text-[#2a3328] leading-tight truncate">
                          {item.name}
                        </h4>
                        <p className="font-display text-[7px] font-semibold text-[#3d4a35]">
                          ₹ {item.price}
                        </p>
                      </div>
                    </div>
                  ))}
                  {/* 4th slot — repeats bestseller to keep grid full */}
                  <div className="bg-[#EADDD7] border border-[#d5cbc3] overflow-hidden flex flex-col">
                    <div className="relative aspect-[4/5] overflow-hidden bg-[#ddd2ca]">
                      <img
                        src={shopPreviewItems[0].image}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="px-1.5 py-1">
                      <h4 className="font-serif-exp italic text-[7px] text-[#2a3328] leading-tight truncate">
                        Stone Incense
                      </h4>
                      <p className="font-display text-[7px] font-semibold text-[#3d4a35]">₹ 199</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Front Phone — Baby Shower Evite (mirrors FinalPreview card style) */}
          <div
            ref={phoneFrontRef}
            className="relative w-[235px] h-[480px] bg-[#1a1612] rounded-[32px] shadow-[0_30px_60px_rgba(42,51,40,0.45)] border border-white/10 p-[3px] rotate-[-4deg] -translate-x-6 z-10 will-change-transform"
          >
            {/* Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#1a1612] rounded-full z-20" />

            <div className="w-full h-full rounded-[29px] overflow-hidden relative bg-[#1a2418]">
              {/* Status bar */}
              <div className="relative z-10 h-6 flex items-center justify-between px-5 pt-1 text-[9px] text-[#e4eee1] font-semibold">
                <span>9:41</span>
                <div className="flex gap-0.5 items-center">
                  <span className="material-icons text-[9px]">signal_cellular_alt</span>
                  <span className="material-icons text-[9px]">wifi</span>
                  <span className="material-icons text-[9px]">battery_full</span>
                </div>
              </div>

              {/* App header — matches CreateEvite step header */}
              <div className="relative z-10 px-4 pb-1.5 flex items-center justify-between">
                <span className="font-serif-exp italic text-[10px] text-[#9cb092]">
                  moments &amp; memories
                </span>
                <span className="material-icons text-[#9cb092] text-xs">favorite_border</span>
              </div>

              {/* Evite card — mirrors FinalPreview exactly */}
              <div className="relative z-10 px-3 pb-2">
                <div className="border border-white/15 shadow-2xl shadow-[#9cb092]/10 overflow-hidden">
                  <div className="relative aspect-[3/4]">
                    <img
                      src={evitePreviewImage}
                      alt="Baby shower evite"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-3">
                      <p className="font-display text-[6px] tracking-[0.25em] uppercase text-white/60 mb-0.5">
                        You're invited to
                      </p>
                      <h4 className="font-serif-exp text-[13px] text-white italic leading-tight">
                        Sophie's Baby Shower
                      </h4>
                      <div className="space-y-0.5 mt-1.5">
                        <p className="font-display text-[7px] tracking-wide text-white/80 flex items-center gap-1">
                          <span className="material-icons text-[#9cb092] text-[8px]">
                            calendar_today
                          </span>
                          Sunday, June 15, 2025
                        </p>
                        <p className="font-display text-[7px] tracking-wide text-white/80 flex items-center gap-1">
                          <span className="material-icons text-[#9cb092] text-[8px]">
                            schedule
                          </span>
                          2:00 PM
                        </p>
                        <p className="font-display text-[7px] tracking-wide text-white/80 flex items-center gap-1">
                          <span className="material-icons text-[#9cb092] text-[8px]">
                            location_on
                          </span>
                          The Garden Pavilion
                        </p>
                      </div>
                      <p className="font-serif-exp text-[7px] text-white/60 italic mt-1.5 border-t border-white/10 pt-1">
                        "Join us as we welcome our little one."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom action strip — mirrors CreateEvite footer */}
              <div className="relative z-10 px-3 pt-1 pb-2 space-y-1">
                <button className="w-full bg-[#2a3328] text-[#e4eee1] py-1.5 text-[7px] font-display tracking-[0.2em] uppercase flex items-center justify-between px-2.5 border border-[#9cb092]/20">
                  <span className="flex items-center gap-1">
                    <span className="material-icons text-[9px]">send</span>
                    Send Invitation
                  </span>
                  <span className="material-icons text-[9px]">chevron_right</span>
                </button>
                <div className="flex gap-1">
                  <button className="flex-1 bg-white/[0.04] text-[#b2c3b1] py-1 text-[7px] font-display tracking-[0.15em] uppercase border border-white/10 flex items-center justify-center gap-1">
                    <span className="material-icons text-[8px]">edit</span>
                    Edit
                  </button>
                  <button className="flex-1 bg-white/[0.04] text-[#b2c3b1] py-1 text-[7px] font-display tracking-[0.15em] uppercase border border-white/10 flex items-center justify-center gap-1">
                    <span className="material-icons text-[8px]">group</span>
                    Guests
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seamless bottom transition — GSAP scrubs opacity 0 → 1 so the
          hero dissolves into the dark cream/sage tone that Timeline opens
          with. Content fades + parallaxes while this fades in. */}
      <div ref={fadeRef} className="hero-to-timeline-fade" />
    </section>
  );
}
