import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { FiActivity, FiAlertTriangle, FiDollarSign, FiShoppingBag, FiTool, FiPackage, FiFolder, FiUser, FiClock } from 'react-icons/fi';
import './Dashboard.css';

const getModuloInfo = (modulo) => {
  switch (modulo) {
    case 'Inventario':
      return { icon: <FiPackage size={16} />, color: '#10B981', bg: '#ECFDF5' };
    case 'Ventas':
      return { icon: <FiShoppingBag size={16} />, color: '#3B82F6', bg: '#EFF6FF' };
    case 'Servicios':
      return { icon: <FiTool size={16} />, color: '#8B5CF6', bg: '#F5F3FF' };
    case 'Categorías':
      return { icon: <FiFolder size={16} />, color: '#F59E0B', bg: '#FFFBEB' };
    case 'Usuarios':
      return { icon: <FiUser size={16} />, color: '#EF4444', bg: '#FEF2F2' };
    default:
      return { icon: <FiActivity size={16} />, color: '#64748B', bg: '#F8FAFC' };
  }
};

const formatFecha = (fechaStr) => {
  try {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return fechaStr;
  }
};

const Dashboard = () => {
  const { user } = useContext(AuthContext); // Extraemos el usuario para el mensaje dinámico
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      const response = await api.get('/dashboard');
      setDatos(response.data);
    } catch (error) {
      console.error("Error al cargar el dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !datos) {
    return <div style={{ padding: '20px' }}>Cargando resumen del día...</div>;
  }

  return (
    <div className="dashboard-container">
      
      {/* SECCIÓN DE BIENVENIDA */}
      <div className="welcome-section">
        <h1>¡Bienvenido de vuelta, {user?.nombre || 'Administrador'}!</h1>
        <p>Este es el resumen operativo de COMPUDOCTOR para el día de hoy.</p>
      </div>

      {/* KPIs DIARIOS */}
      <div className="daily-kpis">
        <div className="kpi-diario ingresos">
          <span className="kpi-diario-titulo"><FiDollarSign /> Ingreso Total Hoy</span>
          <span className="kpi-diario-valor">S/ {datos.hoy.ingreso_total.toFixed(2)}</span>
        </div>
        <div className="kpi-diario ventas">
          <span className="kpi-diario-titulo"><FiShoppingBag /> Ventas de Productos</span>
          <span className="kpi-diario-valor">{datos.hoy.ventas_count} trans.</span>
        </div>
        <div className="kpi-diario servicios">
          <span className="kpi-diario-titulo"><FiTool /> Equipos Ingresados</span>
          <span className="kpi-diario-valor">{datos.hoy.servicios_count} equipos</span>
        </div>
      </div>

      {/* CUERPO DEL DASHBOARD (Actividad + Semáforo) */}
      <div className="dashboard-grid">
        
        {/* PANEL IZQUIERDO: Actividad Reciente */}
        <div className="dashboard-card">
          <h3><FiActivity color="#3B82F6" /> Actividad Reciente</h3>
          <div className="actividad-lista">
            {datos.actividad_reciente.length > 0 ? (
              datos.actividad_reciente.map((item) => {
                const info = getModuloInfo(item.modulo);
                return (
                  <div 
                    key={item.id} 
                    className="actividad-item-modern"
                    style={{ borderLeftColor: info.color }}
                  >
                    <div className="actividad-item-icon" style={{ backgroundColor: info.bg }}>
                      {info.icon}
                    </div>
                    <div className="actividad-item-details">
                      <div className="actividad-meta">
                        <span className="actividad-usuario">
                          <FiUser style={{ marginRight: '4px' }} />
                          {item.nombre} {item.apellidos}
                        </span>
                        <span className="actividad-fecha">
                          <FiClock style={{ marginRight: '4px' }} />
                          {formatFecha(item.fecha)}
                        </span>
                      </div>
                      <div className="actividad-texto">{item.detalles}</div>
                      <div className="actividad-tags">
                        <span className="tag-modulo" style={{ color: info.color, backgroundColor: info.bg }}>
                          {item.modulo}
                        </span>
                        <span className={`tag-accion ${item.accion.toLowerCase()}`}>
                          {item.accion}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>
                Aún no hay actividades registradas en el sistema.
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: Semáforo de Inventario */}
        <div className="dashboard-card">
          <h3><FiAlertTriangle color="#F59E0B" /> Alertas de Stock</h3>
          <div className="semaforo-lista">
            {datos.alertas_stock.length > 0 ? (
              datos.alertas_stock.map((prod) => {
                const esAgotado = prod.stock === 0;
                const claseSemaforo = esAgotado ? 'semaforo-rojo' : 'semaforo-amarillo';
                const textoSemaforo = esAgotado ? 'Agotado' : 'Bajo';

                return (
                  <div key={prod.id} className="semaforo-item">
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>{prod.codigo_interno}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', display: '-webkit-box', WebkitLineClamp: 1, overflow: 'hidden' }}>
                        {prod.nombre}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{prod.stock} und.</span>
                      <span className={`semaforo-badge ${claseSemaforo}`}>{textoSemaforo}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: '#10B981', padding: '20px', fontWeight: '500' }}>
                ¡Todo en orden! No hay productos con stock crítico.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;