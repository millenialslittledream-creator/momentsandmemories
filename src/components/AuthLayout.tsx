import type { ReactNode } from 'react';
import PageTransition from '@/components/PageTransition';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <PageTransition>
      <div className="auth-layout-shell page-bokeh-bg product-light-shell relative flex min-h-[100svh] w-full items-center justify-center overflow-x-hidden px-4 py-3 font-display text-[#1a2418] sm:px-6 sm:py-4">
        <div className="pointer-events-none absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-primary/10 blur-[100px]" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-72 w-72 rounded-full bg-[#B0BBA8]/25 blur-[120px]" />

        <div className="auth-layout-grid relative z-10 grid w-full max-w-[1080px] flex-none items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,500px)] lg:gap-12">
          <aside className="auth-layout-aside hidden max-w-md px-4 lg:block">
            <p className="font-serif-exp text-xs uppercase tracking-[0.28em] text-[#5a6c50]">moments &amp; memories</p>
            <h2 className="mt-5 font-agatho text-5xl leading-[1.05] text-[#1a2418] xl:text-6xl">
              Make room for the moments that matter.
            </h2>
            <div className="mt-9 max-w-sm border-l-2 border-[#718267]/50 pl-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5a6c50]">Your privacy matters</p>
              <p className="mt-2 text-sm leading-relaxed text-[#3d4a35]/80">
                We never sell your personal data or send marketing emails without your consent.
              </p>
            </div>
          </aside>
          {children}
        </div>
      </div>
    </PageTransition>
  );
}
