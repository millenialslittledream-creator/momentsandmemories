import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ReactLenis } from 'lenis/react';
import type { LenisRef } from 'lenis/react';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const Shop = lazy(() => import('./pages/Shop'));
const CreateEvite = lazy(() => import('./pages/CreateEvite'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

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
          <Suspense fallback={<div className="flex items-center justify-center h-screen bg-background-light" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/create" element={<CreateEvite />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
            </Routes>
          </Suspense>
          <Toaster position="top-center" richColors />
        </Router>
      </ReactLenis>
    </AuthProvider>
  );
}

export default App;
