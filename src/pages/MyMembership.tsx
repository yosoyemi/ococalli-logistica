// src/pages/MyMembership.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // para leer :code de la URL
import supabase from '../services/supabase';

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  schedule?: string;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  membership_code: string;
  start_date: string | null;
  end_date: string | null;
  pickup_location_id: string | null;
  membership_plans: {
    name: string;
  };
}

const MyMembership: React.FC = () => {
  const { code } = useParams(); // Lee el parámetro :code
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!code) {
        setError('No se proporcionó el código de membresía.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // 1. Buscar el customer por membership_code en lugar de ID
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select(`
            id,
            name,
            email,
            membership_code,
            start_date,
            end_date,
            pickup_location_id,
            membership_plans!inner(name)
          `)
          .eq('membership_code', code)
          .single();

        if (customerError) throw customerError;
        if (!customer) {
          setError('No se encontró la membresía con ese código.');
          setLoading(false);
          return;
        }

        setCustomerData(customer as CustomerData);
        setSelectedLocation(customer?.pickup_location_id || '');

        // 2. Obtener ubicaciones
        const { data: locations, error: locationsError } = await supabase
          .from('pickup_locations')
          .select('*');

        if (locationsError) throw locationsError;
        setPickupLocations(locations as PickupLocation[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [code]);

  const calculateDaysLeft = (startDate: string | null, endDate: string | null): number | null => {
    if (!startDate || !endDate) return null;
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysLeft = calculateDaysLeft(customerData?.start_date || null, customerData?.end_date || null);

  const handleSaveLocation = async () => {
    setError('');
    setSuccessMessage('');

    if (!customerData) return;

    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ pickup_location_id: selectedLocation })
        .eq('id', customerData.id);

      if (updateError) throw updateError;
      setSuccessMessage('¡Ubicación de recogida actualizada!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (!customerData) {
    return <div className="p-4 text-red-600">No se encontró la membresía.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-4">Mi Membresía</h2>

      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-white shadow-md rounded p-6">
        <p>
          <strong>Cliente:</strong> {customerData.name}
        </p>
        <p>
          <strong>Email:</strong> {customerData.email}
        </p>
        <p>
          <strong>Código de Membresía:</strong> {customerData.membership_code}
        </p>
        <p>
          <strong>Plan:</strong> {customerData.membership_plans?.name}
        </p>

        <div className="mt-4">
          <p>
            <strong>Fecha de Inicio:</strong>{' '}
            {customerData.start_date
              ? new Date(customerData.start_date).toLocaleDateString()
              : 'N/A'}
          </p>
          <p>
            <strong>Fecha de Fin:</strong>{' '}
            {customerData.end_date
              ? new Date(customerData.end_date).toLocaleDateString()
              : 'N/A'}
          </p>
          {daysLeft != null ? (
            daysLeft >= 0 ? (
              <p><strong>Días Restantes:</strong> {daysLeft}</p>
            ) : (
              <p className="text-red-500 font-semibold">Membresía expirada</p>
            )
          ) : (
            <p className="text-gray-500">Fechas no definidas</p>
          )}
        </div>

        <div className="mt-4">
          <label className="block mb-1 font-medium text-gray-700">
            Lugar de Recogida
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="border p-2 rounded w-full md:w-1/2"
          >
            <option value="">Selecciona una ubicación</option>
            {pickupLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} - {loc.address}
              </option>
            ))}
          </select>
          <button
            onClick={handleSaveLocation}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Guardar Preferencia
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyMembership;
