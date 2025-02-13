import React, { useEffect, useState } from "react";
import supabase from "../services/supabase"; // Asegúrate de que este import funcione

interface Huacal {
  id: number;
  cantidad: number;
  tipo: string;
  extras: string;
  fecha: string;
  cliente: string;
  direccion: string;
}

const Huacales: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>("norte");
  const [data, setData] = useState<Huacal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Función para cargar datos de la base de datos
  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("huacales")
        .select(`
          id, 
          cantidad, 
          tipo, 
          extras, 
          created_at, 
          customers!inner(name), 
          pickup_locations!inner(address)
        `)
        .eq("pickup_locations.name", selectedOption === "norte" ? "Norte" : "Sur");

      if (error) throw error;

      // Renombrar manualmente el campo 'created_at' a 'fecha'
      const formattedData = data.map((item: any) => ({
        id: item.id,
        cantidad: item.cantidad,
        tipo: item.tipo,
        extras: item.extras || "N/A",
        fecha: new Date(item.created_at).toLocaleDateString(), // Ahora usamos 'created_at' correctamente
        cliente: item.customers?.name || "Desconocido",
        direccion: item.pickup_locations?.address || "Sin dirección",
      }));

      setData(formattedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar fetchData cada vez que cambie la opción seleccionada
  useEffect(() => {
    fetchData();
  }, [selectedOption]);

  return (
    <div className="p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold text-green-700 mb-4">Gestión de Huacales</h2>

      {/* Selector de entrega */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Selecciona el tipo de entrega:</label>
        <select 
          value={selectedOption} 
          onChange={(e) => setSelectedOption(e.target.value)} 
          className="border p-2 rounded"
        >
          <option value="norte">Entregas Norte</option>
          <option value="sur">Entregas Sur</option>
        </select>
      </div>

      {/* Mensaje de carga o error */}
      {loading && <p className="text-gray-500">Cargando datos...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Tabla de datos */}
      {!loading && !error && (
        <table className="w-full border-collapse border border-gray-300 mt-4">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="border p-2">ID</th>
              <th className="border p-2">Cliente</th>
              <th className="border p-2">Dirección</th>
              <th className="border p-2">Cantidad</th>
              <th className="border p-2">Tipo</th>
              <th className="border p-2">Extras</th>
              <th className="border p-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-100">
                  <td className="border p-2">{item.id}</td>
                  <td className="border p-2">{item.cliente}</td>
                  <td className="border p-2">{item.direccion}</td>
                  <td className="border p-2">{item.cantidad}</td>
                  <td className="border p-2">{item.tipo}</td>
                  <td className="border p-2">{item.extras}</td>
                  <td className="border p-2">{item.fecha}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center border p-2 text-gray-500">
                  No hay datos disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Huacales;
