// src/admin/CreatePlan.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';

interface CreatePlanProps {
  refresh: () => void;
}

const CreatePlan: React.FC<CreatePlanProps> = ({ refresh }) => {
  const navigate = useNavigate();
  const [planData, setPlanData] = useState({
    name: '',
    description: '',
    price: '',
    duration_months: '',
    free_months: '',
    subscription_fee: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPlanData({
      ...planData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const priceParsed = parseFloat(planData.price) || 0;
    const durationParsed = parseInt(planData.duration_months, 10) || 1;
    const freeParsed = parseInt(planData.free_months, 10) || 0;
    const feeParsed = parseFloat(planData.subscription_fee) || 0;

    const { error: insertError } = await supabase.from('membership_plans').insert([
      {
        name: planData.name,
        description: planData.description,
        price: priceParsed,
        duration_months: durationParsed,
        free_months: freeParsed,
        subscription_fee: feeParsed
      }
    ]);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    refresh();
    navigate('/admin/plans');
  };

  return (
    <div className="border rounded p-4 bg-white mt-4">
      <h3 className="text-xl font-bold mb-2 text-green-700">Crear Plan de Membresía</h3>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="block font-medium">Nombre</label>
          <input
            type="text"
            name="name"
            className="border w-full p-2"
            value={planData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label className="block font-medium">Descripción</label>
          <textarea
            name="description"
            className="border w-full p-2"
            value={planData.description}
            onChange={handleChange}
          />
        </div>
        <div className="flex space-x-2 mb-2">
          <div className="w-1/3">
            <label className="block font-medium">Precio</label>
            <input
              type="number"
              step="0.01"
              name="price"
              className="border w-full p-2"
              value={planData.price}
              onChange={handleChange}
              required
            />
          </div>
          <div className="w-1/3">
            <label className="block font-medium">Duración (meses)</label>
            <input
              type="number"
              name="duration_months"
              className="border w-full p-2"
              value={planData.duration_months}
              onChange={handleChange}
              required
            />
          </div>
          <div className="w-1/3">
            <label className="block font-medium">Meses gratis</label>
            <input
              type="number"
              name="free_months"
              className="border w-full p-2"
              value={planData.free_months}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="mb-2 w-1/2">
          <label className="block font-medium">Cuota de Suscripción</label>
          <input
            type="number"
            step="0.01"
            name="subscription_fee"
            className="border w-full p-2"
            value={planData.subscription_fee}
            onChange={handleChange}
          />
        </div>

        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Guardar
        </button>
      </form>
    </div>
  );
};

export default CreatePlan;
