import React, { useContext, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { AuthContext } from '../../context/AuthContext';
import './Layout.css';
import Chatbot from '../chatbot/Chatbot';

const Layout = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#64748B' }}>
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return null; // El useEffect se encargará de redirigir
  }

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
      <Chatbot />
    </div>
  );
};

export default Layout;