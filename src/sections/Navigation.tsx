import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Navigation({
  activeFilter,
  setActiveFilter
}: {
  activeFilter?: string;
  setActiveFilter?: (filter: string) => void;
} = {}) {
  const navRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      setIsMenuOpen(false);

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
      setIsMenuOpen(false);
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
        {/* Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="pointer-events-auto cursor-pointer group flex flex-col items-start font-display"
        >
          <span className="block text-xs tracking-[0.3em] font-bold mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {isMenuOpen ? 'CLOSE' : 'MENU'}
          </span>
          <div
            className={`h-[1px] w-8 group-hover:w-16 transition-all duration-300 ${isScrolled ? 'bg-[#e2ebde]' : 'bg-[#f2f6ef]'
              }`}
          />
        </button>

        {/* Center OCCASIO logo — appears when scrolled */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
          <span className="font-serif-exp italic text-xl tracking-wide">moments & memories</span>
        </div>

        {/* Right Side - Shop Filters (Only on Shop Page) */}
        {location.pathname === '/shop' && (
          <div className="flex gap-4 md:gap-8 items-center justify-end">
            <div className="hidden lg:flex gap-6">
              {['All', 'Décor', 'Gifts', 'Ambience'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter && setActiveFilter(filter)}
                  className={`text-[10px] md:text-[11px] font-display tracking-[0.2em] uppercase transition-colors whitespace-nowrap ${activeFilter === filter
                    ? 'text-white font-bold'
                    : 'text-white/60 hover:text-white'
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <button className="text-[10px] md:text-[11px] font-display tracking-[0.2em] uppercase flex items-center gap-1 hover:opacity-70 transition-opacity whitespace-nowrap">
              Sort By
              <span className="material-icons text-[14px]">expand_more</span>
            </button>
          </div>
        )}
      </nav>

      {/* Shopping Bag — Fixed Bottom Right (code.html position) */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="bg-primary/20 hover:bg-primary text-white p-4 rounded-full backdrop-blur-md transition-all duration-500 border border-white/10 group">
          <span className="material-icons text-xl group-hover:rotate-12 transition-transform">shopping_bag</span>
        </button>
      </div>

      {/* Full Screen Menu */}
      <div
        className={`fixed inset-0 z-40 bg-[#111914]/95 backdrop-blur-xl transition-all duration-700 ${isMenuOpen
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
          }`}
      >
        <div className="container mx-auto px-6 h-full flex flex-col justify-center">
          <nav className="space-y-4 md:space-y-6">
            {[
              { label: 'Home', id: 'hero', path: '/' },
              { label: 'Invitations', id: 'invitations', path: '/' },
              { label: 'Décor & Gifts', id: '', path: '/shop' },
              { label: 'The Journey', id: 'timeline', path: '/' },
              { label: 'Contact', id: 'footer', path: '/' },
            ].map((item, index) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.id, item.path)}
                className={`block text-[10px] md:text-xs font-display tracking-[0.2em] uppercase text-[#e8f0e6] hover:text-[#9cb092] text-left transition-all duration-300 transform ${isMenuOpen
                  ? 'translate-x-0 opacity-100'
                  : '-translate-x-10 opacity-0'
                  }`}
                style={{
                  transitionDelay: isMenuOpen ? `${index * 100}ms` : '0ms',
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Menu Footer */}
          <div
            className={`absolute bottom-12 left-6 right-6 flex justify-between items-end transition-all duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'
              }`}
            style={{ transitionDelay: isMenuOpen ? '500ms' : '0ms' }}
          >
            <div className="text-sm text-white/50 font-display">
              <p>Every Occasion Begins</p>
              <p>With a Moment</p>
            </div>
            <div className="text-right text-sm text-white/50 font-display">
              <p>The Art of</p>
              <p>Celebration</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
