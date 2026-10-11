import { useNavigate } from 'react-router-dom';
import Navigation from '@/sections/Navigation';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="page-bokeh-bg product-light-shell min-h-screen text-[#2a3328]">
      <Navigation />
      <main className="min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-lg text-center">
          <p className="font-display text-[10px] tracking-[0.35em] uppercase text-[#5f7256] mb-4">
            404 · Lost Moment
          </p>
          <h1 className="font-serif-exp italic text-4xl md:text-6xl text-[#2a3328] mb-5">
            Page not found
          </h1>
          <p className="font-display text-sm leading-relaxed text-[#5a6c50]/80 mb-8">
            This link may have expired, moved, or never existed. Let&apos;s take you back to a familiar place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-7 py-3 bg-[#5f7256] text-white font-display text-[10px] tracking-[0.2em] uppercase hover:bg-[#4d5a44] transition-colors"
            >
              Go Home
            </button>
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="px-7 py-3 border border-[#5f7256]/35 text-[#5f7256] font-display text-[10px] tracking-[0.2em] uppercase hover:bg-white/40 transition-colors"
            >
              Create an Evite
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
