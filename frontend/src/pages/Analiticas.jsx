import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { generarReporteMensualPDF, generarReportePersonalizadoPDF } from '../../../backend/src/services/reporteServices';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiDownload, FiTrendingUp, FiDollarSign, FiShoppingBag, FiTool } from 'react-icons/fi';
import '../css/Analiticas.css';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';


const Analiticas = () => {
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);

  // Estados para almacenar las métricas y los históricos del mes
  const [metricas, setMetricas] = useState(null);
  const [productosIngresados, setProductosIngresados] = useState([]);
  const [ventasMes, setVentasMes] = useState([]);
  const [serviciosMes, setServiciosMes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para reporte personalizado
  const [mostrarModalPersonalizado, setMostrarModalPersonalizado] = useState(false);
  const [reporteFiltro, setReporteFiltro] = useState({
    modulo: 'ventas',
    fecha_inicio: '',
    fecha_fin: '',
    categoria_id: 'todas'
  });
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    cargarDatosAnaliticos();
  }, []);

  const cargarDatosAnaliticos = async () => {
    try {
      setLoading(true);
      // Peticiones paralelas al backend para optimizar la velocidad de carga
      const [resMetricas, resProductos, resVentas, resServicios, resCategorias] = await Promise.all([
        api.get('/analiticas/mensual'),
        api.get('/productos'),
        api.get('/ventas'),
        api.get('/servicios'),
        api.get('/categorias').catch(() => ({ data: [] }))
      ]);

      setMetricas(resMetricas.data);
      setProductosIngresados(resProductos.data);
      setVentasMes(resVentas.data);
      setServiciosMes(resServicios.data);
      setCategorias(resCategorias.data);
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

  const handleGenerarReportePersonalizado = async (e) => {
    e.preventDefault();
    try {
      showToast("Generando reporte personalizado...", "info");
      
      const params = new URLSearchParams();
      params.append('modulo', reporteFiltro.modulo);
      if (reporteFiltro.fecha_inicio) params.append('fecha_inicio', reporteFiltro.fecha_inicio);
      if (reporteFiltro.fecha_fin) params.append('fecha_fin', reporteFiltro.fecha_fin);
      if (reporteFiltro.modulo === 'inventario' && reporteFiltro.categoria_id) {
        params.append('categoria_id', reporteFiltro.categoria_id);
      }

      const response = await api.get(`/analiticas/reporte-personalizado?${params.toString()}`);
      const datos = response.data;

      if (!datos || datos.length === 0) {
        showToast("No se encontraron registros para los filtros seleccionados.", "warning");
        return;
      }

      const usuarioNombre = user?.nombre || 'Administrador';
      generarReportePersonalizadoPDF(
        reporteFiltro.modulo,
        datos,
        reporteFiltro.fecha_inicio,
        reporteFiltro.fecha_fin,
        usuarioNombre
        
      );
      
      showToast("Reporte personalizado generado con éxito.", "success");
      setMostrarModalPersonalizado(false);
    } catch (error) {
      console.error("Error al generar reporte personalizado:", error);
      showToast("Error al obtener los datos del reporte.", "error");
    }
  };

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
      
      {/* CABECERA CON BOTONES DE EXPORTACIÓN */}
      <div className="inventario-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Métricas Financieras y Rendimiento</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-filtro" onClick={() => setMostrarModalPersonalizado(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, padding: '10px 20px', fontSize: '0.9rem', backgroundColor: '#8B5CF6', color: '#FFF' }}>
            <FiDownload /> Reporte Personalizado (PDF)
          </button>
          <button className="btn-nuevo" onClick={handleDescargarReporte} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, padding: '10px 20px', fontSize: '0.9rem', backgroundColor: '#2563EB' }}>
            <FiDownload /> Exportar Cierre de Mes (PDF)
          </button>
        </div>
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

      {/* MODAL PARA REPORTE PERSONALIZADO */}
      {mostrarModalPersonalizado && (
        <div className="modal-sobrecapa" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '10px', fontSize: '1.4rem', color: '#1E293B', fontWeight: 'bold' }}>Generar Reporte Personalizado (PDF)</h2>
            <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '20px' }}>
              Elige el módulo y los filtros de fechas para exportar el historial de actividades en formato PDF estructurado.
            </p>
            
            <form onSubmit={handleGenerarReportePersonalizado}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Módulo del Reporte</label>
                <select 
                  value={reporteFiltro.modulo} 
                  onChange={(e) => setReporteFiltro({ ...reporteFiltro, modulo: e.target.value })} 
                  style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', color: '#1E293B' }}
                >
                  <option value="ventas">Ventas (Punto de Venta)</option>
                  <option value="servicios">Servicios Técnicos (Taller)</option>
                  <option value="inventario">Inventario (Stock de Productos)</option>
                </select>
              </div>

              {reporteFiltro.modulo === 'inventario' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Filtrar por Categoría</label>
                  <select 
                    value={reporteFiltro.categoria_id} 
                    onChange={(e) => setReporteFiltro({ ...reporteFiltro, categoria_id: e.target.value })} 
                    style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem', color: '#1E293B' }}
                  >
                    <option value="todas">Todas las categorías</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Fecha Inicio</label>
                  <input 
                    type="date" 
                    value={reporteFiltro.fecha_inicio} 
                    onChange={(e) => setReporteFiltro({ ...reporteFiltro, fecha_inicio: e.target.value })} 
                    style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>Fecha Fin</label>
                  <input 
                    type="date" 
                    value={reporteFiltro.fecha_fin} 
                    onChange={(e) => setReporteFiltro({ ...reporteFiltro, fecha_fin: e.target.value })} 
                    style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 20px 0' }}>
                💡 Si dejas las fechas vacías, se generará el reporte completo del historial del módulo.
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '15px' }}>
                <button 
                  type="button" 
                  className="btn-filtro" 
                  onClick={() => {
                    setMostrarModalPersonalizado(false);
                    setReporteFiltro({ modulo: 'ventas', fecha_inicio: '', fecha_fin: '', categoria_id: 'todas' });
                  }} 
                  style={{ margin: 0, padding: '10px 20px', fontSize: '0.9rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-seguridad" 
                  style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem', backgroundColor: '#8B5CF6', color: 'white' }}
                >
                  Generar PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Analiticas;