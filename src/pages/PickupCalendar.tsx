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
    const surRows: any[] = [];
    const norteRows: any[] = [];
    const sinUbicacionRows: any[] = [];
  
    // Se agrupan los datos por ubicación (Sur, Norte, Sin Ubicación)
    Object.keys(groupedData).forEach((locId) => {
      const customersInLocation = groupedData[locId];
      const locData = locationsMap[locId];
  
      customersInLocation.forEach((cust) => {
        const row = {
          Ubicacion: locData ? locData.name : 'Sin ubicación asignada',
          Direccion: locData?.address || '',
          Horario: locData?.schedule || '',
          Cliente: cust.name,
          Email: cust.email,
          Codigo: cust.membership_code,
          Plan: cust.membership_plans?.name || '',
          Entregado: cust.delivered ? 'Sí' : 'No',
          EntregadoEl: cust.delivered_at || '',
        };
  
        if (locData) {
          if (locData.name.toLowerCase().includes('sur')) {
            surRows.push(row);
          } else if (locData.name.toLowerCase().includes('norte')) {
            norteRows.push(row);
          } else {
            sinUbicacionRows.push(row);
          }
        } else {
          sinUbicacionRows.push(row);
        }
      });
    });
  
    if (surRows.length === 0 && norteRows.length === 0 && sinUbicacionRows.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
  
    // Creación de hojas para cada ubicación
    const wb = XLSX.utils.book_new();
  
    const createSheet = (rows: any[], sheetName: string, color: string) => {
      if (rows.length === 0) return;
      const ws = XLSX.utils.json_to_sheet(rows);
      const wsRange = XLSX.utils.decode_range(ws['!ref'] || "A1");
  
      // Estilos de las celdas
      const headerCellStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFFF00" } } }; // Color de fondo amarillo para encabezados
      const cellStyle = { font: { color: { rgb: "000000" } } }; // Color de texto negro
  
      // Aplica el estilo a los encabezados
      ws['A1'].s = headerCellStyle;
      ws['B1'].s = headerCellStyle;
      ws['C1'].s = headerCellStyle;
      ws['D1'].s = headerCellStyle;
      ws['E1'].s = headerCellStyle;
      ws['F1'].s = headerCellStyle;
      ws['G1'].s = headerCellStyle;
      ws['H1'].s = headerCellStyle;
  
      // Colores alternos para las filas (diferentes según ubicación)
      rows.forEach((row, index) => {
        const rowIndex = index + 2; // Inicia desde la segunda fila para no sobrescribir encabezados
        const rowColor = index % 2 === 0 ? { rgb: color } : { rgb: "FFFFFF" }; // Alterna entre colores
        Object.keys(row).forEach((key, colIndex) => {
          const cell = ws[XLSX.utils.encode_cell({ r: rowIndex - 1, c: colIndex })];
          if (cell) {
            cell.s = cellStyle; // Aplica el estilo a las celdas
            cell.s.fill = { fgColor: rowColor }; // Aplica el color a las filas alternadas
          }
        });
      });
  
      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };
  
    // Crear las hojas para Sur, Norte y Sin ubicación con colores diferenciados
    createSheet(surRows, 'Sur', 'D3D3D3'); // Gris claro para Sur
    createSheet(norteRows, 'Norte', 'ADD8E6'); // Azul claro para Norte
    createSheet(sinUbicacionRows, 'Sin Ubicación', 'FFD700'); // Amarillo para Sin Ubicación
  
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'calendario_entregas.xlsx');
  };
  

  // ---------------------------------------------------------------------
  // Exportar a PDF
  // ---------------------------------------------------------------------
  const exportToPdf = () => {
    const doc = new jsPDF();
  
    // Establecer margen y estilos
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Calendario de Entregas", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
  
    const locationIds = Object.keys(groupedData).sort((a, b) => (a === "SIN_UBICACION" ? 1 : b === "SIN_UBICACION" ? -1 : 0));
  
    locationIds.forEach((locId, index) => {
      const customersInLocation = groupedData[locId];
      const locData = locationsMap[locId];
      const locationName = locData ? locData.name : "Sin ubicación asignada";
  
      if (index !== 0) doc.addPage(); // Nueva página por ubicación
  
      doc.setFontSize(14);
      doc.setTextColor(0, 100, 0);
      doc.text(`Ubicación: ${locationName}`, 14, 30);
      doc.setTextColor(0, 0, 0);
  
      if (locId !== "SIN_UBICACION") {
        doc.setFontSize(10);
        doc.text(`Dirección: ${locData?.address || "N/A"} | Horario: ${locData?.schedule || "N/A"}`, 14, 38);
      }
  
      const tableData = customersInLocation.map((cust) => [
        cust.name,
        cust.email,
        cust.membership_code,
        cust.membership_plans?.name || "N/A",
        cust.delivered ? "Sí" : "No",
        cust.delivered_at ? new Date(cust.delivered_at).toLocaleString() : "N/A"
      ]);
  
      doc.autoTable({
        startY: locId !== "SIN_UBICACION" ? 45 : 38,
        head: [["Cliente", "Email", "Código", "Plan", "Entregado", "Fecha Entrega"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [0, 100, 0] },
        styles: { fontSize: 10, cellPadding: 3 },
      });
    });
  
    doc.save("calendario_entregas.pdf");
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
