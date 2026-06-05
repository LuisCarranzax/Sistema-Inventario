import React, { useContext } from 'react';
import { FiBell, FiUser } from 'react-icons/fi';
import { AuthContext } from '../../context/authContext';

const Topbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: '15px 30px',
      backgroundColor: 'white',
      borderBottom: '1px solid #E2E8F0',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Icono de notificaciones */}
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748B' }}>
          <FiBell />
        </button>

        {/* Perfil de usuario */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #E2E8F0', paddingLeft: '20px' }}>
          <div style={{ 
            width: '35px', height: '35px', borderRadius: '50%', 
            backgroundColor: '#2563EB', color: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
          }}>
            <FiUser />
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1E293B' }}>
            {user?.nombre || 'Administrador'}
          </span>
        </div>
      </div>

    </header>
  );
};

export default Topbar;