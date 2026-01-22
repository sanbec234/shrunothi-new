import { type JSX } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/home/Home';
import LoginTest from './pages/login/LoginTest';
import AdminGuard from './guards/AdminGuard';
import PrivacyPolicy from './pages/privacypolicy/PrivacyPolicy';

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminGuard />} />
        <Route path="/login-test" element={<LoginTest />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </BrowserRouter>
  );
}
