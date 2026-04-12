import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis } from 'lenis/react';
import type { LenisRef } from 'lenis/react';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import ScrollToTop from './components/ScrollToTop';
import Shop from './pages/Shop';
import CreateEvite from './pages/CreateEvite';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
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
    <AuthProvider>
      <ReactLenis root ref={lenisRef} options={{ lerp: 0.07, wheelMultiplier: 0.9 }}>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/create" element={<CreateEvite />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </Router>
      </ReactLenis>
    </AuthProvider>
  );
}

export default App;
