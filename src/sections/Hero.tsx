import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 4 products mirrored from Shop — fills the 2×2 grid in the right phone preview.
const shopPreviewItems = [
  {
    name: 'Ceramic Vase',
    price: 299,
    bestseller: true,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ',
  },
  {
    name: 'Cube Candle',
    price: 349,
    bestseller: true,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d',
  },
  {
    name: 'Brass Diya',
    price: 559,
    bestseller: false,
    image:
      'https://static.wixstatic.com/media/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg',
  },
  {
    name: 'Incense Holder',
    price: 199,
    bestseller: false,
    image:
      'https://static.wixstatic.com/media/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg',
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
          { y: -90, rotate: 12, scale: 0.94, ease: 'none' },
          0
        )
        .to(
          phoneBackRef.current,
          { y: -50, rotate: 34, scale: 0.96, ease: 'none' },
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
          {/* Brand name — primary headline */}
          <p className="font-serif-exp text-[#3d4a35] text-4xl md:text-5xl lg:text-[3.2rem] font-semibold tracking-tight leading-none mb-5">
            moments &amp; memories
          </p>

          <h1 className="font-serif-exp text-[#2a3328] leading-[1.2] tracking-tight text-lg md:text-xl lg:text-2xl">
            Create Beautiful Evites
            <br />
            &amp; Discover Perfect Gifts
            <br />
            <span className="font-agatho text-[#3d4a35] text-base md:text-lg lg:text-xl">
              for Every Celebration
            </span>
          </h1>

          <p className="mt-4 text-[#3d4a35] font-display text-xs md:text-sm leading-relaxed max-w-md">
            Plan your special moments effortlessly. Design invitations, invite loved
            ones, and explore curated gifts — all in one seamless experience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3 mt-7">
            <button
              onClick={() => navigate('/create')}
              className="w-44 py-3 bg-[#2a3328] text-[#e4eee1] font-display text-[11px] tracking-[0.2em] uppercase hover:bg-[#3d4a35] transition-all shadow-lg shadow-[#2a3328]/25 flex items-center justify-center gap-2"
            >
              Create Your Evite
              <span className="material-icons text-sm">arrow_forward</span>
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="w-44 py-3 border-2 border-[#9cb092] text-[#3d4a35] font-display text-[11px] tracking-[0.2em] uppercase hover:bg-[#9cb092]/15 transition-all flex items-center justify-center"
            >
              Explore Gifts
            </button>
          </div>

          <p className="mt-4 text-[#5a6c50] font-display text-[11px] tracking-wide">
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

        {/* RIGHT COLUMN — Phone Mockups
            Both phones use the same dark forest green (#111914) matching the
            CreateEvite & Shop page backgrounds. Left = evite card preview,
            Right = shop product grid. -mr-3 keeps them touching. */}
        <div
          ref={rightRef}
          className="hidden md:flex items-center justify-center h-[520px] w-full"
        >
          {/* ── FRONT phone — Evite section (left) ── */}
          <div
            ref={phoneFrontRef}
            className="flex-shrink-0 relative w-[204px] h-[416px] bg-[#0d1210] rounded-[28px] shadow-[0_18px_50px_rgba(0,0,0,0.55)] border border-white/10 p-[3px] z-10 will-change-transform"
            style={{ transform: 'rotate(6deg)', transformOrigin: 'bottom center' }}
          >
            {/* Notch */}
            <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-[46px] h-[11px] bg-[#0d1210] rounded-full z-20" />

            {/* Screen — matches CreateEvite/FinalPreview dark forest green */}
            <div className="w-full h-full rounded-[25px] overflow-hidden bg-[#111914] flex flex-col">
              {/* Status bar */}
              <div className="h-6 flex items-center justify-between px-4 pt-1 text-[7px] text-[#b2c3b1]/60 font-semibold flex-shrink-0">
                <span>9:41</span>
                <div className="flex gap-0.5 items-center">
                  <span className="material-icons text-[7px]">signal_cellular_alt</span>
                  <span className="material-icons text-[7px]">wifi</span>
                  <span className="material-icons text-[7px]">battery_full</span>
                </div>
              </div>

              {/* Nav strip */}
              <div className="px-3 pb-1.5 flex-shrink-0 border-b border-white/[0.06]">
                <p className="font-serif-exp text-[8px] text-[#9cb092]">moments & memories</p>
              </div>

              {/* Evite card */}
              <div className="flex-1 px-2.5 pt-2 pb-2 flex flex-col gap-1.5 overflow-hidden">
                <div className="flex-1 rounded-lg overflow-hidden border border-white/10 flex flex-col">
                  {/* Photo + overlay */}
                  <div className="relative flex-shrink-0" style={{ height: '46%' }}>
                    <img src={evitePreviewImage} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/88" />
                    <div className="absolute bottom-1.5 left-2 right-2">
                      <p className="font-display text-[4.5px] tracking-[0.22em] uppercase text-[#9cb092] mb-0.5">You're invited to</p>
                      <h4 className="font-serif-exp text-[10px] text-white leading-tight">Sophie's Baby Shower</h4>
                    </div>
                  </div>

                  {/* Details panel */}
                  <div className="bg-[#192116] px-2 py-1.5 flex-1">
                    <div className="space-y-[5px]">
                      <div className="flex items-center gap-1">
                        <span className="material-icons text-[#9cb092] text-[7px]">calendar_today</span>
                        <span className="font-display text-[5.5px] text-[#b2c3b1]">June 15, 2025  ·  2:00 PM</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-icons text-[#9cb092] text-[7px]">location_on</span>
                        <span className="font-display text-[5.5px] text-[#b2c3b1]">The Grand Hall, Mumbai</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-icons text-[#9cb092] text-[7px]">person</span>
                        <span className="font-display text-[5.5px] text-[#b2c3b1]">Hosted by Priya & Meera</span>
                      </div>
                    </div>
                    <button className="mt-2 w-full bg-[#9cb092] text-[#111914] text-[5.5px] font-display tracking-[0.15em] uppercase py-[5px] rounded-sm font-semibold">
                      RSVP Now
                    </button>
                  </div>
                </div>

                {/* Action row */}
                <div className="flex gap-1 flex-shrink-0">
                  <button className="flex-1 bg-[#3d4a35]/80 text-[#e4eee1] py-[4px] text-[5.5px] font-display uppercase rounded-sm tracking-[0.08em]">
                    Share
                  </button>
                  <button className="flex-1 bg-white/5 text-[#9cb092] py-[4px] text-[5.5px] font-display uppercase rounded-sm border border-white/10 tracking-[0.08em]">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── BACK phone — Shop section (right) ── same size as left */}
          <div
            ref={phoneBackRef}
            className="flex-shrink-0 w-[204px] h-[416px] bg-[#0d1210] rounded-[28px] shadow-xl border border-white/10 p-[3px] z-0 will-change-transform"
            style={{ transform: 'rotate(28deg)', transformOrigin: 'bottom center', marginLeft: '-52px' }}
          >
            <div className="w-full h-full rounded-[25px] overflow-hidden bg-[#111914] flex flex-col">
              {/* Status bar */}
              <div className="h-6 flex items-center justify-between px-4 pt-1 text-[7px] text-[#b2c3b1]/60 font-semibold flex-shrink-0">
                <span>9:41</span>
                <div className="flex gap-0.5 items-center">
                  <span className="material-icons text-[7px]">signal_cellular_alt</span>
                  <span className="material-icons text-[7px]">wifi</span>
                  <span className="material-icons text-[7px]">battery_full</span>
                </div>
              </div>

              {/* Shop header — mirrors Shop.tsx h1 + subtitle */}
              <div className="px-3 pt-1 pb-2 flex-shrink-0 border-b border-white/[0.07]">
                <h3 className="font-serif-exp text-[13px] text-[#e4eee1] leading-tight">Gifts</h3>
                <p className="font-display text-[5px] tracking-[0.28em] uppercase text-[#b2c3b1]/40 mt-0.5">
                  Discover gifts that create memories
                </p>
              </div>

              {/* Filter pills — mirrors Shop.tsx FILTERS */}
              <div className="px-3 pt-2 pb-1.5 flex gap-1 flex-shrink-0">
                {['All', 'Bestsellers', 'New', 'Under $500'].map((f, i) => (
                  <span key={i} className={`text-[5px] font-display tracking-[0.12em] uppercase px-1.5 py-[3px] flex-shrink-0 ${
                    i === 1 ? 'bg-[#9cb092] text-[#111914] font-semibold' : 'border border-white/15 text-[#b2c3b1]/55'
                  }`}>{f}</span>
                ))}
              </div>

              {/* 2-column product grid — mirrors Shop.tsx card layout */}
              <div className="flex-1 px-3 pb-1 grid grid-cols-2 gap-2 overflow-hidden content-start">
                {shopPreviewItems.map((item, i) => (
                  <div key={i} className="bg-white/[0.03] overflow-hidden border border-white/[0.07]">
                    <div className="aspect-square overflow-hidden bg-[#192116] relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      {item.bestseller && (
                        <span className="absolute top-1 left-1 bg-[#9cb092] text-[#111914] font-display text-[4px] tracking-[0.14em] uppercase font-bold px-1 py-[1px]">
                          Best
                        </span>
                      )}
                    </div>
                    <div className="px-1.5 pt-1 pb-1.5">
                      <p className="font-serif-exp text-[7px] text-[#e4eee1] leading-tight truncate">{item.name}</p>
                      <p className="font-display text-[6.5px] text-[#9cb092] font-semibold mt-0.5">$ {item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart summary bar */}
              <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="material-icons text-[#9cb092] text-[11px]">shopping_bag</span>
                  <span className="font-display text-[7px] text-[#b2c3b1]">2 items · $ 648</span>
                </div>
                <button className="bg-[#9cb092] text-[#111914] text-[6.5px] font-display tracking-[0.12em] uppercase font-bold px-2.5 py-[4px]">
                  View Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
