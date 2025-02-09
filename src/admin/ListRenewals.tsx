// src/admin/ListRenewals.tsx

import React, { useEffect, useState } from 'react';
import supabase from '../services/supabase';

interface Renewal {
  id: string;
  customer_id: string;
  membership_plan_id: string;
  renewal_date: string;
  concept?: string;
  amount?: number;
  method_of_payment?: string;
  received_by?: string;
  created_at: string;
  customers: {
    name: string;
    email: string;
    status: string;
    start_date?: string;
    end_date?: string;
  };
  membership_plans: {
    name: string;
    duration_months?: number;
    free_months?: number;
  };
}

interface NewRenewalData {
  customer_id: string;
  membership_plan_id: string;
  concept: string;
  amount: string;
  method_of_payment: string;
  received_by: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  status: string;
  start_date?: string;
  end_date?: string;
}

interface Plan {
  id: string;
  name: string;
  duration_months?: number;
  free_months?: number;
}

const ListRenewals: React.FC = () => {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [newRenewal, setNewRenewal] = useState<NewRenewalData>({
    customer_id: '',
    membership_plan_id: '',
    concept: 'Renovación mensual',
    amount: '',
    method_of_payment: '',
    received_by: '',
  });

  // Helper para sumar meses a una fecha
  const addMonths = (date: Date, monthsToAdd: number) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + monthsToAdd);
    return newDate;
  };

  const fetchData = async () => {
    try {
      setError('');
      // Renovaciones
      const { data: renewalData, error: renewalError } = await supabase
        .from('membership_renewals')
        .select(`
          id,
          customer_id,
          membership_plan_id,
          renewal_date,
          concept,
          amount,
          method_of_payment,
          received_by,
          created_at,
          customers ( name, email, status, start_date, end_date ),
          membership_plans ( name, duration_months, free_months )
        `)
        .order('created_at', { ascending: false });
      if (renewalError) throw renewalError;
      setRenewals(renewalData as Renewal[]);

      // Clientes
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name, email, status, start_date, end_date')
        .order('name');
      if (customerError) throw customerError;
      setCustomers(customerData as Customer[]);

      // Planes
      const { data: planData, error: planError } = await supabase
        .from('membership_plans')
        .select('id, name, duration_months, free_months')
        .order('name');
      if (planError) throw planError;
      setPlans(planData as Plan[]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setNewRenewal({
      ...newRenewal,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * Lógica principal:
   * 1. Insertar la renovación en membership_renewals.
   * 2. Determinar fechas de start_date y end_date para el cliente.
   * 3. Actualizar la tabla customers con las nuevas fechas y estatus.
   */
  const handleCreateRenewal = async () => {
    try {
      setError('');
      if (!newRenewal.customer_id || !newRenewal.membership_plan_id) {
        setError('Selecciona un cliente y un plan.');
        return;
      }

      // 1) Insertar la renovación con los datos básicos
      const amountParsed = parseFloat(newRenewal.amount) || 0;
      const { error: insertError } = await supabase
        .from('membership_renewals')
        .insert([
          {
            customer_id: newRenewal.customer_id,
            membership_plan_id: newRenewal.membership_plan_id,
            concept: newRenewal.concept,
            amount: amountParsed,
            method_of_payment: newRenewal.method_of_payment,
            received_by: newRenewal.received_by,
            renewal_date: new Date().toISOString(), 
          },
        ]);

      if (insertError) throw insertError;

      // 2) Calcular nuevas fechas para el cliente
      //    - Obtenemos el plan (duration_months, free_months).
      //    - Obtenemos el cliente actual (start_date, end_date, status).
      const { data: planData, error: planError } = await supabase
        .from('membership_plans')
        .select('duration_months, free_months')
        .eq('id', newRenewal.membership_plan_id)
        .single();
      if (planError) throw planError;
      const { duration_months = 0, free_months = 0 } = planData || {};

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, status, start_date, end_date')
        .eq('id', newRenewal.customer_id)
        .single();
      if (customerError) throw customerError;

      // A) Sumar ambos tipos de meses
      const totalMonths = duration_months + free_months;

      // B) Determinar la fecha de inicio y fin
      let newStartDate = new Date(); 
      let newEndDate = new Date();

      // Si el cliente ya tiene una membresía activa y su end_date es futuro,
      // lo extendemos a partir de esa fecha. De lo contrario, se inicia desde hoy.
      if (
        customerData.end_date &&
        new Date(customerData.end_date) > new Date() &&
        customerData.status === 'ACTIVE'
      ) {
        // Comenzamos donde termina la membresía actual
        newStartDate = new Date(customerData.end_date);
      }

      // Asignamos la nueva fecha de fin
      newEndDate = addMonths(newStartDate, totalMonths);

      // 3) Actualizamos el cliente con las nuevas fechas y estatus = ACTIVE
      const { error: updateCustomerError } = await supabase
        .from('customers')
        .update({
          // Solo cambiamos start_date si estaba inactivo o si su end_date ya expiró:
          start_date:
            customerData.status !== 'ACTIVE' || !customerData.end_date
              ? new Date().toISOString()
              : customerData.start_date,
          end_date: newEndDate.toISOString(),
          status: 'ACTIVE',
        })
        .eq('id', newRenewal.customer_id);
      if (updateCustomerError) throw updateCustomerError;

      // Reseteamos el formulario
      setNewRenewal({
        customer_id: '',
        membership_plan_id: '',
        concept: 'Renovación mensual',
        amount: '',
        method_of_payment: '',
        received_by: '',
      });

      // Recargamos datos
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancelMembership = async (customerId: string) => {
    try {
      setError('');
      const { error: updateError } = await supabase
        .from('customers')
        .update({ status: 'CANCELLED' })
        .eq('id', customerId);

      if (updateError) throw updateError;
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-bold text-green-700 mb-4">Renovaciones de Membresías</h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4">
          {error}
        </div>
      )}

      {/* Formulario para crear nueva renovación */}
      <div className="border p-4 rounded mb-6 bg-white">
        <h3 className="text-lg font-semibold mb-2">Registrar Nueva Renovación</h3>
        <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2 mb-2">
          <select
            name="customer_id"
            onChange={handleChange}
            value={newRenewal.customer_id}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">Selecciona cliente</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email}) - {c.status}
              </option>
            ))}
          </select>
          
          <select
            name="membership_plan_id"
            onChange={handleChange}
            value={newRenewal.membership_plan_id}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">Selecciona plan</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <input
            type="text"
            placeholder="Concepto"
            name="concept"
            value={newRenewal.concept}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Monto"
            name="amount"
            value={newRenewal.amount}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
          />
        </div>

        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mt-2">
          <input
            type="text"
            placeholder="Método de pago"
            name="method_of_payment"
            value={newRenewal.method_of_payment}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
          />
          <input
            type="text"
            placeholder="Recibido por"
            name="received_by"
            value={newRenewal.received_by}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
          />
        </div>

        <button
          onClick={handleCreateRenewal}
          className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Crear Renovación
        </button>
      </div>

      {/* Listado de renovaciones */}
      <div className="bg-white border p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Historial de Renovaciones</h3>
        {renewals.map((r) => (
          <div key={r.id} className="border-b py-2">
            <p>
              <strong>Cliente:</strong> {r.customers?.name} ({r.customers?.status})
            </p>
            <p><strong>Plan:</strong> {r.membership_plans?.name}</p>
            <p>
              <strong>Fecha/Hora Renovación:</strong>{' '}
              {new Date(r.renewal_date).toLocaleString()}
            </p>
            <p><strong>Concepto:</strong> {r.concept}</p>
            <p><strong>Monto:</strong> ${r.amount?.toFixed(2)}</p>
            <p><strong>Método:</strong> {r.method_of_payment}</p>
            <p><strong>Recibido por:</strong> {r.received_by}</p>
            <p className="text-sm text-gray-500">
              Creado: {new Date(r.created_at).toLocaleString()}
            </p>
            
            {/* Botón para cancelar la membresía si está ACTIVE */}
            {r.customers.status === 'ACTIVE' && (
              <button
                onClick={() => handleCancelMembership(r.customer_id)}
                className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
              >
                Cancelar Membresía
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListRenewals;
