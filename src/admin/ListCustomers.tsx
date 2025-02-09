// src/admin/ListCustomers.tsx

import React, { useEffect, useState } from 'react';
import supabase from '../services/supabase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface MembershipPlan {
  name: string;
  duration_months?: number;
  free_months?: number;
}

interface PickupLocation {
  name: string;
  address: string;
  schedule?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  membership_code: string;
  status: string;
  membership_plan_id: string;
  start_date?: string;
  end_date?: string;
  pickup_location_id?: string;
  membership_plans: MembershipPlan;
  pickup_locations?: PickupLocation;
}

const ListCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});

  // Suma meses
  const addMonths = (baseDate: string, months: number) => {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  // Días restantes
  const getRemainingDays = (endDateStr: string | undefined) => {
    if (!endDateStr) return null;
    const today = new Date();
    const endDate = new Date(endDateStr);
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Fondo de la tarjeta
  const getCardBgColor = (days: number | null) => {
    if (days === null) return 'bg-gray-100';
    if (days > 30) return 'bg-green-100';
    if (days >= 15) return 'bg-yellow-100';
    if (days >= 5) return 'bg-orange-100';
    return 'bg-red-100';
  };

  // 1. JOIN con pickup_locations
  const fetchCustomers = async () => {
    setError('');
    const { data, error } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        email,
        phone,
        password,
        membership_code,
        status,
        membership_plan_id,
        start_date,
        end_date,
        pickup_location_id,
        membership_plans!inner(
          name,
          duration_months,
          free_months
        ),
        pickup_locations!left(
          name,
          address,
          schedule
        )
      `)
      .order('name');

    if (error) {
      setError(error.message);
    } else if (data) {
      setCustomers(data as Customer[]);
      setFilteredCustomers(data as Customer[]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filtrado
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  // Excel
  const exportToExcel = () => {
    const dataForExcel = filteredCustomers.map((c) => {
      let calculatedEndDate = c.end_date || '';
      if (!c.end_date && c.start_date && c.membership_plans) {
        const totalMonths =
          (c.membership_plans.duration_months || 0) +
          (c.membership_plans.free_months || 0);
        if (totalMonths > 0) {
          calculatedEndDate = addMonths(c.start_date, totalMonths);
        }
      }
      return {
        Nombre: c.name,
        Email: c.email,
        Telefono: c.phone || '',
        Password: c.password || '',
        CodigoMembresia: c.membership_code,
        Plan: c.membership_plans?.name || '',
        Estatus: c.status,
        Ubicacion: c.pickup_locations
          ? `${c.pickup_locations.name} - ${c.pickup_locations.address}`
          : '',
        Horario: c.pickup_locations?.schedule || '',
        FechaInicio: c.start_date || '',
        FechaFin: calculatedEndDate,
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'clientes.xlsx');
  };

  const togglePassword = (customerId: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [customerId]: !prev[customerId],
    }));
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-bold text-green-700 mb-4">
        Clientes Registrados
      </h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="search" className="block mb-1 font-semibold">
          Buscar por nombre:
        </label>
        <input
          id="search"
          type="text"
          className="border rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Ingresa el nombre del cliente"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Exportar a Excel
        </button>
      </div>

      <div className="space-y-4">
        {filteredCustomers.map((c) => {
          let finalEndDate = c.end_date || '';
          if (!c.end_date && c.start_date && c.membership_plans) {
            const totalMonths =
              (c.membership_plans.duration_months || 0) +
              (c.membership_plans.free_months || 0);
            if (totalMonths > 0) {
              finalEndDate = addMonths(c.start_date, totalMonths);
            }
          }

          const remainingDays = finalEndDate
            ? getRemainingDays(finalEndDate)
            : null;
          const cardBgColor = getCardBgColor(remainingDays);

          return (
            <div
              key={c.id}
              className={`${cardBgColor} border p-4 rounded shadow transition-colors`}
            >
              <p className="font-semibold text-lg mb-1">{c.name}</p>
              <p className="mb-1">
                <strong>Email:</strong> {c.email}
              </p>

              {c.password && (
                <div className="flex items-center space-x-2 mb-1">
                  <p>
                    <strong>Contraseña:</strong>{' '}
                    {showPassword[c.id]
                      ? c.password
                      : '*'.repeat(c.password.length)}
                  </p>
                  <button
                    onClick={() => togglePassword(c.id)}
                    className="text-sm px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {showPassword[c.id] ? 'Ocultar' : 'Revelar'}
                  </button>
                </div>
              )}

              {c.phone && (
                <p className="mb-1">
                  <strong>Teléfono:</strong> {c.phone}
                </p>
              )}

              <p className="mb-1">
                <strong>Ubicación:</strong>{' '}
                {c.pickup_locations
                  ? `${c.pickup_locations.name} - ${c.pickup_locations.address}`
                  : 'N/A'}
              </p>
              {c.pickup_locations?.schedule && (
                <p className="mb-1">
                  <strong>Horario:</strong> {c.pickup_locations.schedule}
                </p>
              )}

              <p className="mb-1">
                <strong>Código Membresía:</strong> {c.membership_code}
              </p>
              <p className="mb-1">
                <strong>Plan:</strong> {c.membership_plans?.name}
              </p>
              <p className="mb-1">
                <strong>Estatus:</strong> {c.status}
              </p>
              <p className="mb-1">
                <strong>Fecha de inicio:</strong> {c.start_date || 'N/A'}
              </p>
              <p className="mb-1">
                <strong>Fecha de fin:</strong> {finalEndDate || 'N/A'}
              </p>

              {remainingDays !== null && (
                <p className="mt-2 font-semibold">
                  Días restantes:{' '}
                  {remainingDays < 0 ? 'Expirado' : remainingDays}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListCustomers;
