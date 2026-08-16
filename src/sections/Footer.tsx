import { useNavigate, useLocation } from 'react-router-dom';
import { useLenis } from 'lenis/react';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const lenis = useLenis();

  // Scroll to the About section on the landing page (navigate home first if needed).
  const goToAbout = () => {
    const scroll = () => {
      const el = document.getElementById('about');
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { offset: -80 });
      else el.scrollIntoView({ behavior: 'smooth' });
    };
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(scroll, 250);
    } else {
      scroll();
    }
  };

  return (
    <footer className="hero-bokeh-bg relative overflow-hidden border-t border-[#3d4a35]/15">
      <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-serif-exp text-[#2a3328] text-sm">
          The celebration begins with you.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-display text-xs text-[#5a6c50]">
          <span>© 2025 MOMENTS &amp; MEMORIES.</span>
          <div className="flex gap-4">
            <button onClick={goToAbout} className="hover:text-[#9cb092] transition-colors">About Us</button>
            <a href="#" className="hover:text-[#9cb092] transition-colors">Instagram</a>
            <a href="#" className="hover:text-[#9cb092] transition-colors">Pinterest</a>
            <a href="#" className="hover:text-[#9cb092] transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
