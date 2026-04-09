import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLenis } from 'lenis/react';

/**
 * Scrolls to the top of the page on every route change.
 * Works with both native scroll and Lenis smooth scroll.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    // Reset Lenis smooth scroll to top
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
    // Fallback: also reset native scroll
    window.scrollTo(0, 0);
  }, [pathname, lenis]);

  return null;
}
