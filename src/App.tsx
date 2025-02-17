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
import ListCustomers from './admin/ListCustomers';
import DeliveryForm from './admin/Ubication';
import './index.css';

const App: React.FC = () => {
  // Aquí define quiénes pueden acceder al panel admin:
  const adminEmails = ['ococalli@edgehub.com']; // Ajusta los correos que tengan privilegios de administrador

  return (
    <Router>
      {/* Barra de navegación */}
      <Navbar />

      <div className="pt-4 min-h-screen bg-gray-50">
        <Routes>
          {/* Ruta de inicio (pública) */}
          <Route path="/" element={<Home />} />

          {/* Rutas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/member-login" element={<MemberLogin />} />
          <Route path="/register" element={<Register />} />

          {/* Página de membresía (usuario logueado como cliente) */}
          <Route path="/my-membership" element={<MyMembership />} />
          <Route path="/ListCustomers" element={<ListCustomers />} />
          
          {/* Nueva página de ubicación preferida */}
          <Route path="/Ubication" element={<DeliveryForm />} />
          
          {/* Si necesitas seguir usando /my-membership/:code, mantén esta ruta */}
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