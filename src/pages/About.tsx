import { useEffect } from 'react';
import Navigation from '../sections/Navigation';
import AboutSection from '../sections/AboutSection';
import Footer from '../sections/Footer';

// Dedicated About Us page (route: /about). Composes the shared nav + footer
// around the About content block.
export default function About() {
  useEffect(() => {
    document.title = 'About Us · Moments & Memories';
  }, []);

  return (
    <div className="page-bokeh-bg product-light-shell relative flex min-h-screen flex-col">
      <Navigation />
      <main className="relative w-full">
        <AboutSection />
        <Footer />
      </main>
    </div>
  );
}
