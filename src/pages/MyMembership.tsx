import React, { useEffect, useState } from 'react';
import supabase from '../services/supabase';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importa los íconos

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
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [showChangeForm, setShowChangeForm] = useState<boolean>(false); // Nuevo estado para el formulario
  const [newEmail, setNewEmail] = useState<string>(customerData?.email || '');
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false); // Para mostrar/ocultar la contraseña

  // Calcula días restantes
  const calculateDaysLeft = (
    startDate: string | null,
    endDate: string | null
  ): number | null => {
    if (!startDate || !endDate) return null;
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      try {
        const storedId = localStorage.getItem('customer_id');
        if (!storedId) {
          setError('No hay sesión activa. Inicia sesión de nuevo, por favor.');
          setLoading(false);
          return;
        }

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
          .eq('id', storedId)
          .single();

        if (customerError) throw customerError;
        if (!customer) {
          setError('No se encontró el cliente. Revisa tus credenciales.');
          setLoading(false);
          return;
        }

        setCustomerData(customer as CustomerData);
        setSelectedLocation(customer.pickup_location_id || '');

        const { data: locations, error: locError } = await supabase
          .from('pickup_locations')
          .select('*');
        if (locError) throw locError;

        setPickupLocations(locations as PickupLocation[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }
  if (!customerData) {
    return <div className="p-4 text-red-600">No se encontró tu cuenta.</div>;
  }

  const daysLeft = calculateDaysLeft(
    customerData.start_date,
    customerData.end_date
  );

  const handleSaveLocation = async () => {
    setError('');
    setSuccessMessage('');

    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ pickup_location_id: selectedLocation || null })
        .eq('id', customerData.id);

      if (updateError) throw updateError;

      setSuccessMessage('¡Ubicación de entrega actualizada!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Función para cambiar el correo y la contraseña
  const handleChangeEmailPassword = async () => {
    setError('');
    setSuccessMessage('');

    try {
      const updateData: { email?: string; password?: string } = {};

      // Solo actualizar el correo si se proporcionó
      if (newEmail) {
        updateData.email = newEmail;
      }

      // Solo actualizar la contraseña si se proporcionó
      if (newPassword) {
        updateData.password = newPassword;
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update(updateData) // Usamos updateData, que solo contiene los campos que cambiaron
        .eq('id', customerData.id);

      if (updateError) throw updateError;

      setSuccessMessage('Datos actualizados exitosamente!');
      setShowChangeForm(false); // Cerrar el formulario
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-4">Mi Membresía</h2>

      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-2 mb-4">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded p-6">
        <p className="mb-1">
          <strong>Cliente:</strong> {customerData.name}
        </p>
        <p className="mb-1">
          <strong>Email:</strong> {customerData.email}
        </p>
        <p className="mb-1">
          <strong>Código de Membresía:</strong> {customerData.membership_code}
        </p>
        <p className="mb-1">
          <strong>Plan:</strong> {customerData.membership_plans?.name}
        </p>

        <div className="mt-4">
          <p className="mb-1">
            <strong>Fecha de Inicio:</strong>{' '}
            {customerData.start_date
              ? new Date(customerData.start_date).toLocaleDateString()
              : 'N/A'}
          </p>
          <p className="mb-1">
            <strong>Fecha de Fin:</strong>{' '}
            {customerData.end_date
              ? new Date(customerData.end_date).toLocaleDateString()
              : 'N/A'}
          </p>

          {daysLeft != null ? (
            daysLeft >= 0 ? (
              <p className="mb-1">
                <strong>Días Restantes:</strong> {daysLeft}
              </p>
            ) : (
              <p className="text-red-500 font-semibold mb-1">
                Membresía expirada
              </p>
            )
          ) : (
            <p className="text-gray-500 mb-1">Fechas no definidas</p>
          )}
        </div>

        <div className="mt-4">
          <label className="block mb-1 font-medium text-gray-700">
            Lugar de Entrega
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

          {selectedLocation && (
            <div className="mt-4 bg-gray-100 p-2 rounded">
              <h3 className="font-bold">Horario de la ubicación elegida:</h3>
              {
                pickupLocations.find((l) => l.id === selectedLocation)?.schedule
                || 'N/A'
              }
            </div>
          )}
        </div>

        <button
          onClick={() => setShowChangeForm(!showChangeForm)}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Cambiar correo y contraseña
        </button>

        {showChangeForm && (
          <div className="mt-4 bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4">Cambiar Correo y Contraseña</h3>
            <label className="block mb-2 text-sm font-medium">Nuevo Correo</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            />
            <label className="block mb-2 text-sm font-medium">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border p-2 rounded w-full mb-4"
              />
              <div
                className="absolute right-2 top-2 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
            <button
              onClick={handleChangeEmailPassword}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Guardar Cambios
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMembership;
