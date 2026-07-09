import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { FiMenu, 
  FiHome, 
  FiBox, 
  FiShoppingCart, 
  FiTrendingUp, 
  FiLogOut, 
  FiTool, 
  FiUser,
  FiFileText,
  FiPenTool} 
from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import './Layout.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false); // Estado para pantallas pequeñas [cite: 424, 446]
  const { user, logout } = useContext(AuthContext); // Extraemos usuario y función de cierre 

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navConfig = {
    trabajador: [
      { to: "/", label: "Dashboard", icon: FiHome },
      { to: "/inventario", label: "Inventario", icon: FiBox },
      { to: "/servicios", label: "Servicio Técnico", icon: FiTool },
      { to: "/punto-venta", label: "Punto de Venta", icon: FiShoppingCart },
      { to: "/historial-ventas", label: "Historial de Ventas", icon: FiFileText },
      { to: "/cotizaciones", label: "Cotizaciones", icon: FiPenTool },
      { to: "/analiticas", label: "Analíticas", icon: FiTrendingUp }
    ],
    administrador: [
      { to: "/", label: "Dashboard", icon: FiHome },
      { to: "/inventario", label: "Inventario", icon: FiBox },
      { to: "/servicios", label: "Servicio Técnico", icon: FiTool },
      { to: "/punto-venta", label: "Punto de Venta", icon: FiShoppingCart },
      { to: "/historial-ventas", label: "Historial de Ventas", icon: FiFileText },
      { to: "/cotizaciones", label: "Cotizaciones", icon: FiPenTool },
      { to: "/analiticas", label: "Analíticas", icon: FiTrendingUp },
      { to: "/admin", label: "Panel Admin", icon: FiUser }
    ]
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

      {/* Saludo dinámico [cite: 426, 445] 
      <div className="user-greeting">
        {!isCollapsed && <span>Hola, {user?.nombre || 'Usuario'} </span>}
      </div>*/}

      

      <nav className="nav-menu">
        {Object.entries(navConfig[user.rol]).map(([key, item]) => (
          <NavLink key={key} to={item.to} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <item.icon className="nav-icon" />
            <span className="nav-text">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Botón de cierre de sesión al final 
      <div className="nav-menu" style={{ flexGrow: 0, marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="nav-item" onClick={logout} style={{ cursor: 'pointer' }}>
          <FiLogOut className="nav-icon" />
          <span className="nav-text">Cerrar Sesión</span>
        </div>
      </div>
      */}

    </aside>
  );
};

export default Sidebar;