import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FiUser, FiSettings, FiLogOut, FiChevronDown, FiShield } from 'react-icons/fi';
import '../../css/TopBar.css';



const Topbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Referencia para cerrar el menú si se hace clic afuera
  const menuRef = useRef(null);

  // Efecto para cerrar el dropdown si el usuario hace clic en otra parte de la pantalla
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Obtenemos la primera letra del nombre para el Avatar
  const inicial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U';

  return (
    <div className="topbar">
      
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

            {/* Opciones extra si es Administrador */}
            {/*user?.rol === 'administrador' &&  (
              <Link 
                to="/admin" 
                className="dropdown-item" 
                onClick={() => setIsDropdownOpen(false)}
              >
                <FiShield size={18} />
                Panel de Admin
              </Link>
            )*/}
            
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