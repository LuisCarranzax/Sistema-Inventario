import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import {FiSettings, FiLogOut, FiChevronDown, FiBell } from 'react-icons/fi';
import api from '../../services/api';
import '../../css/TopBar.css';



const Topbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificacionesCount, setNotificacionesCount] = useState(0);
  
  const [alertasStockList, setAlertasStockList] = useState([]);
  const [serviciosPendientesEntrega, setServiciosPendientesEntrega] = useState(0);
  const [serviciosPendientesPago, setServiciosPendientesPago] = useState(0);

  const [rawAlertCount, setRawAlertCount] = useState(0);
  const [limpiadoManualmente, setLimpiadoManualmente] = useState(false);

  // Referencias para cerrar menús al hacer clic afuera
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const clickAfuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickAfuera);
    return () => document.removeEventListener('mousedown', clickAfuera);
  }, []);

  useEffect(() => {
    const chequearAlertas = async () => {
      try {
        const response = await api.get('/dashboard');
        const listStock = response.data.alertas_stock || [];
        const countEntrega = response.data.servicios_pendientes_entrega || 0;
        const countPago = response.data.servicios_pendientes_pago || 0;
        const nuevoTotal = listStock.length + countEntrega + countPago;
        
        setRawAlertCount(prevRaw => {
          if (nuevoTotal !== prevRaw || !limpiadoManualmente) {
            setAlertasStockList(listStock);
            setServiciosPendientesEntrega(countEntrega);
            setServiciosPendientesPago(countPago);
            setNotificacionesCount(nuevoTotal);
            setLimpiadoManualmente(false);
          }
          return nuevoTotal;
        });
      } catch (error) {
        console.error("Error obteniendo notificaciones", error);
      }
    };
    chequearAlertas();
    
    // Verificar periódicamente cada 45 segundos
    const interval = setInterval(chequearAlertas, 45000);
    return () => clearInterval(interval);
  }, [limpiadoManualmente]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBellClick = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const handleStockItemClick = () => {
    setIsNotificationsOpen(false);
    navigate('/inventario');
  };

  const handleServicesClick = () => {
    setIsNotificationsOpen(false);
    navigate('/servicios');
  };

  const handleLimpiarNotificaciones = (e) => {
    e.stopPropagation();
    setAlertasStockList([]);
    setServiciosPendientesEntrega(0);
    setServiciosPendientesPago(0);
    setNotificacionesCount(0);
    setLimpiadoManualmente(true);
  };

  // Obtenemos la primera letra del nombre para el Avatar
  const inicial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U';

  return (
    <div className="topbar">
      {/* CAMPANA DE NOTIFICACIONES PROACTIVAS */}
      <div 
        ref={notificationsRef}
        style={{ marginRight: '25px', position: 'relative' }}
      >
        <div 
          onClick={handleBellClick}
          style={{ cursor: 'pointer' }}
          title="Alertas de Negocio"
        >
          <FiBell size={22} color="#64748B" />
          {notificacionesCount > 0 && (
            <span style={{ 
              position: 'absolute', top: '-5px', right: '-5px', 
              background: '#EF4444', color: 'white', 
              fontSize: '0.65rem', fontWeight: 'bold', 
              borderRadius: '50%', padding: '2px 6px' 
            }}>
              {notificacionesCount}
            </span>
          )}
        </div>

        {/* Dropdown de Notificaciones */}
        {isNotificationsOpen && (
          <div className="notifications-dropdown">
            <div className="notifications-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Notificaciones</span>
              {(alertasStockList.length > 0 || serviciosPendientesEntrega > 0 || serviciosPendientesPago > 0) && (
                <button 
                  onClick={handleLimpiarNotificaciones}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3B82F6',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                    outline: 'none'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="notifications-list">
              
              {alertasStockList.map(prod => (
                <div 
                  key={prod.id} 
                  className="notification-item"
                  onClick={handleStockItemClick}
                >
                  <span>⚠️</span>
                  <div>
                    <strong>Stock Bajo:</strong> {prod.nombre} ({prod.stock} und. restantes)
                  </div>
                </div>
              ))}

              {serviciosPendientesEntrega > 0 && (
                <div className="notification-item" onClick={handleServicesClick}>
                  <span>🔧</span>
                  <div>
                    <strong>Taller:</strong> {serviciosPendientesEntrega} servicios pendientes de entrega.
                  </div>
                </div>
              )}

              {serviciosPendientesPago > 0 && (
                <div className="notification-item" onClick={handleServicesClick}>
                  <span>💵</span>
                  <div>
                    <strong>Finanzas:</strong> {serviciosPendientesPago} servicios pendientes de pago.
                  </div>
                </div>
              )}

              {alertasStockList.length === 0 && serviciosPendientesEntrega === 0 && serviciosPendientesPago === 0 && (
                <div className="notification-item empty">
                  🎉 Todo al día. ¡Buen trabajo!
                </div>
              )}

            </div>
          </div>
        )}
      </div>
      <div className="user-menu-container" ref={menuRef}>
        
        {/* BOTÓN / BURBUJA DEL USUARIO */}
        <button 
          className="user-profile-btn" 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="user-avatar">
            {inicial}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.nombre || 'Usuario'} {user?.apellidos || ''} </span>
            <span className="user-role">{user?.rol || 'Trabajador'}</span>
          </div>
          <FiChevronDown color="#64748B" style={{ marginLeft: '5px' }} />
        </button>

        {/* MENÚ DESPLEGABLE */}
        {isDropdownOpen && (
          <div className="dropdown-menu">
            
            {/* Opción: Mi Perfil */}
            <Link 
              to="/perfil" 
              className="dropdown-item" 
              onClick={() => setIsDropdownOpen(false)}
            >
              <FiSettings size={18} />
              Configurar Mi Perfil
            </Link>
            
            {/* Opción: Cerrar Sesión */}
            <button className="dropdown-item logout" onClick={handleLogout}>
              <FiLogOut size={18} />
              Cerrar Sesión
            </button>
            
          </div>
        )}
        
      </div>
    </div>
  );
};

export default Topbar;