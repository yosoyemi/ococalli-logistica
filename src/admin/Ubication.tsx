import { useState, useEffect } from "react";
import supabase from "../services/supabase";
import React from "react";

export default function DeliveryForm() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filterRegion, setFilterRegion] = useState("");
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
    domicilio: "", 
  });

  useEffect(() => {
    async function fetchCustomers() {
      const { data, error } = await supabase
        .from("customers")
        .select(`id, name, pickup_location_id, pickup_location:pickup_location_id (name)`);

      if (error) {
        console.error("Error en la consulta:", error);
      } else {
        setCustomers(data);
        setFilteredCustomers(data);
      }
    }
    fetchCustomers();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = customers.filter((customer) =>
      customer.name.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
  };

  const handleFilterRegion = (region) => {
    setFilterRegion(region);
    if (region === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (customer) => customer.pickup_location?.name === region
      );
      setFilteredCustomers(filtered);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToInsert = {
      ...formData,
      extra_item: formData.extras === "Sí" ? formData.extra_item : null,
      extra_price: formData.extras === "Sí" ? formData.extra_price : null,
    };

    const { error } = await supabase.from("huacales").insert([dataToInsert]);

    if (error) {
      console.error(error);
      alert("Error al registrar la entrega");
    } else {
      alert("Entrega registrada con éxito");
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
        domicilio: "", 
      });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl">
      <h2 className="text-xl font-bold mb-4">Registrar Extras</h2>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleFilterRegion("")}
          className={`p-2 rounded transition-all ${filterRegion === "" ? "bg-gray-800 text-white" : "bg-gray-300 hover:bg-gray-800 hover:text-white"}`}
        >
          Todos
        </button>
        <button
          onClick={() => handleFilterRegion("Norte")}
          className={`p-2 rounded transition-all ${filterRegion === "Norte" ? "bg-blue-800 text-white" : "bg-blue-500 text-white hover:bg-blue-800"}`}
        >
          Norte
        </button>
        <button
          onClick={() => handleFilterRegion("Sur")}
          className={`p-2 rounded transition-all ${filterRegion === "Sur" ? "bg-green-800 text-white" : "bg-green-500 text-white hover:bg-green-800"}`}
        >
          Sur
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          className="w-full p-2 border rounded mb-4"
          onChange={handleSearchChange}
        />

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
              {customer.name} ({customer.pickup_location?.name})
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

        <input
          type="text"
          name="domicilio"
          placeholder="Domicilio"
          className="w-full p-2 border rounded"
          onChange={handleChange}
          value={formData.domicilio}
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

        <label className="block">¿Compras extras?</label>
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
          </>
        )}

        <button type="submit" className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700">
          Registrar
        </button>
      </form>
    </div>
  );
}
