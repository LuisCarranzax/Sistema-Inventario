import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { FiMenu, 
  FiHome, 
  FiBox, 
  FiShoppingCart, 
  FiTrendingUp, 
  FiLogOut, 
  FiTool } 
from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import './Layout.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false); // Estado para pantallas pequeñas [cite: 424, 446]
  const { user, logout } = useContext(AuthContext); // Extraemos usuario y función de cierre 

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      
      <div className="sidebar-header">
        {/* Logo referencial  */}
        {!isCollapsed && <span className="brand-title">COMPUDOCTOR</span>}
        <button onClick={toggleSidebar} className="toggle-btn">
          <FiMenu />
        </button>
      </div>

      {/* Saludo dinámico [cite: 426, 445] */}
      <div className="user-greeting">
        {!isCollapsed && <span>Hola, {user?.nombre || 'Usuario'}</span>}
      </div>

      <nav className="nav-menu">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} end>
          <FiHome className="nav-icon" />
          <span className="nav-text">Dashboard</span>
        </NavLink>

        <NavLink to="/inventario" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <FiBox className="nav-icon" />
          <span className="nav-text">Inventario</span>
        </NavLink>

        <NavLink to="/servicios" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <FiTool className="nav-icon" />
          <span className="nav-text">Servicio Técnico</span>
        </NavLink>

        <NavLink to="/punto-venta" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <FiShoppingCart className="nav-icon" />
          <span className="nav-text">Punto de Venta</span>
        </NavLink>

        <NavLink to="/analiticas" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
          <FiTrendingUp className="nav-icon" />
          <span className="nav-text">Analíticas</span>
        </NavLink>  
      </nav>

      {/* Botón de cierre de sesión al final */}
      <div className="nav-menu" style={{ flexGrow: 0, marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="nav-item" onClick={logout} style={{ cursor: 'pointer' }}>
          <FiLogOut className="nav-icon" />
          <span className="nav-text">Cerrar Sesión</span>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;