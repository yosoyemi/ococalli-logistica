import React, { useEffect, useState } from 'react';
import supabase from '../services/supabase';

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  schedule?: string;
  zone: 'Norte' | 'Sur';
}

interface Customer {
  id: string;
  name: string;
  pickup_location_id: string;
  pickup_location: PickupLocation | null;
}

const PreferredLocation: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<'Norte' | 'Sur' | ''>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select(`id, name, pickup_location_id, pickup_locations(id, name, address, schedule, zone)`);

        if (error) {
          console.error('Error al obtener clientes:', error);
          return;
        }

        // Mapeamos para asegurar que cada cliente tenga su ubicación asociada correctamente
        const formattedData: Customer[] = data.map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          pickup_location_id: customer.pickup_location_id,
          pickup_location: customer.pickup_locations || null, // Asegurar que siempre haya una ubicación válida
        }));

        setCustomers(formattedData);
      } catch (err) {
        console.error('Error al obtener datos:', err);
      }
    };

    fetchData();
  }, []);

  // Filtrar clientes por zona
  const filteredCustomers = filter
    ? customers.filter(customer => customer.pickup_location?.zone === filter)
    : customers;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 bg-gray-100 rounded-lg shadow-lg">
      <h2 className="text-4xl font-bold text-center text-gray-800 mb-6">Clientes por Zona</h2>

      {/* Filtro por zona */}
      <div className="flex justify-center items-center mb-8">
        <label className="text-lg font-semibold mr-3 text-gray-700">Filtrar por zona:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'Norte' | 'Sur' | '')}
          className="border border-gray-300 p-3 rounded-lg shadow-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          <option value="">Todas</option>
          <option value="Norte">Norte</option>
          <option value="Sur">Sur</option>
        </select>
      </div>

      {/* Lista de clientes filtrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white shadow-lg rounded-xl p-6 transition-transform transform hover:scale-105 hover:shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{customer.name}</h3>
              {customer.pickup_location ? (
                <>
                  <p className="text-gray-600"><strong>Ubicación:</strong> {customer.pickup_location.name}</p>
                  <p className="text-gray-600"><strong>Dirección:</strong> {customer.pickup_location.address}</p>
                  <p className="text-gray-600"><strong>Horario:</strong> {customer.pickup_location.schedule || 'N/A'}</p>
                  <span
                    className={`mt-3 inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${
                      customer.pickup_location.zone === 'Norte' ? 'bg-blue-500' : 'bg-red-500'
                    }`}
                  >
                    Zona: {customer.pickup_location.zone}
                  </span>
                </>
              ) : (
                <p className="text-red-500">No tiene una ubicación asignada.</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600 text-lg col-span-full">No hay clientes en esta zona.</p>
        )}
      </div>
    </div>
  );
};

export default PreferredLocation;
