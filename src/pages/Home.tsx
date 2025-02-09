// src/pages/Home.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';

const Home: React.FC = () => {
  const [membershipCode, setMembershipCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!membershipCode) return;

    // Verificar si existe la membresía
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .eq('membership_code', membershipCode)
      .single();

    if (error || !data) {
      setError('No se encontró esa membresía.');
      return;
    }

    // Si existe, redirigir a /my-membership/<membershipCode>
    navigate(`/my-membership/${membershipCode}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-100 to-green-200 py-10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-800 mb-4">
            ¡Bienvenido a Ococalli Logística!
          </h1>
          <p className="text-lg md:text-xl text-green-700">
            Lleva el control de tu membresía de forma sencilla y confiable.
          </p>
        </div>
      </div>

      {/* Sección de consulta */}
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-md mx-auto bg-white rounded shadow p-6">
          <h2 className="text-2xl font-semibold mb-4 text-center text-green-800">
            Consulta tu Membresía
          </h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Ingresa tu código de membresía para verificar tu estatus.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Código de Membresía"
              className="w-full border-2 border-green-300 p-2 rounded focus:border-green-500 focus:ring-green-500 focus:outline-none"
              value={membershipCode}
              onChange={(e) => setMembershipCode(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition-colors"
            >
              Consultar
            </button>
          </form>

          {error && (
            <p className="text-red-600 mt-4 text-center">{error}</p>
          )}
        </div>

        <div className="max-w-md mx-auto mt-8 flex justify-between">
          <a href="/register" className="text-green-700 font-medium hover:underline">
            ¿No tienes cuenta? Regístrate aquí
          </a>
          <a href="/member-login" className="text-green-700 font-medium hover:underline">
            Acceder a tu cuenta
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;
