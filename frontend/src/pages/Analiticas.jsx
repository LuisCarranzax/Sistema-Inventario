import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { generarReporteMensualPDF } from '../../../backend/src/services/reporteServices';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiDownload, FiTrendingUp, FiDollarSign, FiShoppingBag, FiTool } from 'react-icons/fi';
import '../css/Analiticas.css';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/authContext';


const Analiticas = () => {
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);

  // Estados para almacenar las métricas y los históricos del mes
  const [metricas, setMetricas] = useState(null);
  const [productosIngresados, setProductosIngresados] = useState([]);
  const [ventasMes, setVentasMes] = useState([]);
  const [serviciosMes, setServiciosMes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatosAnaliticos();
  }, []);

  const cargarDatosAnaliticos = async () => {
    try {
      setLoading(true);
      // Peticiones paralelas al backend para optimizar la velocidad de carga
      const [resMetricas, resProductos, resVentas, resServicios] = await Promise.all([
        api.get('/analiticas/mensual'),
        api.get('/productos'),
        api.get('/ventas'),
        api.get('/servicios')
      ]);

      setMetricas(resMetricas.data);
      setProductosIngresados(resProductos.data);
      setVentasMes(resVentas.data);
      setServiciosMes(resServicios.data);
    } catch (error) {
      console.error("Error al cargar datos analíticos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metricas) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>Cargando métricas financieras en tiempo real...</div>;
  }

  // Estructura de datos requerida por Recharts para pintar el gráfico interactivo
  const datosGrafico = [
    {
      name: metricas.mes.toUpperCase(),
      Ventas: metricas.ingresos_productos,
      Costos: metricas.costos_productos,
      Ganancia: metricas.ganancia_productos,
    }
  ];

  const handleDescargarReporte = () => {
    try {
      showToast("Generando reporte PDF...", "info");
      const usuarioNombre = user?.nombre || 'Administrador';
      generarReporteMensualPDF(metricas, productosIngresados, ventasMes, serviciosMes, usuarioNombre);
      showToast("Reporte PDF descargado con éxito.", "success");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showToast("Error al exportar el reporte a PDF.", "error");
    }
  };

  return (
    <div className="analiticas-container">
      
      {/* CABECERA CON BOTÓN DE EXPORTACIÓN */}
      <div className="inventario-header">
        <h1>Métricas Financieras y Rendimiento</h1>
        <button className="btn-nuevo" onClick={handleDescargarReporte} style={{ backgroundColor: '#2563EB' }}>
          <FiDownload style={{ marginRight: '8px' }} /> Exportar Cierre de Mes (PDF)
        </button>
      </div>

      {/* CUADRÍCULA DE SECCIONES EN TARJETAS (KPIs) */}
      <div className="kpi-grid">
        <div className="kpi-card ingresos">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-titulo">Ingreso Comercial</span>
            <FiShoppingBag color="#3B82F6" size={20} />
          </div>
          <span className="kpi-valor">S/ {metricas.ingresos_productos.toFixed(2)}</span>
          <span className="kpi-subtexto">Solo por venta de productos</span>
        </div>

        <div className="kpi-card servicios">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-titulo">Ingreso Técnico</span>
            <FiTool color="#8B5CF6" size={20} />
          </div>
          <span className="kpi-valor">S/ {metricas.ingresos_servicios.toFixed(2)}</span>
          <span className="kpi-subtexto">Recaudado en caja de taller</span>
        </div>

        <div className="kpi-card costos">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-titulo">Inversión / Costos</span>
            <FiDollarSign color="#EF4444" size={20} />
          </div>
          <span className="kpi-valor">S/ {metricas.costos_productos.toFixed(2)}</span>
          <span className="kpi-subtexto">Precio distribuidor invertido</span>
        </div>

        <div className="kpi-card ganancias">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-titulo">Ganancia Total Neta</span>
            <FiTrendingUp color="#10B981" size={20} />
          </div>
          <span className="kpi-valor" style={{ color: '#10B981' }}>S/ {metricas.ganancia_total_neta.toFixed(2)}</span>
          <span className="kpi-subtexto">Utilidad real libre del mes</span>
        </div>
      </div>

      {/* SECCIÓN INTERACTIVA DE GRÁFICOS Y DESGLOSE */}
      <div className="charts-section">
        
        {/* GRÁFICO DE RECHARTS */}
        <div className="chart-box">
          <h3>Comparativa Financiera: Ventas vs Costo vs Utilidad</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} formatter={(value) => `S/ ${value.toFixed(2)}`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                <Bar dataKey="Ventas" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={50} />
                <Bar dataKey="Costos" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={50} />
                <Bar dataKey="Ganancia" fill="#10B981" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RESUMEN OPERATIVO LATERAL */}
        <div className="resumen-financiero-box">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>Volumen del Mes</h3>
            <div className="list-items-balance">
              <div className="balance-item">
                <span style={{ color: '#64748B' }}>Productos Registrados:</span>
                <span style={{ fontWeight: 'bold' }}>{productosIngresados.length} und.</span>
              </div>
              <div className="balance-item">
                <span style={{ color: '#64748B' }}>Operaciones de Venta:</span>
                <span style={{ fontWeight: 'bold' }}>{ventasMes.length} trans.</span>
              </div>
              <div className="balance-item">
                <span style={{ color: '#64748B' }}>Órdenes de Taller:</span>
                <span style={{ fontWeight: 'bold' }}>{serviciosMes.length} equipos</span>
              </div>
            </div>
          </div>
          
          <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '15px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1E3A8A', textTransform: 'uppercase' }}>Cierre Contable</span>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: '5px 0 0 0' }}>
              Los ingresos combinan la venta de accesorios junto a las recaudaciones de adelantos y cancelaciones de servicios técnicos.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analiticas;