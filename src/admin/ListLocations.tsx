// src/admin/ListLocations.tsx
import React, { useEffect, useState } from 'react';
import supabase from '../services/supabase';

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  schedule?: string;
  created_at?: string;
}

const ListLocations: React.FC = () => {
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [newLocation, setNewLocation] = useState<Partial<PickupLocation>>({});
  const [error, setError] = useState('');

  const fetchLocations = async () => {
    setError('');
    const { data, error } = await supabase
      .from('pickup_locations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else if (data) {
      setLocations(data as PickupLocation[]);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleCreate = async () => {
    setError('');
    if (!newLocation.name || !newLocation.address) {
      setError('Favor de llenar nombre y dirección');
      return;
    }

    const { error: insertError } = await supabase
      .from('pickup_locations')
      .insert([newLocation]);

    if (insertError) {
      setError(insertError.message);
    } else {
      setNewLocation({});
      fetchLocations();
    }
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-bold text-green-700 mb-4">Ubicaciones de Recogida</h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
        <input
          type="text"
          placeholder="Nombre (ej. Zona Norte)"
          className="border p-2 mr-2 w-full md:w-auto"
          value={newLocation.name || ''}
          onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Dirección"
          className="border p-2 mr-2 w-full md:w-auto"
          value={newLocation.address || ''}
          onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
        />
        <input
          type="text"
          placeholder="Horario (opcional)"
          className="border p-2 mr-2 w-full md:w-auto"
          value={newLocation.schedule || ''}
          onChange={(e) => setNewLocation({ ...newLocation, schedule: e.target.value })}
        />
        <button
          onClick={handleCreate}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Crear
        </button>
      </div>

      <div className="space-y-4">
        {locations.map((loc) => (
          <div key={loc.id} className="border p-4 rounded">
            <h3 className="font-bold text-lg text-green-800">{loc.name}</h3>
            <p>{loc.address}</p>
            {loc.schedule && <p>Horario: {loc.schedule}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListLocations;
