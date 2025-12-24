import { type JSX } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import AdminDashboard from './pages/admindash';
import LoginTest from './pages/LoginTest';

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/login-test" element={<LoginTest />} />
      </Routes>
    </BrowserRouter>
  );
}
