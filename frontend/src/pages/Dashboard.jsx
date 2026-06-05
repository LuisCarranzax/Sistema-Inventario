import React, { useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { FiTrendingUp, FiDollarSign, FiPackage, FiCheckCircle, FiClock, FiAlertTriangle } from 'react-icons/fi';
import '../css/Dashboard.css';

const Dashboard = () => {
  // Extraemos el usuario autenticado para el saludo
  const { user } = useContext(AuthContext);

  // DATOS DE PRUEBA (Mocks) para visualizar el esqueleto antes de conectar la BD
  const resumenMes = {
    ventas: 145,
    ingresos: "S/ 4,250.00",
    topProducto: "Cargador Tipo C - 20W"
  };

  const inventarioStatus = {
    alto: 150, // Productos con buen stock
    medio: 32, // Productos por llegar al límite
    bajo: 8    // Productos que necesitan abastecimiento urgente
  };

  return (
    <div className="dashboard-container">
      
      {/* 1. Mensaje de Bienvenida Dinámico */}
      <header className="welcome-header">
        {/* Si el usuario no tiene nombre registrado aún, usamos "Juan" como fallback */}
        <h1>Bienvenido de vuelta, {user?.nombre || 'Juan'}</h1>
        <p>Aquí tienes el resumen general de COMPUDOCTOR para este mes.</p>
      </header>

      {/* 2. Resumen General del Mes */}
      <section className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon">
            <FiTrendingUp />
          </div>
          <div className="summary-info">
            <h3>Ventas del Mes</h3>
            <p>{resumenMes.ventas}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <FiDollarSign />
          </div>
          <div className="summary-info">
            <h3>Ingresos Totales</h3>
            <p>{resumenMes.ingresos}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <FiPackage />
          </div>
          <div className="summary-info">
            <h3>Producto más vendido</h3>
            <p style={{ fontSize: '1.1rem' }}>{resumenMes.topProducto}</p>
          </div>
        </div>
      </section>

      {/* 3. Indicadores Visuales (Semáforo de Inventario) */}
      <section className="inventory-status-section">
        <h2>Estado de Inventario (Semáforo)</h2>
        <div className="traffic-light-grid">
          
          <div className="status-item status-high">
            <div className="status-header">
              <FiCheckCircle color="var(--status-high)" size={24} />
              <span>Stock Óptimo</span>
            </div>
            <div className="status-count" style={{ color: 'var(--status-high)' }}>
              {inventarioStatus.alto}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '5px' }}>Productos bien abastecidos</p>
          </div>

          <div className="status-item status-medium">
            <div className="status-header">
              <FiClock color="var(--status-medium)" size={24} />
              <span>Stock Medio</span>
            </div>
            <div className="status-count" style={{ color: 'var(--status-medium)' }}>
              {inventarioStatus.medio}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '5px' }}>Acercándose al límite mínimo</p>
          </div>

          <div className="status-item status-low">
            <div className="status-header">
              <FiAlertTriangle color="var(--status-low)" size={24} />
              <span>Stock Crítico</span>
            </div>
            <div className="status-count" style={{ color: 'var(--status-low)' }}>
              {inventarioStatus.bajo}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '5px' }}>Requieren abastecimiento urgente</p>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Dashboard;