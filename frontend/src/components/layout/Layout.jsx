import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar'; // IMPORTAMOS EL TOPBAR
import './Layout.css';

const Layout = () => {
  return (
    <div className="app-layout">
      {/* 1. Lado Izquierdo: La Barra Lateral */}
      <Sidebar />
      
      {/* 2. Lado Derecho: Contenedor para el Topbar y el Contenido */}
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Barra Superior */}
        <Topbar />

        {/* Contenido Dinámico (Aquí se inyecta el Dashboard o Inventario) */}
        <main className="main-content">
          <Outlet /> 
        </main>
        
      </div>
    </div>
  );
};

export default Layout;