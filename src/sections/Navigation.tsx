import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface NavigationProps {
  activeFilter?: string;
  setActiveFilter?: (filter: string) => void;
}

export default function Navigation(_props: NavigationProps = {}) {
  const navRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        className={`fixed top-0 left-0 w-full z-50 px-8 py-6 flex justify-between items-center transition-all duration-500 ${isScrolled
          ? 'bg-[#111914]/84 backdrop-blur-md border-b border-white/10 text-[#e2ebde]'
          : 'bg-transparent text-[#f2f6ef]'
          }`}
      >
        {/* Left Side - Logo (hidden at top, appears on scroll) */}
        <div
          className={`transition-all duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <span className="font-serif-exp italic text-xl tracking-wide">moments & memories</span>
        </div>

        {/* Right Side - Nav Links */}
        <div className="flex items-center gap-6 md:gap-8">
          {[
            { label: 'Home', id: 'hero', path: '/' },
            { label: 'Create Evite', id: 'invitations', path: '/' },
            { label: 'Shop Gifts', id: '', path: '/shop' },
            { label: 'Login', id: '', path: '/' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.id, item.path)}
              className="text-[10px] md:text-[11px] font-display tracking-[0.2em] uppercase hover:opacity-70 transition-opacity whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Shopping Bag — Fixed Bottom Right */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="bg-primary/20 hover:bg-primary text-white p-4 rounded-full backdrop-blur-md transition-all duration-500 border border-white/10 group">
          <span className="material-icons text-xl group-hover:rotate-12 transition-transform">shopping_bag</span>
        </button>
      </div>
    </>
  );
}
