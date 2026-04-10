import { type JSX } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/home/Home';
import LoginTest from './pages/login/LoginTest';
import AdminGuard from './guards/AdminGuard';
import PrivacyPolicy from './pages/privacypolicy/PrivacyPolicy';
import TermsOfService from './pages/termsofservice/TermsOfService';
import NotFound from './pages/NotFound';
import SiteLockGate from './components/SiteLock/SiteLockGate';

function AppRoutes(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminGuard />} />
        <Route path="/login-test" element={<LoginTest />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/tos" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App(): JSX.Element {
  const siteLockPassword = import.meta.env.VITE_SITE_LOCK_PASSWORD?.trim();

  if (!siteLockPassword) {
    return <AppRoutes />;
  }

  return (
    <SiteLockGate password={siteLockPassword}>
      <AppRoutes />
    </SiteLockGate>
  );
}
