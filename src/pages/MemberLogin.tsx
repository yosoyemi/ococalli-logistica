// src/pages/MemberLogin.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../services/supabase';

const MemberLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      // Buscar en la tabla customers por email + password
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        setErrorMessage('Credenciales inválidas');
        return;
      }

      // Guardar el ID del customer en localStorage (o sessionStorage)
      localStorage.setItem('customer_id', data.id);

      // Redirigir a la pantalla de la membresía (sin :code)
      navigate('/my-membership');
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow w-full">
        <h2 className="text-2xl font-bold mb-4">Login de Cliente</h2>
        {errorMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleMemberLogin}>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              className="border rounded w-full p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Contraseña</label>
            <input
              type="password"
              className="border rounded w-full p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default MemberLogin;
