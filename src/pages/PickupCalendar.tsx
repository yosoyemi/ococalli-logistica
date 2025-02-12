// src/pages/PickupCalendar.tsx

import React, { useEffect, useState } from 'react';
import supabase from '../services/supabase';

// Para exportar a Excel
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Para exportar a PDF
import jsPDF from 'jspdf';
// (Opcionalmente) import autoTable from 'jspdf-autotable';

interface PickupLocation {
  id: string;
  name: string;
  address?: string;
  schedule?: string;
}

interface MembershipPlan {
  name: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  membership_code: string;
  membership_plan_id: string;
  pickup_location_id: string | null;
  delivered?: boolean; // Nueva columna
  delivered_at?: string | null; // Nueva columna
  pickup_locations?: {
    id: string;
    name: string;
    address?: string;
    schedule?: string;
  };
  membership_plans?: MembershipPlan;
}

const PickupCalendar: React.FC = () => {
  const [groupedData, setGroupedData] = useState<{ [locationId: string]: Customer[] }>(
    {}
  );
  const [locationsMap, setLocationsMap] = useState<{ [locationId: string]: PickupLocation }>(
    {}
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Cargar datos
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Traer customers con JOIN a pickup_locations y membership_plans
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          email,
          membership_code,
          membership_plan_id,
          pickup_location_id,
          delivered,
          delivered_at,
          membership_plans!left(name),
          pickup_locations!left(
            id,
            name,
            address,
            schedule
          )
        `);

      if (customerError) throw customerError;

      console.log('Clientes devueltos:', customers);

      // Agrupar por pickup_location_id
      const byLocation: { [locationId: string]: Customer[] } = {};
      const locMap: { [locationId: string]: PickupLocation } = {};

      (customers || []).forEach((cust: Customer) => {
        const locId = cust.pickup_location_id || 'SIN_UBICACION';

        if (!byLocation[locId]) {
          byLocation[locId] = [];
        }
        byLocation[locId].push(cust);

        if (cust.pickup_location_id && cust.pickup_locations) {
          locMap[cust.pickup_location_id] = {
            id: cust.pickup_locations.id,
            name: cust.pickup_locations.name,
            address: cust.pickup_locations.address,
            schedule: cust.pickup_locations.schedule,
          };
        }
      });

      setGroupedData(byLocation);
      setLocationsMap(locMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. useEffect para cargar al montar
  useEffect(() => {
    fetchData();
  }, []);

  // 3. Exportar a Excel
  const exportToExcel = () => {
    // Armamos un array de objetos para cada fila
    const rowsForExcel: any[] = [];

    // Recorremos cada ubicación
    Object.keys(groupedData).forEach((locId) => {
      const customersInLocation = groupedData[locId];
      const locData = locationsMap[locId];

      customersInLocation.forEach((cust) => {
        rowsForExcel.push({
          Ubicacion: locData
            ? locData.name
            : 'Sin ubicación asignada',
          Direccion: locData?.address || '',
          Horario: locData?.schedule || '',
          Cliente: cust.name,
          Email: cust.email,
          Codigo: cust.membership_code,
          Plan: cust.membership_plans?.name || '',
          Entregado: cust.delivered ? 'Sí' : 'No',
          EntregadoEl: cust.delivered_at || '',
        });
      });
    });

    if (rowsForExcel.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    // Crear hoja
    const ws = XLSX.utils.json_to_sheet(rowsForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CalendarioRecogidas');

    // Generar y descargar
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'calendario_recogidas.xlsx');
  };

  // 4. Exportar a PDF (básico)
  const exportToPdf = () => {
    const doc = new jsPDF();

    let yPos = 10; // posición vertical inicial

    doc.setFontSize(14);
    doc.text('Calendario de Recogidas', 10, yPos);
    yPos += 10;

    // Recorremos cada ubicación
    Object.keys(groupedData).forEach((locId) => {
      const customersInLocation = groupedData[locId];
      const locData = locationsMap[locId];
      const locationName = locData ? locData.name : 'Sin ubicación asignada';

      doc.setFontSize(12);
      doc.text(`Ubicación: ${locationName}`, 10, yPos);
      yPos += 6;
      if (locId !== 'SIN_UBICACION') {
        doc.text(
          `Dirección: ${locData?.address || ''} - Horario: ${
            locData?.schedule || 'N/A'
          }`,
          10,
          yPos
        );
        yPos += 6;
      }

      customersInLocation.forEach((cust: Customer) => {
        // Cada cliente en nueva línea
        const rowText = `- ${cust.name} | ${cust.email} | Cod: ${
          cust.membership_code
        } | Plan: ${cust.membership_plans?.name || ''} | Entregado: ${
          cust.delivered ? 'Sí' : 'No'
        }`;
        doc.text(rowText, 10, yPos);
        yPos += 6;

        // Salto de página simple
        if (yPos > 270) {
          doc.addPage();
          yPos = 10;
        }
      });

      yPos += 10; // espacio entre ubicaciones
    });

    doc.save('calendario_recogidas.pdf');
  };

  // 5. Marcar un cliente como "Entregado"
  const handleMarkDelivered = async (customerId: string) => {
    try {
      // Actualizamos en la DB
      const { error } = await supabase
        .from('customers')
        .update({
          delivered: true,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (error) throw error;

      // Refrescamos
      await fetchData();
      alert('Marcado como entregado');
    } catch (err: any) {
      alert('Error al marcar entregado: ' + err.message);
    }
  };

  if (loading) {
    return <div className="p-4">Cargando calendario...</div>;
  }
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  // Obtenemos las keys de groupedData
  const locationIds = Object.keys(groupedData);

  // Ordenar la key "SIN_UBICACION" al final
  locationIds.sort((a, b) => {
    if (a === 'SIN_UBICACION') return 1;
    if (b === 'SIN_UBICACION') return -1;
    return 0;
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-green-700">
          Calendario de Recogidas
        </h2>
        <div className="space-x-2">
          <button
            onClick={exportToExcel}
            className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
          >
            Exportar Excel
          </button>
          <button
            onClick={exportToPdf}
            className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {locationIds.length === 0 && (
        <p className="text-gray-700">No hay clientes registrados.</p>
      )}

      {locationIds.map((locId) => {
        const customersInLocation = groupedData[locId];

        // Datos de la ubicación
        const locData = locationsMap[locId];
        const locationName = locData ? locData.name : 'Sin ubicación asignada';
        const locationAddress = locData?.address || '';
        const locationSchedule = locData?.schedule || '';

        return (
          <div key={locId} className="mb-6 bg-white rounded shadow p-4">
            <h3 className="text-lg font-bold text-green-700 mb-2">
              {locationName}
            </h3>
            {locId !== 'SIN_UBICACION' && (
              <p className="text-sm text-gray-700">
                {locationAddress} <br />
                <strong>Horario:</strong> {locationSchedule || 'N/A'}
              </p>
            )}

            <div className="mt-4 space-y-2">
              {customersInLocation.map((cust: Customer) => (
                <div key={cust.id} className="border-b py-2">
                  <p className="font-semibold">{cust.name}</p>
                  <p className="text-sm text-gray-600">{cust.email}</p>
                  <p className="text-sm">
                    <strong>Código:</strong> {cust.membership_code}
                    {cust.membership_plans?.name && (
                      <>
                        {' '}
                        | <strong>Plan:</strong> {cust.membership_plans?.name}
                      </>
                    )}
                  </p>
                  <p className="text-sm">
                    <strong>Entregado:</strong>{' '}
                    {cust.delivered ? 'Sí' : 'No'}
                    {cust.delivered_at && (
                      <span>
                        {' '}
                        | <strong>Entregado el:</strong>{' '}
                        {new Date(cust.delivered_at).toLocaleString()}
                      </span>
                    )}
                  </p>
                  {!cust.delivered && (
                    <button
                      onClick={() => handleMarkDelivered(cust.id)}
                      className="mt-2 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Marcar Entregado
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PickupCalendar;