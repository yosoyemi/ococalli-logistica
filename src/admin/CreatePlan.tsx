import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';

interface CreatePlanProps {
  refresh: () => void;
}

const CreatePlan: React.FC<CreatePlanProps> = ({ refresh }) => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState({
    name: '',
    description: '',
    price: 0,
    duration_months: 0, 
    free_months: 0,
    subscription_fee: 0,
  });
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError('');

      const { error } = await supabase.from('membership_plans').insert([plan]);

      if (error) throw error;

      refresh();
      navigate('..', { relative: 'path' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-bold text-green-700 mb-4">Crear Nuevo Plan</h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre del Plan</label>
          <input
            type="text"
            className="border rounded w-full px-2 py-1"
            value={plan.name}
            onChange={(e) => setPlan({ ...plan, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            className="border rounded w-full px-2 py-1"
            value={plan.description}
            onChange={(e) => setPlan({ ...plan, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Precio</label>
          <input
            type="number"
            step="0.01"
            className="border rounded w-full px-2 py-1"
            value={plan.price}
            onChange={(e) => setPlan({ ...plan, price: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Duración (meses)</label>
            <input
              type="number"
              className="border rounded w-full px-2 py-1"
              value={plan.duration_months}
              onChange={(e) => setPlan({ ...plan, duration_months: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Meses gratis</label>
            <input
              type="number"
              className="border rounded w-full px-2 py-1"
              value={plan.free_months}
              onChange={(e) => setPlan({ ...plan, free_months: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cuota de suscripción</label>
          <input
            type="number"
            step="0.01"
            className="border rounded w-full px-2 py-1"
            value={plan.subscription_fee}
            onChange={(e) => setPlan({ ...plan, subscription_fee: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="flex space-x-2">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Crear
          </button>
          <button
            type="button"
            onClick={() => navigate('..', { relative: 'path' })}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePlan;
