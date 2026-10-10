import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '@/context/AuthContext';

gsap.registerPlugin(ScrollTrigger);

const NAV_ITEMS = [
  { label: 'Home', id: 'hero', path: '/' },
  { label: 'Create Evite', id: '', path: '/create' },
  { label: 'Shop Gifts', id: '', path: '/shop' },
  { label: 'About Us', id: '', path: '/about' },
];

export default function Navigation() {
  const navRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const lenis = useLenis();
  const { user, signOut } = useAuth();
  const menuOpen = menuOpenPath === location.pathname;

  // Pages with a light hero at the top: the nav sits on a light surface, so it
  // needs dark text and the landing logo (same treatment as the home page).
  const isLightTop =
    location.pathname === '/' ||
    location.pathname === '/about' ||
    location.pathname === '/shop' ||
    location.pathname === '/dashboard';

  // Smooth-scroll to a section id (Lenis-aware, like ScrollToTop). Empty id or
  // 'hero' scrolls to the top. The offset clears the fixed nav bar.
  const scrollToId = (id: string) => {
    if (!id || id === 'hero') {
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -80 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { opacity: 0, y: -20 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: 0.5,
          ease: 'power3.out',
        }
      );
    }, navRef);

    return () => ctx.revert();
  }, []);

  const handleNavClick = (id: string, path: string) => {
    setMenuOpenPath(null);
    if (location.pathname !== path) {
      navigate(path);
      // Wait for the destination page (and its sections) to mount, then scroll.
      if (id && path === '/') {
        setTimeout(() => scrollToId(id), 250);
      }
    } else {
      scrollToId(id);
    }
  };

  return (
    <>
      {/* Main Navigation */}
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 w-full z-50 px-6 md:px-8 py-2 md:py-2 flex justify-between items-center transition-all duration-500 ${isScrolled
          ? isLightTop
            // Light pages keep the dark forest text on scroll — just add a light
            // glass background (dark text on a dark bg would be invisible).
            ? 'bg-background-light/85 backdrop-blur-md border-b border-[#3d4a35]/10 text-[#2a3328]'
            : 'bg-[#111914]/84 backdrop-blur-md border-b border-white/10 text-[#e2ebde]'
          : isLightTop
            ? 'bg-transparent text-[#2a3328]'
            : 'bg-transparent text-[#f2f6ef]'
          }`}
      >
        {/* Logo — landing page uses its own logo; all other pages share one */}
        <button onClick={() => handleNavClick('hero', '/')} className="transition-all duration-500 cursor-pointer select-none">
          <img
            src={isLightTop ? '/logo-landing.png' : '/logo-pages.png'}
            alt="Moments & Memories"
            className="h-20 md:h-24 w-auto object-contain"
          />
        </button>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 md:gap-8">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.id, item.path)}
              className="text-[10px] md:text-[11px] font-display tracking-[0.2em] uppercase hover:opacity-70 transition-opacity whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
          {user && (
            <button
              onClick={() => handleNavClick('', '/dashboard')}
              className="text-[10px] md:text-[11px] font-display tracking-[0.2em] uppercase hover:opacity-70 transition-opacity whitespace-nowrap"
            >
              Dashboard
            </button>
          )}
          {user ? (
            <button
              onClick={async () => { await signOut(); navigate('/'); }}
              className="text-[10px] md:text-[11px] font-display tracking-[0.2em] uppercase hover:opacity-70 transition-opacity whitespace-nowrap"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('', '/sign-in')}
              className="text-[10px] md:text-[11px] font-display tracking-[0.2em] uppercase hover:opacity-70 transition-opacity whitespace-nowrap"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 -mr-1"
          onClick={() => setMenuOpenPath(menuOpen ? null : location.pathname)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="material-icons text-[22px]">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="hero-bokeh-bg product-light-shell fixed inset-0 z-40 flex flex-col items-center justify-center gap-7 md:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.id, item.path)}
              className="font-display text-sm tracking-[0.28em] uppercase text-[#e4eee1] hover:text-[#9cb092] transition-colors"
            >
              {item.label}
            </button>
          ))}
          {user && (
            <button
              onClick={() => handleNavClick('', '/dashboard')}
              className="font-display text-sm tracking-[0.28em] uppercase text-[#e4eee1] hover:text-[#9cb092] transition-colors"
            >
              Dashboard
            </button>
          )}
          {user ? (
            <button
              onClick={async () => { setMenuOpenPath(null); await signOut(); navigate('/'); }}
              className="font-display text-sm tracking-[0.28em] uppercase text-[#b2c3b1]/60 hover:text-[#9cb092] transition-colors mt-4"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('', '/sign-in')}
              className="font-display text-sm tracking-[0.28em] uppercase text-[#e4eee1] hover:text-[#9cb092] transition-colors"
            >
              Login
            </button>
          )}
        </div>
      )}
    </>
  );
}
