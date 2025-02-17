import { useState, useEffect } from "react";
import supabase from '../services/supabase';
import React from "react";

export default function DeliveryForm() {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    customer_id: "",
    delivery_time: "",
    transport_type: "Huacal",
    returned_huacals: 0,
    extras: "No",
    extra_item: "",
    extra_price: "",
    payment_method: "",
    cash_payment: false,
    status: "Pendiente",
  });

  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabase.from("customers").select("id, name");
      if (data) {
        setCustomers(data);
        setFilteredCustomers(data);
      }
      if (error) console.error(error);
    }
    fetchCustomers();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verifica si 'extras' es 'Sí' y ajusta los valores de 'extra_item' y 'extra_price'
    const dataToInsert = {
      ...formData,
      extra_item: formData.extras === "Sí" ? formData.extra_item : null,
      extra_price: formData.extras === "Sí" ? formData.extra_price : null,
    };

    // Realiza la inserción en la tabla 'huacales'
    const { error } = await supabase.from("huacales").insert([dataToInsert]);

    if (error) {
      console.error(error); // Mostrar el error en la consola para más detalles
      alert("Error al registrar la entrega");
    } else {
      alert("Entrega registrada con éxito");

      // Limpiar el formulario después de un registro exitoso
      setFormData({
        customer_id: "",
        delivery_time: "",
        transport_type: "Huacal",
        returned_huacals: 0,
        extras: "No",
        extra_item: "",
        extra_price: "",
        payment_method: "",
        cash_payment: false,
        status: "Pendiente",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl">
      <h2 className="text-xl font-bold mb-4">Registrar Entrega</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Buscador de clientes */}
        <input
          type="text"
          placeholder="Buscar cliente..."
          className="w-full p-2 border rounded mb-4"
          onChange={handleSearchChange}
        />

        {/* Selector de cliente */}
        <select
          name="customer_id"
          className="w-full p-2 border rounded"
          onChange={handleChange}
          value={formData.customer_id}
          required
        >
          <option value="">Selecciona un cliente</option>
          {filteredCustomers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="delivery_time"
          placeholder="Hora de entrega"
          className="w-full p-2 border rounded"
          onChange={handleChange}
          value={formData.delivery_time}
          required
        />

        <select
          name="transport_type"
          className="w-full p-2 border rounded"
          onChange={handleChange}
          value={formData.transport_type}
        >
          <option value="Huacal">Huacal</option>
          <option value="Bolsa">Bolsa</option>
        </select>

        <input
          type="number"
          name="returned_huacals"
          placeholder="Huacales devueltos"
          className="w-full p-2 border rounded"
          min="0"
          onChange={handleChange}
          value={formData.returned_huacals}
        />

        <label className="block">¿Compraste extras?</label>
        <select
          name="extras"
          className="w-full p-2 border rounded"
          onChange={handleChange}
          value={formData.extras}
        >
          <option value="No">No</option>
          <option value="Sí">Sí</option>
        </select>

        {formData.extras === "Sí" && (
          <>
            <input
              type="text"
              name="extra_item"
              placeholder="¿Qué extra fue?"
              className="w-full p-2 border rounded"
              onChange={handleChange}
              value={formData.extra_item}
            />
            <input
              type="number"
              name="extra_price"
              placeholder="Precio"
              className="w-full p-2 border rounded"
              min="0"
              onChange={handleChange}
              value={formData.extra_price}
            />
            <label className="block">Método de pago</label>
            <select
              name="payment_method"
              className="w-full p-2 border rounded"
              onChange={handleChange}
              value={formData.payment_method}
              required
            >
              <option value="">Selecciona un método</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Transferencia y Efectivo">Transferencia y Efectivo</option>
            </select>
          </>
        )}

        <button type="submit" className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700">
          Registrar
        </button>
      </form>
    </div>
  );
}
