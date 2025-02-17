import React from 'react';
import { Link } from 'react-router-dom';
import supabase from '../services/supabase';

// Import de Chart.js (versión 3+)
import Chart from 'chart.js/auto';

type AdminDashboardState = {
  plansCount: number;
  customersCount: number;
  activeCount: number;
  cancelledCount: number;
  loading: boolean;
  error: string;
};

class AdminDashboard extends React.Component<{}, AdminDashboardState> {
  private pieChart: Chart | null = null;

  constructor(props: {}) {
    super(props);
    this.state = {
      plansCount: 0,
      customersCount: 0,
      activeCount: 0,
      cancelledCount: 0,
      loading: true,
      error: '',
    };
  }

  /**
   * Al montar el componente, hacemos las consultas a Supabase.
   */
  async componentDidMount() {
    try {
      // 1) Contar planes
      const { count: totalPlans, error: plansError } = await supabase
        .from('membership_plans')
        .select('*', { count: 'exact' });
      if (plansError) throw plansError;

      // 2) Contar clientes
      const { count: totalCustomers, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact' });
      if (customersError) throw customersError;

      // 3) Contar "ACTIVE"
      const { count: totalActive, error: activeError } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('status', 'ACTIVE');
      if (activeError) throw activeError;

      // 4) Contar "CANCELLED"
      const { count: totalCancelled, error: cancelledError } = await supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('status', 'CANCELLED');
      if (cancelledError) throw cancelledError;

      // Actualizamos el estado
      this.setState(
        {
          plansCount: totalPlans || 0,
          customersCount: totalCustomers || 0,
          activeCount: totalActive || 0,
          cancelledCount: totalCancelled || 0,
          loading: false,
          error: '',
        },
        () => {
          // Callback de setState: renderizamos la gráfica
          // Destruimos la anterior si existía (para evitar "Canvas is already in use")
          if (this.pieChart) {
            this.pieChart.destroy();
          }
          this.renderPieChart();
        }
      );
    } catch (err: any) {
      this.setState({ error: err.message, loading: false });
    }
  }

  /**
   * Antes de desmontar el componente, destruimos la instancia
   * de Chart.js para evitar fugas de memoria y reusos conflictivos del canvas.
   */
  componentWillUnmount() {
    if (this.pieChart) {
      this.pieChart.destroy();
    }
  }

  /**
   * Crea la gráfica de pastel de forma imperativa en el <canvas>.
   */
  private renderPieChart() {
    const canvas = document.getElementById('subscriptionsPieChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const { activeCount, cancelledCount } = this.state;

    const data = {
      labels: ['Activas', 'Canceladas'],
      datasets: [
        {
          label: 'Estado de Suscripciones',
          data: [activeCount, cancelledCount],
          backgroundColor: ['#34D399', '#F87171'], // Verde y rojo (Tailwind)
        },
      ],
    };

    this.pieChart = new Chart(canvas, {
      type: 'pie',
      data,
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }

  render() {
    const {
      loading,
      error,
      plansCount,
      customersCount,
      activeCount,
      cancelledCount,
    } = this.state;

    // Mostrar mientras se cargan datos
    if (loading) {
      return (
        <div className="bg-white rounded shadow p-6">
          <p>Cargando datos del dashboard...</p>
        </div>
      );
    }

    // Mostrar error
    if (error) {
      return (
        <div className="bg-white rounded shadow p-6 text-red-500">
          <p>Error al cargar datos: {error}</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-2xl font-bold mb-4 text-green-700">
          Bienvenido al Panel de Administración
        </h2>

        {/* Resumen de datos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Planes */}
          <div className="border rounded p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Planes</h3>
            <p className="text-3xl font-bold text-green-700 mt-2">{plansCount}</p>
          </div>
          {/* Clientes */}
          <div className="border rounded p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Clientes</h3>
            <p className="text-3xl font-bold text-green-700 mt-2">{customersCount}</p>
          </div>
          {/* Activas */}
          <div className="border rounded p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Activas</h3>
            <p className="text-3xl font-bold text-green-700 mt-2">{activeCount}</p>
          </div>
          {/* Canceladas */}
          <div className="border rounded p-4 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Canceladas</h3>
            <p className="text-3xl font-bold text-green-700 mt-2">{cancelledCount}</p>
          </div>
        </div>

        {/* Gráfica de pastel */}
        <div className="mt-8 bg-gray-50 rounded shadow p-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            Distribución de Suscripciones
          </h3>
          <canvas
            id="subscriptionsPieChart"
            className="mx-auto"
            style={{ maxWidth: 400, maxHeight: 400 }}
          />
        </div>

        {/* Accesos rápidos */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/admin/plans"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Ver Planes
          </Link>
          <Link
            to="/admin/customers"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Ver Clientes
          </Link>
          <Link
            to="/admin/locations"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Ver Ubicaciones
          </Link>
          <Link
            to="/admin/renewals"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Renovaciones
          </Link>
          <Link
            to="/admin/Ubication"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Huacales
          </Link>
          <Link
            to="/admin/calendar"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Calendario de Entrega
          </Link>
        </div>
      </div>
    );
  }
}


export default AdminDashboard;
