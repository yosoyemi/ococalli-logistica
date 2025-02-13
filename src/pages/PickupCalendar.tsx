import React, { useEffect, useState, useRef } from 'react';
import supabase from '../services/supabase';

// Para exportar a Excel
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Para exportar a PDF
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Importamos Chart.js (modo 'auto' para no registrar manualmente todos los componentes)
import Chart from 'chart.js/auto';

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
  delivered?: boolean;
  delivered_at?: string | null;
  membership_plans?: MembershipPlan;
  pickup_locations?: {
    id: string;
    name: string;
    address?: string;
    schedule?: string;
  };
}

const PickupCalendar: React.FC = () => {
  // Estados actuales
  const [groupedData, setGroupedData] = useState<{ [locationId: string]: Customer[] }>({});
  const [locationsMap, setLocationsMap] = useState<{ [locationId: string]: PickupLocation }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Referencia para la instancia del Chart (para poder destruirla antes de recrearla)
  const chartRef = useRef<Chart | null>(null);

  // Función para cargar datos
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
          membership_plans:customers_membership_plan_id_fkey!left(
            name
          ),
          pickup_locations:customers_pickup_location_id_fkey!left(
            id,
            name,
            address,
            schedule
          )
        `);

      if (customerError) throw customerError;

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

  // useEffect para cargar al montar
  useEffect(() => {
    fetchData();
  }, []);

  // useEffect para renderizar o actualizar la gráfica cuando tenemos `groupedData`
  useEffect(() => {
    if (!loading && !error) {
      // Destruimos la anterior si existe (para evitar "Canvas is already in use" en re-renders)
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      // Creamos la gráfica
      renderChart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, groupedData]);

  // -------------------
  //  GRAFICAR
  // -------------------
  const renderChart = () => {
    // Obtenemos las keys de groupedData (ID de ubicaciones)
    const locationIds = Object.keys(groupedData);
    // Construimos un array de nombres (labels) y un array de contadores
    // locationIds -> "SIN_UBICACION" iremos al final, por si quieres
    locationIds.sort((a, b) => {
      if (a === 'SIN_UBICACION') return 1;
      if (b === 'SIN_UBICACION') return -1;
      return 0;
    });

    const labels = locationIds.map((locId) => {
      const locObj = locationsMap[locId];
      return locObj ? locObj.name : 'Sin ubicación asignada';
    });

    const dataCounts = locationIds.map((locId) => groupedData[locId].length);

    const ctx = document.getElementById('locationChart') as HTMLCanvasElement;
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Clientes por Ubicación',
            data: dataCounts,
            backgroundColor: '#34D399', // verde Tailwind
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
        scales: {
          x: {
            ticks: {
              font: {
                size: 12,
              },
            },
          },
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  };

  // ---------------------------------------------------------------------
  // Exportar a Excel
  // ---------------------------------------------------------------------
  const exportToExcel = () => {
    const rowsForExcel: any[] = [];

    Object.keys(groupedData).forEach((locId) => {
      const customersInLocation = groupedData[locId];
      const locData = locationsMap[locId];
      customersInLocation.forEach((cust) => {
        rowsForExcel.push({
          Ubicacion: locData ? locData.name : 'Sin ubicación asignada',
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

    const ws = XLSX.utils.json_to_sheet(rowsForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CalendarioEntregas');

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'calendario_entregas.xlsx');
  };

  // ---------------------------------------------------------------------
  // Exportar a PDF
  // ---------------------------------------------------------------------
  const exportToPdf = () => {
    const doc = new jsPDF();
    let yPos = 10;

    doc.setFontSize(14);
    doc.text('Calendario de Entregas', 10, yPos);
    yPos += 10;

    const locationIds = Object.keys(groupedData);
    locationIds.sort((a, b) => {
      if (a === 'SIN_UBICACION') return 1;
      if (b === 'SIN_UBICACION') return -1;
      return 0;
    });

    locationIds.forEach((locId) => {
      const customersInLocation = groupedData[locId];
      const locData = locationsMap[locId];
      const locationName = locData ? locData.name : 'Sin ubicación asignada';

      doc.setFontSize(12);
      doc.text(`Ubicación: ${locationName}`, 10, yPos);
      yPos += 6;

      if (locId !== 'SIN_UBICACION') {
        doc.text(
          `Dirección: ${locData?.address || ''} - Horario: ${locData?.schedule || 'N/A'}`,
          10,
          yPos
        );
        yPos += 6;
      }

      customersInLocation.forEach((cust: Customer) => {
        const rowText = `- ${cust.name} | ${cust.email} | Cod: ${
          cust.membership_code
        } | Plan: ${cust.membership_plans?.name || ''} | Entregado: ${
          cust.delivered ? 'Sí' : 'No'
        }`;
        doc.text(rowText, 10, yPos);
        yPos += 6;

        if (yPos > 270) {
          doc.addPage();
          yPos = 10;
        }
      });

      yPos += 10;
    });

    doc.save('calendario_entregas.pdf');
  };

  // ---------------------------------------------------------------------
  // Marcar como entregado
  // ---------------------------------------------------------------------
  const handleMarkDelivered = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          delivered: true,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (error) throw error;

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

  // Listado por ubicación
  const locationIds = Object.keys(groupedData);
  locationIds.sort((a, b) => {
    if (a === 'SIN_UBICACION') return 1;
    if (b === 'SIN_UBICACION') return -1;
    return 0;
  });

  return (
    <div className="container mx-auto p-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-green-700">Calendario de Entregas</h2>
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

      {/* Gráfica: #Clientes por Ubicación */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h3 className="text-lg font-semibold text-green-700 mb-2">
          Gráfica de Clientes por Ubicación
        </h3>
        <div className="overflow-auto">
          <canvas id="locationChart" style={{ width: '100%', maxHeight: 400 }} />
        </div>
      </div>

      {/* Listado de ubicaciones */}
      {locationIds.length === 0 && (
        <p className="text-gray-700">No hay clientes registrados.</p>
      )}

      {locationIds.map((locId) => {
        const customersInLocation = groupedData[locId];
        const locData = locationsMap[locId];

        return (
          <div key={locId} className="mb-6 bg-white rounded shadow p-4">
            <h3 className="text-lg font-bold text-green-700 mb-2">
              {locData ? locData.name : 'Sin ubicación asignada'}
            </h3>
            {locId !== 'SIN_UBICACION' && locData && (
              <p className="text-sm text-gray-700">
                {locData.address} <br />
                <strong>Horario:</strong> {locData.schedule || 'N/A'}
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
                        {' '}| <strong>Plan:</strong> {cust.membership_plans?.name}
                      </>
                    )}
                  </p>
                  <p className="text-sm">
                    <strong>Entregado:</strong> {cust.delivered ? 'Sí' : 'No'}
                    {cust.delivered_at && (
                      <span>
                        {' '}| <strong>Entregado el:</strong>{' '}
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
