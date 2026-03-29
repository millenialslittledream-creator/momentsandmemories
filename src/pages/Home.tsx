import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navigation from '../sections/Navigation';
import Hero from '../sections/Hero';
import Invitations from '../sections/Invitations';
import DecorGifts from '../sections/DecorGifts';
import Timeline from '../sections/Timeline';
import QuoteSection from '../sections/QuoteSection';
import Footer from '../sections/Footer';

gsap.registerPlugin(ScrollTrigger);
gsap.config({ force3D: true });

export default function Home() {
  useEffect(() => {
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-background-dark">
      <Navigation />

      <main className="relative w-full">
        {/* Hero */}
        <Hero />

        {/* Timeline — clipPath reveal */}
        <div id="timeline">
          <Timeline />
        </div>

        {/* Invitations — clipPath reveal */}
        <div id="invitations">
          <Invitations />
        </div>

        {/* DecorGifts — clipPath reveal */}
        <div id="decor">
          <DecorGifts />
        </div>

        {/* Quote — clipPath reveal */}
        <QuoteSection />

        {/* Footer — clipPath reveal */}
        <div id="footer">
          <Footer />
        </div>
      </main>
    </div>
  );
}
