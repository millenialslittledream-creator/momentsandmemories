import { useEffect, useRef, useState } from 'react';

import gsap from 'gsap';
import Navigation from '../sections/Navigation';

export default function Shop() {
  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [activeFilter, setActiveFilter] = useState('All');

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
    {
      id: 1,
      name: "Ceramic Minimalism Vase",
      category: "Décor",
      price: "$120",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ"
    },
    {
      id: 2,
      name: "Sculptural Stone Candle",
      category: "Ambience",
      price: "$85",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d"
    },
    {
      id: 3,
      name: "Handwoven Table Runner",
      category: "Décor",
      price: "$145",
      image: "https://static.wixstatic.com/media/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg"
    },
    {
      id: 4,
      name: "Brass Candle Holder Set",
      category: "Ambience",
      price: "$190",
      image: "https://static.wixstatic.com/media/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg"
    },
    {
      id: 5,
      name: "Artisan Match Cloche",
      category: "Gifts",
      price: "$45",
      image: "https://static.wixstatic.com/media/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg"
    },
    {
      id: 6,
      name: "Marble Coaster Set",
      category: "Gifts",
      price: "$65",
      image: "https://static.wixstatic.com/media/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg"
    },
    {
      id: 7,
      name: "Organic Linen Napkins",
      category: "Décor",
      price: "$55",
      image: "https://static.wixstatic.com/media/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg"
    },
    {
      id: 8,
      name: "Santal Essential Oil",
      category: "Ambience",
      price: "$38",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ"
    },
    {
      id: 9,
      name: "Stone Diffuser",
      category: "Gifts",
      price: "$110",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d"
    }
  ];

  const products = activeFilter === 'All' ? allProducts : allProducts.filter(p => p.category === activeFilter);

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
      
      <Navigation activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

      <main className="relative z-10 flex-grow pb-32">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div ref={headerRef} className="flex flex-col items-center mb-16 mt-8">
            <h1 className="text-5xl md:text-7xl font-serif-exp italic text-center mb-6 relative z-10">
              Décor <span className="text-[#9cb092] not-italic font-bold font-agatho">&</span> Gifts
            </h1>
            <p className="text-xs md:text-sm font-display tracking-[0.25em] text-[#b2c3b1] uppercase">
              The Collection — Curated in Stone
            </p>
            <div className="w-[1px] h-12 bg-[#9cb092]/40 mt-8" />
          </div>
          {/* Product Grid */}
          <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 min-h-[50vh]">
            {products.map((product) => (
              <div key={product.id} className="group cursor-pointer">
                {/* Image Container with Hover Effect */}
                <div className="relative aspect-[4/5] mb-6 overflow-hidden border border-white/15 bg-black/20">
                  <div className="absolute inset-0 bg-black/30 mix-blend-multiply z-10 pointer-events-none group-hover:bg-transparent transition-colors duration-700" />
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover grayscale contrast-110 brightness-90 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  />
                  
                  {/* Hover Corner Brackets */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />

                  {/* Add to Cart Overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-20 bg-gradient-to-t from-black/80 to-transparent">
                    <button className="w-full py-3 bg-[#9cb092]/90 backdrop-blur text-[#111914] text-xs font-display tracking-widest uppercase font-bold hover:bg-white transition-colors">
                      Add to Bag
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-serif-exp text-[#e4eee1] mb-1 group-hover:opacity-70 transition-opacity">
                      {product.name}
                    </h3>
                    <p className="text-[10px] font-display tracking-widest uppercase text-[#b2c3b1]">
                      {product.category}
                    </p>
                  </div>
                  <span className="text-lg font-agatho font-bold text-[#9cb092]">{product.price}</span>
                </div>
              </div>
            ))}
            
            {products.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-[#b2c3b1] font-display tracking-widest uppercase">No products found in this category.</p>
              </div>
            )}
          </div>

          {/* Load More */}
          {products.length > 0 && (
            <div className="flex justify-center mt-24">
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
