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
          {/* ── FRONT phone — Evite section (left, smaller) ── */}
          <div
            ref={phoneFrontRef}
            className="flex-shrink-0 relative w-[180px] h-[368px] bg-[#0d1210] rounded-[24px] shadow-[0_18px_50px_rgba(0,0,0,0.55)] border border-white/10 p-[3px] rotate-[-4deg] z-10 will-change-transform -mr-3 -mt-8"
          >
            {/* Notch */}
            <div className="absolute top-[7px] left-1/2 -translate-x-1/2 w-[42px] h-[10px] bg-[#0d1210] rounded-full z-20" />

            {/* Screen */}
            <div className="w-full h-full rounded-[21px] overflow-hidden bg-[#111914] flex flex-col">
              {/* Status bar */}
              <div className="h-5 flex items-center justify-between px-3 pt-0.5 text-[6px] text-[#b2c3b1]/60 font-semibold flex-shrink-0">
                <span>9:41</span>
                <div className="flex gap-0.5 items-center">
                  <span className="material-icons text-[6px]">signal_cellular_alt</span>
                  <span className="material-icons text-[6px]">wifi</span>
                  <span className="material-icons text-[6px]">battery_full</span>
                </div>
              </div>

              {/* Nav strip */}
              <div className="px-3 pb-1.5 flex-shrink-0 border-b border-white/[0.06]">
                <p className="font-serif-exp text-[7.5px] text-[#9cb092]">moments & memories</p>
              </div>

              {/* Evite card */}
              <div className="flex-1 px-2 pt-2 pb-2 flex flex-col gap-1.5 overflow-hidden">
                <div className="flex-1 rounded-lg overflow-hidden border border-white/10 flex flex-col">
                  {/* Photo + overlay */}
                  <div className="relative flex-shrink-0" style={{ height: '44%' }}>
                    <img src={evitePreviewImage} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/88" />
                    <div className="absolute bottom-1.5 left-2 right-2">
                      <p className="font-display text-[4px] tracking-[0.22em] uppercase text-[#9cb092] mb-0.5">You're invited to</p>
                      <h4 className="font-serif-exp text-[9px] text-white leading-tight">Sophie's Baby Shower</h4>
                    </div>
                  </div>

                  {/* Details panel */}
                  <div className="bg-[#192116] px-2 py-1.5 flex-1">
                    <div className="space-y-[4px]">
                      <div className="flex items-center gap-1">
                        <span className="material-icons text-[#9cb092] text-[6px]">calendar_today</span>
                        <span className="font-display text-[5px] text-[#b2c3b1]">June 15, 2025  ·  2:00 PM</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-icons text-[#9cb092] text-[6px]">location_on</span>
                        <span className="font-display text-[5px] text-[#b2c3b1]">The Grand Hall, Mumbai</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-icons text-[#9cb092] text-[6px]">person</span>
                        <span className="font-display text-[5px] text-[#b2c3b1]">Hosted by Priya & Meera</span>
                      </div>
                    </div>
                    <button className="mt-2 w-full bg-[#9cb092] text-[#111914] text-[5px] font-display tracking-[0.15em] uppercase py-[4px] rounded-sm font-semibold">
                      RSVP Now
                    </button>
                  </div>
                </div>

                {/* Action row */}
                <div className="flex gap-1 flex-shrink-0">
                  <button className="flex-1 bg-[#3d4a35]/80 text-[#e4eee1] py-[3.5px] text-[5px] font-display uppercase rounded-sm tracking-[0.08em]">
                    Share
                  </button>
                  <button className="flex-1 bg-white/5 text-[#9cb092] py-[3.5px] text-[5px] font-display uppercase rounded-sm border border-white/10 tracking-[0.08em]">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── BACK phone — Shop / Gifts section (right, bigger) ── */}
          <div
            ref={phoneBackRef}
            className="flex-shrink-0 w-[228px] h-[465px] bg-[#0d1210] rounded-[30px] shadow-xl border border-white/10 p-[3px] rotate-[4deg] z-0 will-change-transform mt-8"
          >
            <div className="w-full h-full rounded-[27px] overflow-hidden bg-[#111914] flex flex-col">
              {/* Status bar */}
              <div className="h-6 flex items-center justify-between px-4 pt-1 text-[8px] text-[#b2c3b1]/60 font-semibold flex-shrink-0">
                <span>9:41</span>
                <div className="flex gap-0.5 items-center">
                  <span className="material-icons text-[8px]">signal_cellular_alt</span>
                  <span className="material-icons text-[8px]">wifi</span>
                  <span className="material-icons text-[8px]">battery_full</span>
                </div>
              </div>

              {/* Shop header — mirrors Shop.tsx h1 */}
              <div className="px-4 pt-1 pb-2 flex-shrink-0 border-b border-white/[0.06]">
                <p className="font-display text-[5.5px] tracking-[0.22em] uppercase text-[#9cb092]/80 mb-0.5">moments & memories</p>
                <h3 className="font-serif-exp text-[15px] text-[#e4eee1] leading-tight">Décor &amp; Gifts</h3>
              </div>

              {/* Filter pills — mirrors Shop.tsx FILTERS */}
              <div className="px-3 pt-2 pb-1.5 flex gap-1.5 flex-shrink-0">
                {['Bestsellers', 'New', '< ₹500'].map((f, i) => (
                  <span key={i} className={`text-[5.5px] font-display tracking-wide px-2 py-[3px] rounded-full flex-shrink-0 ${
                    i === 0 ? 'bg-[#9cb092] text-[#111914] font-semibold' : 'border border-white/15 text-[#b2c3b1]/60'
                  }`}>{f}</span>
                ))}
              </div>

              {/* 2-column product grid — mirrors Shop.tsx card layout */}
              <div className="flex-1 px-3 pb-1 grid grid-cols-2 gap-2 overflow-hidden content-start">
                {shopPreviewItems.map((item, i) => (
                  <div key={i} className="bg-white/[0.04] rounded-lg overflow-hidden border border-white/[0.07]">
                    <div className="h-[62px] overflow-hidden bg-[#192116]">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="px-1.5 pt-1 pb-1.5">
                      <p className="font-display text-[6px] text-[#e4eee1] leading-tight truncate">{item.name}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="font-display text-[6px] text-[#9cb092] font-bold">₹{item.price}</p>
                        {item.bestseller && (
                          <span className="font-display text-[4.5px] tracking-[0.08em] uppercase text-[#9cb092] bg-[#9cb092]/10 px-1 py-[1px] rounded-sm">Best</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart summary bar */}
              <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="material-icons text-[#9cb092] text-[11px]">shopping_bag</span>
                  <span className="font-display text-[7px] text-[#b2c3b1]">2 items · ₹648</span>
                </div>
                <button className="bg-[#9cb092] text-[#111914] text-[7px] font-display tracking-[0.12em] uppercase font-bold px-3 py-[4px] rounded-sm">
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
