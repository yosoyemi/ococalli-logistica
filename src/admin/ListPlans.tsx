// src/admin/ListPlans.tsx
import React, { useState, useEffect } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import supabase from '../services/supabase';
import CreatePlan from './CreatePlan';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  free_months: number;
  subscription_fee: number;
}

const ListPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');

  const fetchPlans = async () => {
    setError('');
    const { data, error } = await supabase.from('membership_plans').select('*');
    if (error) {
      setError(error.message);
    } else if (data) {
      setPlans(data as Plan[]);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-green-700">Planes de Membresía</h2>
        <Link
          to="create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Crear Nuevo Plan
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="border rounded p-4">
            <h3 className="font-bold text-lg text-green-800">{plan.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
            <p className="mt-2">
              <strong>Precio:</strong> ${plan.price}
            </p>
            <p>
              <strong>Duración:</strong> {plan.duration_months} meses
            </p>
            <p>
              <strong>Meses gratis:</strong> {plan.free_months}
            </p>
            <p>
              <strong>Cuota de suscripción:</strong> ${plan.subscription_fee}
            </p>
          </div>
        ))}
      </div>

      {/* Rutas anidadas para crear un plan */}
      <Routes>
        <Route path="create" element={<CreatePlan refresh={fetchPlans} />} />
      </Routes>
    </div>
  );
};

export default ListPlans;
