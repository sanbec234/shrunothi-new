import { type JSX } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home2 from './pages/home2/Home2';
import LoginTest from './pages/login/LoginTest';
import AdminGuard from './guards/AdminGuard';
import PrivacyPolicy from './pages/privacypolicy/PrivacyPolicy';
import TermsOfService from './pages/termsofservice/TermsOfService';
import NotFound from './pages/NotFound';
import SiteLockGate from './components/SiteLock/SiteLockGate';
import AboutUs from './pages/aboutus/AboutUs';
import Plans from './pages/plans/Plans';

function AppRoutes(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home2 />} />
        <Route path="/admin" element={<AdminGuard />} />
        {/* <Route path="/home2" element={<Home2 />} /> */}
        <Route path="/login-test" element={<LoginTest />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/tos" element={<TermsOfService />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/plans" element={<Plans />} />
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
