import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '@/context/AuthContext';

gsap.registerPlugin(ScrollTrigger);

const NAV_ITEMS = [
  { label: 'Home', id: 'hero', path: '/' },
  { label: 'Create Evite', id: '', path: '/create' },
  { label: 'Shop Gifts', id: '', path: '/shop' },
];

export default function Navigation() {
  const navRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

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

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleNavClick = (id: string, path: string) => {
    setMenuOpen(false);
    if (location.pathname !== path) {
      navigate(path);

      if (id && path === '/') {
        setTimeout(() => {
          if (id === 'hero') window.scrollTo({ top: 0, behavior: 'smooth' });
          else {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      if (id) {
        if (id === 'hero') window.scrollTo({ top: 0, behavior: 'smooth' });
        else {
          const element = document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* Main Navigation */}
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 w-full z-50 px-6 md:px-8 py-5 md:py-6 flex justify-between items-center transition-all duration-500 ${isScrolled
          ? 'bg-[#111914]/84 backdrop-blur-md border-b border-white/10 text-[#e2ebde]'
          : location.pathname === '/'
            ? 'bg-transparent text-[#2a3328]'
            : 'bg-transparent text-[#f2f6ef]'
          }`}
      >
        {/* Logo */}
        <button onClick={() => handleNavClick('hero', '/')} className="transition-all duration-500 cursor-pointer select-none">
          <img
            src="/logo.png"
            alt="Moments & Memories"
            className="h-14 md:h-16 w-auto object-contain"
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
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="material-icons text-[22px]">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-[#111914]/97 backdrop-blur-xl flex flex-col items-center justify-center gap-7 md:hidden">
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
              onClick={async () => { setMenuOpen(false); await signOut(); navigate('/'); }}
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
