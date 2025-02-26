import { useEffect, useState } from "react";
import supabase from '../services/supabase';
import React from "react";

const Eliminar: React.FC = () => {
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("customers").select("id, name");
      if (error) console.error(error);
      else setUsers(data || []);
    };
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (confirmation !== "Delete") {
      setError("Debes escribir 'Delete' para confirmar");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.from("customers").delete().eq("name", selectedUser);

    if (error) {
      setError(error.message);
    } else {
      alert("Usuario eliminado correctamente");
      setSelectedUser("");
      setConfirmation("");
      setUsers(users.filter(user => user.name !== selectedUser));
    }

    setLoading(false);
  };

  return (
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md mx-auto mt-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">Eliminar Usuario</h2>
        <input
          type="text"
          placeholder="Buscar usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-3 w-full mb-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="border p-3 w-full rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Seleccione un usuario</option>
          {users
            .filter(user => user.name.toLowerCase().includes(search.toLowerCase()))
            .map(user => (
              <option key={user.id} value={user.name}>{user.name}</option>
            ))}
        </select>
        <label className="block mt-4 font-semibold text-gray-600">Escribe "Delete" para confirmar:</label>
        <input
          type="text"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className="border p-3 w-full rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mt-2"
        />
        <button 
          onClick={handleDelete} 
          disabled={loading} 
          className="bg-red-600 text-white px-6 py-3 rounded-lg mt-4 w-full font-semibold hover:bg-red-700 disabled:bg-red-300 transition-all duration-300"
        >
          {loading ? "Eliminando..." : "Eliminar Usuario"}
        </button>
        {error && <p className="text-red-500 text-center mt-4 font-medium">Error: {error}</p>}
      </div>
  );
};

export default Eliminar;
