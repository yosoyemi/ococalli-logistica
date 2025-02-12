import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../services/supabase';

const AdminDashboard: React.FC = () => {
  const [plansCount, setPlansCount] = useState<number>(0);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [cancelledCount, setCancelledCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Contar planes
        const { count: totalPlans, error: plansError } = await supabase
          .from('membership_plans')
          .select('*', { count: 'exact' });
        if (plansError) throw plansError;
        setPlansCount(totalPlans || 0);

        // Contar clientes
        const { count: totalCustomers, error: customersError } = await supabase
          .from('customers')
          .select('*', { count: 'exact' });
        if (customersError) throw customersError;
        setCustomersCount(totalCustomers || 0);

        // Contar "ACTIVE"
        const { count: totalActive, error: activeError } = await supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .eq('status', 'ACTIVE');
        if (activeError) throw activeError;
        setActiveCount(totalActive || 0);

        // Contar "CANCELLED"
        const { count: totalCancelled, error: cancelledError } = await supabase
          .from('customers')
          .select('*', { count: 'exact' })
          .eq('status', 'CANCELLED');
        if (cancelledError) throw cancelledError;
        setCancelledCount(totalCancelled || 0);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded shadow p-6">
        <p>Cargando datos del dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded shadow p-6 text-red-500">
        <p>Error al cargar datos: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow p-6">
      <h2 className="text-2xl font-bold mb-4 text-green-700">
        Bienvenido al Panel de Administración
      </h2>

      {/* Resumen de datos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Planes */}
        <div className="border rounded p-4 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Planes</h3>
          <p className="text-3xl font-bold text-green-700 mt-2">{plansCount}</p>
        </div>
        {/* Clientes */}
        <div className="border rounded p-4 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Clientes</h3>
          <p className="text-3xl font-bold text-green-700 mt-2">
            {customersCount}
          </p>
        </div>
        {/* Suscripciones Activas */}
        <div className="border rounded p-4 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Activas</h3>
          <p className="text-3xl font-bold text-green-700 mt-2">{activeCount}</p>
        </div>
        {/* Suscripciones Canceladas */}
        <div className="border rounded p-4 text-center">
          <h3 className="text-lg font-semibold text-gray-700">Canceladas</h3>
          <p className="text-3xl font-bold text-green-700 mt-2">
            {cancelledCount}
          </p>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          to="/admin/plans"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Ver Planes
        </Link>
        <Link
          to="/admin/customers"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Ver Clientes
        </Link>
        <Link
          to="/admin/locations"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Ver Ubicaciones
        </Link>
        <Link
          to="/admin/renewals"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Renovaciones
        </Link>

        {/* Ejemplo de Calendario de Recogidas */}
        <Link
          to="/admin/calendar"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
         Calendario de Entrega
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
