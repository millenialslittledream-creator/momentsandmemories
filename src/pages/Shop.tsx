import { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import Navigation from '../sections/Navigation';
import { api } from '@/lib/api';

// ── Filters ───────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all',         label: 'All'         },
  { id: 'bestsellers', label: 'Bestsellers' },
  { id: 'new',         label: 'New'         },
  { id: 'under500',    label: 'Under $500'  },
  { id: 'premium',     label: 'Premium'     },
] as const;
type FilterId = typeof FILTERS[number]['id'];

// ── Product type ──────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  price: number;
  tags: string[];
  isBestseller: boolean;
  description: string;
  details: string[];
  images: string[];
}

// ── Product data ──────────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  {
    id: 1, name: 'Speckled Ceramic Vase', price: 299,
    tags: ['all', 'bestsellers'], isBestseller: true,
    description: 'Hand-thrown speckled ceramic vase in warm stone tones. Each piece bears unique natural imperfections — the mark of a craft made entirely by hand.',
    details: ['Height: 22 cm', 'Material: Stoneware', 'Handcrafted in India', 'Wipe clean only'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ',
      'https://static.wixstatic.com/media/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg',
      'https://static.wixstatic.com/media/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg',
    ],
  },
  {
    id: 2, name: 'Bubble Cube Candle', price: 349,
    tags: ['all', 'bestsellers', 'new'], isBestseller: true,
    description: 'Sculptural soy-wax candle with a calming sandalwood & amber fragrance. Burns for up to 40 hours. The geometric form doubles as a décor object.',
    details: ['Weight: 200 g', 'Burn time: ~40 hrs', 'Fragrance: Sandalwood & Amber', 'Soy wax blend'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d',
      'https://static.wixstatic.com/media/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg',
      'https://static.wixstatic.com/media/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg',
    ],
  },
  {
    id: 3, name: 'Brass Lotus Diya', price: 559,
    tags: ['all', 'bestsellers', 'premium'], isBestseller: true,
    description: 'Hand-cast brass diya with lotus petal detailing. A sacred light for your home, crafted by artisans in Rajasthan. A perfect gift or ritual piece.',
    details: ['Diameter: 12 cm', 'Material: Brass', 'Artisan made — Rajasthan', 'Oil lamp, wicks included'],
    images: [
      'https://static.wixstatic.com/media/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ',
      'https://static.wixstatic.com/media/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg',
    ],
  },
  {
    id: 4, name: 'Mini Marble Pooja Thali', price: 799,
    tags: ['all', 'premium', 'bestsellers'], isBestseller: false,
    description: 'Carved from white Makrana marble with delicate brass inlay. A minimal yet sacred thali for daily puja or as an elegant decorative tray.',
    details: ['Diameter: 18 cm', 'Material: Makrana marble + brass', 'Handcrafted', 'Wipe clean only'],
    images: [
      'https://static.wixstatic.com/media/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg',
      'https://static.wixstatic.com/media/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg',
      'https://static.wixstatic.com/media/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg',
    ],
  },
  {
    id: 5, name: 'Stone Incense Holder', price: 199,
    tags: ['all', 'under500', 'new'], isBestseller: false,
    description: 'Handcarved soapstone incense holder with natural veining. Holds both stick and cone incense. Each piece is one of a kind.',
    details: ['Size: 10 × 4 cm', 'Material: Soapstone', 'Holds sticks & cones', 'Unique natural pattern'],
    images: [
      'https://static.wixstatic.com/media/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d',
      'https://static.wixstatic.com/media/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg',
    ],
  },
  {
    id: 6, name: 'Marble Tray Set', price: 899,
    tags: ['all', 'premium'], isBestseller: false,
    description: 'Set of 2 marble serving trays in natural white and grey veining. Ideal for bar styling, entertaining, or as a refined decorative centrepiece.',
    details: ['Sizes: 30 cm + 20 cm', 'Material: Natural marble', 'Handcut & polished', 'Food safe'],
    images: [
      'https://static.wixstatic.com/media/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg',
      'https://static.wixstatic.com/media/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ',
    ],
  },
  {
    id: 7, name: 'Ceramic Match Cloche', price: 249,
    tags: ['all', 'under500', 'new'], isBestseller: false,
    description: 'A glass cloche topped with a ceramic lid, filled with long artisanal matches. Strikes on the base. An elegant and thoughtful gift for any home.',
    details: ['Height: 14 cm', '~60 matches included', 'Strikes on base', 'Gift-box packaged'],
    images: [
      'https://static.wixstatic.com/media/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_c10c7de7620f4b5cbb97d15697f6f654~mv2.jpg',
      'https://static.wixstatic.com/media/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d',
    ],
  },
  {
    id: 8, name: 'Santal Essential Oil', price: 380,
    tags: ['all', 'under500', 'new'], isBestseller: false,
    description: 'Pure sandalwood (santal) essential oil, steam-distilled from aged heartwood. Deeply calming and grounding. 15 ml amber glass bottle with dropper.',
    details: ['Volume: 15 ml', 'Purity: 100% pure', 'Steam distilled', 'Amber glass + dropper'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCKXbAh2Ffrblnigc9B5ne5rLeB6kMCvIHjPqbolKY7k3_DI90gXTEHT2Owtc5GAzGBLRHBjqraO65oyAsAEPCnJ-FhF5gXxu19myQ-4nlnQo0AyAXPAITSkbc2yupJpZf-78oj6X9DONdaAAXrcW_pGFmR96xbjgWnajeWxDJeGT5xL5PGtfTUkJ87CO4pHt7MpwdcyisSPK-hig-8CiZ5PW1zrLoWcvjHKzDqXkJ0wh5DsFs42IwW8JWSTmVNf7qlg40Xk_cskrQJ',
      'https://static.wixstatic.com/media/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_dacab933ca7647b6b866212ae4fe0f39~mv2.jpg',
      'https://static.wixstatic.com/media/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_448702e4dfa34f239c2d2ce6725ec349~mv2.jpg',
    ],
  },
  {
    id: 9, name: 'Stone Diffuser', price: 1100,
    tags: ['all', 'premium'], isBestseller: false,
    description: 'Volcanic lava-stone diffuser with natural reed sticks. Add any essential oil and let the stone diffuse it gently throughout your space.',
    details: ['Height: 18 cm', 'Material: Lava stone', '8 reeds included', 'Refillable'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBAscIZcqGph6yS58AlvzkmiILkufMC2Qsyn_kNSTcHu67p2pJ8lKRDQoaaIsRpZGb6R45h9jOn9bfO3N-qMlBNsg-HSOu2c6GxtgBZJTE4-Zrg-blRLRDMFFwFHTKpSDXHFdZHcdMrVyd9gZvhioPy_Xz8XciGFzYN8zA9ivrcu7Pkp6-amSycXRYku1_BOR7HWPy59rLG6vdLPT1zIP9qrbKmea348EV0bPPUMkjTg6ZIHGbN_Ay4Td4DERXapdMYM6Xxb3qnrG4d',
      'https://static.wixstatic.com/media/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_7868060089754a74b7376491c2cb8592~mv2.jpg',
      'https://static.wixstatic.com/media/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg/v1/fill/w_600,h_800,q_90,enc_auto,quality_auto/e64ad3_eac1534f86034ece95a8a26a504220ed~mv2.jpg',
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Shop() {
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [selected, setSelected]         = useState<Product | null>(null);
  const [imgIdx, setImgIdx]             = useState(0);

<<<<<<< HEAD
  const [activeFilter, setActiveFilter] = useState('bestsellers');
  const [backendProducts, setBackendProducts] = useState<Array<{
    id: string; name: string; price: number; category: string; image_url: string | null;
  }> | null>(null);
  const [backendLoading, setBackendLoading] = useState(true);
  const [cart, setCart] = useState<Array<{ id: string; name: string; price: number; qty: number }>>([]);

  useEffect(() => {
    api.listShopItems()
      .then((items) => setBackendProducts(items))
      .catch(() => setBackendProducts([]))
      .finally(() => setBackendLoading(false));
  }, []);

  const addToCart = (product: { id: string; name: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };
=======
  const pageRef     = useRef<HTMLDivElement>(null);
  const galleryRef  = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef    = useRef<HTMLDivElement>(null);
  const mainImgRef  = useRef<HTMLImageElement>(null);
>>>>>>> 3b4e0d0 (ui changes)

  const products = PRODUCTS.filter(p => p.tags.includes(activeFilter));

  // ── Page entrance animation ──────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
    gsap.fromTo(pageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' });
  }, []);

  // ── Gallery card entrance (on filter change) ─────────────────────────────
  useEffect(() => {
    if (galleryRef.current) {
      const cards = galleryRef.current.querySelectorAll<HTMLElement>('.product-card');
      gsap.fromTo(cards,
        { opacity: 0, y: 16, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.04, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, [activeFilter]);

  // ── Animate image swap inside modal ──────────────────────────────────────
  useEffect(() => {
    if (mainImgRef.current && selected) {
      gsap.fromTo(mainImgRef.current,
        { opacity: 0, scale: 1.03 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [imgIdx, selected]);

<<<<<<< HEAD
  const useBackend = !backendLoading && backendProducts !== null && backendProducts.length > 0;

  const mappedBackendProducts = (backendProducts ?? []).map(p => ({
    id: String(p.id),
    name: p.name,
    price: p.price,
    tags: [p.category],
    isBestseller: false,
    image: p.image_url || '',
  }));

  const sourceProducts = useBackend ? mappedBackendProducts : allProducts.map(p => ({ ...p, id: String(p.id) }));
  const products = sourceProducts.filter(p => p.tags.includes(activeFilter));
=======
  // ── Escape key closes modal ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // ── Open modal ────────────────────────────────────────────────────────────
  const openModal = useCallback((p: Product) => {
    setImgIdx(0);
    setSelected(p);
    // Animate backdrop + modal panel in on next frame (after they render)
    requestAnimationFrame(() => {
      if (backdropRef.current && modalRef.current) {
        gsap.fromTo(backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.28, ease: 'power2.out' }
        );
        gsap.fromTo(modalRef.current,
          { opacity: 0, scale: 0.96, y: 24 },
          { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'power3.out' }
        );
      }
    });
  }, []);

  // ── Close modal ───────────────────────────────────────────────────────────
  const closeModal = useCallback(() => {
    if (!backdropRef.current || !modalRef.current) {
      setSelected(null);
      return;
    }
    gsap.to(modalRef.current, {
      opacity: 0, scale: 0.97, y: 16, duration: 0.22, ease: 'power2.in',
    });
    gsap.to(backdropRef.current, {
      opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => setSelected(null),
    });
  }, []);

  const prevImg = () => selected && setImgIdx(i => (i - 1 + selected.images.length) % selected.images.length);
  const nextImg = () => selected && setImgIdx(i => (i + 1) % selected.images.length);
>>>>>>> 3b4e0d0 (ui changes)

  return (
    <div
      ref={pageRef}
      className="h-screen flex flex-col bg-[#EADDD7] overflow-hidden relative"
    >
      {/* Shared bg texture */}
      <div
        className="fixed inset-0 z-0 opacity-30 mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0yNSOWSBJLsv1-47TiuxQ15AFQ4nsrk2tyl20R-zvNNsiDXBNDhZVYz1yHqSCTtqtGcVjl35j2rrDIrA-d5xW6tM2FPDinMxC7wGNXKzBCT0JhfwdSkLFQPVqU1yfc1GtqRHSfxSmlitg3lWmrbcCqzLdzR4XsiD9nN9-_O7fp4ViDdX7MFMvLLa9exuWvETBq8HCVRb7NcpP7tWvqDoEWCeegHipJmlKBCM4gpRO9AROi6bPaa2gmQvHKabiYnelhLueCkgQ9QIe')`,
        }}
      />
      {/* Dark overlay */}
      <div className="fixed inset-0 z-[1] bg-[#111914]/70 pointer-events-none" />

      <Navigation />

<<<<<<< HEAD
      <main className="relative z-10 flex-grow pb-32">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div ref={headerRef} className="flex flex-col items-center mb-10 mt-8">
            <div className="w-full flex justify-end mb-2">
              {cart.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-[#9cb092]/10 border border-[#9cb092]/30">
                  <span className="material-icons text-[#9cb092] text-sm">shopping_bag</span>
                  <span className="font-display text-[10px] tracking-[0.15em] uppercase text-[#9cb092]">
                    {cart.reduce((sum, i) => sum + i.qty, 0)} {cart.reduce((sum, i) => sum + i.qty, 0) === 1 ? 'item' : 'items'}
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-5xl md:text-7xl font-serif-exp italic text-center mb-2 relative z-10">
              Décor <span className="text-[#9cb092] not-italic font-bold font-agatho">&</span> Gifts
            </h1>
            <p className="text-xs md:text-sm font-display tracking-[0.25em] text-[#b2c3b1] uppercase mb-8">
              Discover gifts that create memories
            </p>
=======
      {/* ════════════════════════════════════════════════════════════════════
          GALLERY — always rendered, never replaced
          ════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden relative z-10 flex flex-col pt-16">
        <div className="flex-1 flex flex-col overflow-hidden px-6 md:px-10">
>>>>>>> 3b4e0d0 (ui changes)

          {/* Header row */}
          <div className="flex items-end justify-between py-4 md:py-5 flex-shrink-0 border-b border-white/[0.07]">
            <div>
              <h1 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] leading-tight">
                Gifts
              </h1>
              <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#b2c3b1]/40 mt-1">
                Discover gifts that create memories
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`font-display text-[9px] tracking-[0.16em] uppercase px-3 py-1.5 transition-all duration-200 ${
                    activeFilter === f.id
                      ? 'bg-[#9cb092] text-[#111914] font-semibold'
                      : 'border border-white/15 text-[#b2c3b1]/55 hover:border-[#9cb092]/30 hover:text-[#9cb092]'
                  }`}
                >{f.label}</button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div
            ref={galleryRef}
            className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-4 overflow-hidden content-start"
          >
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => openModal(p)}
                className="product-card group text-left overflow-hidden bg-white/[0.03] border border-white/[0.07] hover:border-[#9cb092]/35 transition-all duration-300 flex flex-col"
              >
                {/* Square image */}
                <div className="relative aspect-square overflow-hidden bg-[#192116]">
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {p.isBestseller && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-[#9cb092] text-[#111914] font-display text-[7px] tracking-[0.14em] uppercase font-bold px-2 py-0.5">
                        Best
                      </span>
                    </div>
                  )}
<<<<<<< HEAD

                  {/* Add to Bag on hover */}
                  <div className="absolute bottom-0 left-0 w-full p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-10">
                    <button
                      onClick={() => addToCart({ id: product.id, name: product.name, price: product.price })}
                      className="w-full py-2.5 bg-[#9cb092] text-[#111914] text-[10px] font-display tracking-[0.15em] uppercase font-bold hover:bg-[#adc4a3] transition-colors"
                    >
                      Add to Bag
                    </button>
=======
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
                    <span className="material-icons text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">
                      zoom_in
                    </span>
>>>>>>> 3b4e0d0 (ui changes)
                  </div>
                </div>

                {/* Name + price */}
                <div className="px-2.5 py-2">
                  <h3 className="font-serif-exp text-[11px] text-[#e4eee1] leading-tight truncate">
                    {p.name}
                  </h3>
                  <p className="font-display text-[10px] font-semibold text-[#9cb092] mt-0.5">
                    $ {p.price}
                  </p>
                </div>
              </button>
            ))}

            {products.length === 0 && (
              <div className="col-span-full flex items-center justify-center py-16">
                <p className="font-display text-[11px] tracking-[0.25em] uppercase text-[#b2c3b1]/30">
                  No products in this filter
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          PRODUCT MODAL — rendered on top of gallery when a product is selected
          ════════════════════════════════════════════════════════════════════ */}
      {selected && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          {/* Modal panel */}
          <div
            ref={modalRef}
            className="relative w-full max-w-5xl h-full max-h-[88vh] flex bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* X close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
            >
              <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
            </button>

            {/* ── LEFT — image viewer ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-white/[0.07]">

              {/* Main large image */}
              <div className="flex-1 relative overflow-hidden bg-[#0d1512]">
                <img
                  ref={mainImgRef}
                  src={selected.images[imgIdx]}
                  alt={selected.name}
                  className="w-full h-full object-contain"
                />

                {/* Prev arrow */}
                {selected.images.length > 1 && (
                  <button
                    onClick={prevImg}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <span className="material-icons text-white text-[18px]">chevron_left</span>
                  </button>
                )}

                {/* Next arrow */}
                {selected.images.length > 1 && (
                  <button
                    onClick={nextImg}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                  >
                    <span className="material-icons text-white text-[18px]">chevron_right</span>
                  </button>
                )}

                {/* Counter pill */}
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                  <span className="font-display text-[10px] text-white/60 tracking-widest">
                    {imgIdx + 1} / {selected.images.length}
                  </span>
                </div>
              </div>

              {/* Thumbnail strip */}
              <div className="flex items-center gap-2 px-5 py-3 flex-shrink-0 bg-[#0d1512] border-t border-white/[0.06]">
                {selected.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-[52px] h-[52px] flex-shrink-0 overflow-hidden border-2 transition-all duration-200 ${
                      i === imgIdx
                        ? 'border-[#9cb092] opacity-100'
                        : 'border-transparent opacity-50 hover:opacity-80 hover:border-white/20'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {/* Dot indicators */}
                <div className="flex gap-1 ml-3">
                  {selected.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`rounded-full transition-all duration-200 ${
                        i === imgIdx ? 'w-4 h-1.5 bg-[#9cb092]' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT — product details ─────────────────────────────── */}
            <div className="w-[42%] min-w-[280px] max-w-[480px] flex-shrink-0 flex flex-col px-8 md:px-10 py-8 overflow-y-auto">

              {/* Page label */}
              <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092]/40 mb-5">
                Gifts
              </p>

              {/* Bestseller tag */}
              {selected.isBestseller && (
                <span className="inline-flex self-start bg-[#9cb092]/10 border border-[#9cb092]/30 text-[#9cb092] font-display text-[8px] tracking-[0.22em] uppercase px-3 py-1 mb-4">
                  Bestseller
                </span>
              )}

              {/* Product name */}
              <h2 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] leading-tight mb-2">
                {selected.name}
              </h2>

              {/* Price */}
              <p className="font-serif-exp text-2xl text-[#9cb092] mb-6">
                $ {selected.price}
              </p>

              {/* Description */}
              <p className="font-display text-sm text-[#b2c3b1] leading-relaxed mb-6">
                {selected.description}
              </p>

              {/* Details list */}
              <div className="mb-8">
                <p className="font-display text-[9px] tracking-[0.25em] uppercase text-[#9cb092]/60 mb-3">
                  Details
                </p>
                <ul className="space-y-2">
                  {selected.details.map((d, i) => (
                    <li key={i} className="flex items-center gap-2.5 font-display text-xs text-[#b2c3b1]/80">
                      <span className="w-1 h-1 rounded-full bg-[#9cb092]/50 flex-shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA buttons */}
              <div className="mt-auto flex flex-col gap-2.5">
                <button className="w-full py-3.5 bg-[#9cb092] text-[#111914] font-display text-[11px] tracking-[0.22em] uppercase font-bold hover:bg-[#adc4a3] transition-colors">
                  Add to Bag
                </button>
                <button className="w-full py-3.5 border border-white/15 text-[#b2c3b1] font-display text-[11px] tracking-[0.2em] uppercase hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all">
                  Save for Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
