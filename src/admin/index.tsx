import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import SecretGate from './components/SecretGate';

const TemplatesList = lazy(() => import('./pages/TemplatesList'));
const TemplateAnnotator = lazy(() => import('./pages/TemplateAnnotator'));
const Settings = lazy(() => import('./pages/Settings'));

/**
 * Mounted at `/_studio/*`. The whole tree is gated by SecretGate, so an
 * unauthenticated visitor sees only a generic password prompt. The page sets
 * `noindex` so search engines don't crawl any sub-route either.
 */
export default function AdminRoutes() {
  return (
    <SecretGate>
      <Suspense fallback={<div className="min-h-screen bg-[#0a0f0a]" />}>
        <Routes>
          <Route index element={<TemplatesList />} />
          <Route path="templates/:templateId" element={<TemplateAnnotator />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/_studio" replace />} />
        </Routes>
      </Suspense>
    </SecretGate>
  );
}
