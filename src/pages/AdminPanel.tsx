// src/pages/AdminPanel.tsx
import React from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import ListPlans from '../admin/ListPlans';
import ListCustomers from '../admin/ListCustomers';
import ListLocations from '../admin/ListLocations';
import ListRenewals from '../admin/ListRenewals';
import PickupCalendar from './PickupCalendar';
import DeliveryForm from '../admin/Ubication';
import Eliminar from '../admin/eliminar';

const AdminPanel: React.FC = () => {
  const location = useLocation();

  const linkClass = (path: string) => {
    const baseStyle = 'block px-4 py-2 hover:bg-green-100 rounded transition';
    return location.pathname.includes(path)
      ? `${baseStyle} bg-green-200 text-green-800 font-semibold`
      : `${baseStyle} text-gray-700`;
  };

  return (
    <div className="flex">
      {/* Barra lateral */}
      <aside className="w-64 bg-white shadow-md h-screen p-4 hidden md:block">
        <h1 className="text-2xl font-bold text-green-700 mb-4">Admin Panel</h1>
        <nav className="space-y-2">
          <Link to="/admin" className={linkClass('/admin')}>Panel Admin</Link>
          <Link to="/admin/plans" className={linkClass('plans')}>Planes</Link>
          <Link to="/admin/customers" className={linkClass('customers')}>Clientes</Link>
          <Link to="/admin/locations" className={linkClass('locations')}>Ubicaciones</Link>
          <Link to="/admin/renewals" className={linkClass('renewals')}>Renovaciones</Link>
          <Link to="/admin/calendar" className={linkClass('calendar')}>Calendario</Link>
          <Link to="/admin/ubication" className={linkClass('ubication')}>Zonas de Entrega</Link>
          <Link to="/admin/eliminar" className={linkClass('eliminar')}>Eliminar Usuarios</Link>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 p-4 md:ml-64">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="plans/*" element={<ListPlans />} />
          <Route path="customers" element={<ListCustomers />} />
          <Route path="locations" element={<ListLocations />} />
          <Route path="renewals" element={<ListRenewals />} />
          <Route path="calendar" element={<PickupCalendar />} />
          <Route path="ubication" element={<DeliveryForm />} />
          <Route path="eliminar" element={<Eliminar />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminPanel;