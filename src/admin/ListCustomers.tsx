// src/admin/ListCustomers.tsx
import React, { useEffect, useState } from 'react';
import supabase from '../services/supabase';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  membership_code: string;
  status: string;
  membership_plan_id: string;
  membership_plans: {
    name: string;
  };
}

const ListCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    setError('');
    const { data, error } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        email,
        phone,
        membership_code,
        status,
        membership_plan_id,
        membership_plans!inner(name)
      `)
      .order('name');

    if (error) {
      setError(error.message);
    } else if (data) {
      setCustomers(data as Customer[]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-bold text-green-700 mb-4">Clientes Registrados</h2>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {customers.map((c) => (
          <div key={c.id} className="border p-4 rounded">
            <p><strong>Nombre:</strong> {c.name}</p>
            <p><strong>Email:</strong> {c.email}</p>
            {c.phone && <p><strong>Teléfono:</strong> {c.phone}</p>}
            <p><strong>Código Membresía:</strong> {c.membership_code}</p>
            <p><strong>Plan:</strong> {c.membership_plans?.name}</p>
            <p><strong>Estatus:</strong> {c.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListCustomers;
