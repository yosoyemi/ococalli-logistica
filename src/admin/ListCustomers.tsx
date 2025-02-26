import React, { useEffect, useState } from 'react';
import supabase from '../services/supabase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
};

const calculateDaysLeft = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getColorClass = (daysLeft) => {
  if (daysLeft >= 21 && daysLeft <= 30) return 'bg-green-200';
  if (daysLeft >= 8 && daysLeft <= 20) return 'bg-yellow-200';
  if (daysLeft < 7) return 'bg-red-200';
  return '';
};

const ListCustomers: React.FC = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

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

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        id, name, email, phone, membership_code, status, start_date, end_date,
        membership_plans!inner(name, duration_months, free_months),
        pickup_locations!left(name, address, schedule)
      `)
      .order('name');
    if (error) {
      console.error(error.message);
    } else {
      setCustomers(data);
      setFilteredCustomers(data);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Lista de Clientes', 20, 10);

    const tableData = filteredCustomers.map((c) => [
      c.name,
      c.membership_plans?.name || '',
      c.status,
      formatDate(c.end_date),
    ]);

    doc.autoTable({
      head: [['Nombre', 'Plan', 'Estatus', 'Fecha Fin']],
      body: tableData,
      startY: 20,
    });

    doc.save('clientes.pdf');
  };

  const exportToExcel = () => {
    const dataForExcel = filteredCustomers.map((c) => ({
      Nombre: c.name,
      Email: c.email,
      Teléfono: c.phone || '',
      CódigoMembresía: c.membership_code,
      Plan: c.membership_plans?.name || '',
      Estatus: c.status,
      Ubicación: c.pickup_locations ? `${c.pickup_locations.name} - ${c.pickup_locations.address}` : '',
      Horario: c.pickup_locations?.schedule || '',
      FechaInicio: formatDate(c.start_date),
      FechaFin: formatDate(c.end_date),
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'clientes.xlsx');
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-xl font-bold text-green-700 mb-4">Clientes Registrados</h2>
      <div className="mb-4 flex space-x-4">
        <button
          onClick={exportToPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Exportar a PDF
        </button>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Exportar a Excel
        </button>
      </div>
      <div className="space-y-4">
        {filteredCustomers.map((c) => {
          const daysLeft = calculateDaysLeft(c.end_date);
          return (
            <div key={c.id} className={`border p-4 rounded shadow ${getColorClass(daysLeft)}`}>
              <p className="font-semibold text-lg mb-1">{c.name}</p>
              <p><strong>Email:</strong> {c.email}</p>
              <p><strong>Teléfono:</strong> {c.phone || 'N/A'}</p>
              <p><strong>Código Membresía:</strong> {c.membership_code}</p>
              <p><strong>Plan:</strong> {c.membership_plans?.name}</p>
              <p><strong>Estatus:</strong> {c.status}</p>
              <p><strong>Ubicación:</strong> {c.pickup_locations ? `${c.pickup_locations.name} - ${c.pickup_locations.address}` : 'N/A'}</p>
              <p><strong>Horario:</strong> {c.pickup_locations?.schedule || 'N/A'}</p>
              <p><strong>Fecha de inicio:</strong> {formatDate(c.start_date)}</p>
              <p><strong>Fecha de fin:</strong> {formatDate(c.end_date)}</p>
              <p><strong>Días restantes:</strong> {daysLeft !== null ? daysLeft : 'N/A'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListCustomers;