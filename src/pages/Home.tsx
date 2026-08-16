import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navigation from '../sections/Navigation';
import Hero from '../sections/Hero';
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

        {/* Footer */}
        <div id="footer">
          <Footer />
        </div>
      </main>
    </div>
  );
}
