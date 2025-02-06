// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import MemberLogin from './pages/MemberLogin';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import MyMembership from './pages/MyMembership';
import './index.css';

const App: React.FC = () => {
  const adminEmails = ['ococalli@edgehub.com'];

  return (
    <Router>
      <Navbar />
      <div className="pt-4 min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/member-login" element={<MemberLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-membership" element={<MyMembership />} />
          <Route path="/my-membership/:code" element={<MyMembership />} />

          {/* Panel Admin Protegido */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedEmails={adminEmails}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
