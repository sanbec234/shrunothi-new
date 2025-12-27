import { type JSX } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import LoginTest from './pages/LoginTest';
import AdminGuard from './guards/AdminGuard';

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminGuard />} />
        <Route path="/login-test" element={<LoginTest />} />
      </Routes>
    </BrowserRouter>
  );
}
