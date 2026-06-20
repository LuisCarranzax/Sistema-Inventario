import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UpdatePassword from './pages/auth/UpdatePassword';

// Importación de Páginas Privadas
import Dashboard from './pages/Dashboard';
import PuntoVenta from './pages/PuntoVenta';
import Inventario from './pages/Inventario';
import Servicios from './pages/Servicios';
import Analiticas from './pages/Analiticas';
import PerfilTrabajador from './pages/PerfilTrabajador';
import PanelAdmin from './pages/AdminPanel';

// IMPORTACIÓN DEL LAYOUT (La pieza que faltaba)
import Layout from './components/layout/Layout';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    // 1. AuthProvider debe envolver todo para que el Login funcione
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* =========================================
              RUTAS PÚBLICAS (Sin barra lateral)
              ========================================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          {/* =========================================
              RUTAS PRIVADAS (Enbueltas por el Layout)
              ========================================= */}
          {/* 2. El Layout actúa como el "Papá" de estas rutas */}
          <Route path="/" element={<Layout />}>

            {/* 'index' significa que el Dashboard se mostrará en la ruta base '/' */}
            <Route index element={<Dashboard />} />

            {/* Las demás páginas se mostrarán dentro del hueco que deja el Layout */}
            <Route path="punto-venta" element={<PuntoVenta />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="servicios" element={<Servicios />} />
            <Route path="analiticas" element={<Analiticas />} />
            <Route path="admin" element={<PanelAdmin />} />
            <Route path="perfil" element={<PerfilTrabajador />} />
          </Route>

          {/* Ruta por defecto (opcional): Si el usuario escribe una URL que no existe */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;