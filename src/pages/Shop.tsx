import { useEffect, useRef, useState } from 'react';

import gsap from 'gsap';
import Navigation from '../sections/Navigation';

const FILTERS = [
  { id: 'bestsellers', label: 'Bestsellers' },
  { id: 'new', label: 'New Arrivals' },
  { id: 'under500', label: 'Under ₹500' },
  { id: 'premium', label: 'Premium' },
] as const;

export default function Shop() {
  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [activeFilter, setActiveFilter] = useState('bestsellers');

  useEffect(() => {
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      // Intro animation
      const tl = gsap.timeline();

      tl.fromTo(
        pageRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.out' }
      )
      .fromTo(
        headerRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
        "-=0.4"
      )
      .fromTo(
        gridRef.current?.children ? Array.from(gridRef.current.children) : [],
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out' },
        "-=0.6"
      );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  // Filter change animation
  useEffect(() => {
    if (gridRef.current?.children) {
      gsap.fromTo(
        Array.from(gridRef.current.children),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [activeFilter]);

  const allProducts = [
    { id: 1, name: "Speckled Ceramic Vase", price: 299, tags: ['bestsellers'], isBestseller: true, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ" },
    { id: 2, name: "Bubble Cube Candle", price: 349, tags: ['bestsellers', 'new'], isBestseller: true, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d" },
    { id: 3, name: "Brass Lotus Diya", price: 559, tags: ['bestsellers', 'premium'], isBestseller: true, image: "https://static.wixstatic.com/media/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg" },
    { id: 4, name: "Mini Marble Pooja Thali", price: 799, tags: ['premium', 'bestsellers'], isBestseller: false, image: "https://static.wixstatic.com/media/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg" },
    { id: 5, name: "Stone Incense Holder", price: 199, tags: ['under500', 'new'], isBestseller: false, image: "https://static.wixstatic.com/media/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg" },
    { id: 6, name: "Marble Tray Set", price: 899, tags: ['premium'], isBestseller: false, image: "https://static.wixstatic.com/media/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg" },
    { id: 7, name: "Ceramic Match Cloche", price: 249, tags: ['under500', 'new'], isBestseller: false, image: "https://static.wixstatic.com/media/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg" },
    { id: 8, name: "Santal Essential Oil", price: 380, tags: ['under500', 'new'], isBestseller: false, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ" },
    { id: 9, name: "Stone Diffuser", price: 1100, tags: ['premium'], isBestseller: false, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d" },
  ];

  const products = allProducts.filter(p => p.tags.includes(activeFilter));

  return (
    <div ref={pageRef} className="relative min-h-screen bg-[#EADDD7] text-[#e4eee1] overflow-hidden flex flex-col pt-32">
      {/* Texture background matching landing page */}
      <div
        className="fixed inset-0 z-0 opacity-30 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0yNSOWSBJLsv1-47TiuxQ15AFQ4nsrk2tyl20R-zvNNsiDXBNDhZVYz1yHqSCTtqtGcVjl35j2rrDIrA-d5xW6tM2FPDinMxC7wGNXKzBCT0JhfwdSkLFQPVqU1yfc1GtqRHSfxSmlitg3lWmrbcCqzLdzR4XsiD9nN9-_O7fp4ViDdX7MFMvLLa9exuWvETBq8HCVRb7NcpP7tWvqDoEWCeegHipJmlKBCM4gpRO9AROi6bPaa2gmQvHKabiYnelhLueCkgQ9QIe')`,
        }}
      />
      <div className="fixed inset-0 z-[1] bg-[#111914]/70 pointer-events-none" />

      <Navigation />

      <main className="relative z-10 flex-grow pb-32">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div ref={headerRef} className="flex flex-col items-center mb-10 mt-8">
            <h1 className="text-5xl md:text-7xl font-serif-exp italic text-center mb-2 relative z-10">
              Décor <span className="text-[#9cb092] not-italic font-bold font-agatho">&</span> Gifts
            </h1>
            <p className="text-xs md:text-sm font-display tracking-[0.25em] text-[#b2c3b1] uppercase mb-8">
              Discover gifts that create memories
            </p>

            {/* Tab-style filter — matching reference */}
            <div className="flex items-center gap-8 border-b border-white/10 pb-0">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`relative pb-3 font-serif-exp text-sm italic transition-all duration-300 ${
                    activeFilter === filter.id
                      ? 'text-[#e4eee1]'
                      : 'text-[#b2c3b1]/50 hover:text-[#b2c3b1]'
                  }`}
                >
                  {filter.label}
                  {activeFilter === filter.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#e4eee1]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid — cream card style */}
          <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 min-h-[50vh]">
            {products.map((product) => (
              <div
                key={product.id}
                className="group cursor-pointer bg-[#EADDD7] border border-[#d5cbc3] overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-black/20 hover:border-[#9cb092]/40"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden bg-[#ddd2ca]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Bestseller badge (show on first product as example) */}
                  {product.isBestseller && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-[#9cb092] text-[#111914] font-display text-[8px] tracking-[0.15em] uppercase font-bold px-3 py-1">
                        Bestseller
                      </span>
                    </div>
                  )}

                  {/* Add to Bag on hover */}
                  <div className="absolute bottom-0 left-0 w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-10">
                    <button className="w-full py-2.5 bg-[#9cb092] text-[#111914] text-[10px] font-display tracking-[0.15em] uppercase font-bold hover:bg-[#adc4a3] transition-colors">
                      Add to Bag
                    </button>
                  </div>
                </div>

                {/* Product Info — dark text on cream */}
                <div className="p-4">
                  <h3 className="font-serif-exp text-sm text-[#2a3328] italic leading-snug mb-2 group-hover:text-[#9cb092] transition-colors">
                    {product.name}
                  </h3>
                  <p className="font-display text-sm font-semibold text-[#3d4a35]">
                    ₹ {product.price}
                  </p>
                </div>
              </div>
            ))}

            {products.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-[#b2c3b1] font-display tracking-widest uppercase">No products found for this event type.</p>
              </div>
            )}
          </div>

          {/* Load More */}
          {products.length > 0 && (
            <div className="flex justify-center mt-16">
              <button className="px-10 py-4 border border-white/35 text-white text-xs font-display tracking-[0.2em] uppercase hover:bg-white hover:text-[#111914] transition-colors">
                Explore More
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
