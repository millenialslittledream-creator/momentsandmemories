import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis } from 'lenis/react';
import type { LenisRef } from 'lenis/react';
import Home from './pages/Home';
import Shop from './pages/Shop';
import CreateEvite from './pages/CreateEvite';
import './App.css';

// Register GSAP plugins globally
gsap.registerPlugin(ScrollTrigger);
gsap.config({ force3D: true });

function App() {
  const lenisRef = useRef<LenisRef | null>(null);

  useEffect(() => {
    ScrollTrigger.defaults({
      toggleActions: 'play none none reverse',
      fastScrollEnd: true,
    });

    // Sync Lenis smooth scroll with GSAP ScrollTrigger
    const lenis = lenisRef.current?.lenis;
    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
    }

    ScrollTrigger.refresh();

    return () => {
      if (lenis) lenis.off('scroll', ScrollTrigger.update);
      // We don't want to kill all triggers globally on App unmount if it's SPA, 
      // but it's fine here as App doesn't unmount in typical React flow.
    };
  }, []);

  return (
    <ReactLenis root ref={lenisRef} options={{ lerp: 0.07, wheelMultiplier: 0.9 }}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/create" element={<CreateEvite />} />
        </Routes>
      </Router>
    </ReactLenis>
  );
}

export default App;
