import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { FiUser, FiLock, FiMail } from 'react-icons/fi';
import './PerfilTrabajador.css';

const PerfilTrabajador = () => {
  const { user, login, logout } = useContext(AuthContext); 
  const navigate = useNavigate();
  
  const [correoOriginal, setCorreoOriginal] = useState('');
  const [datosPerfil, setDatosPerfil] = useState({
    nombre: user?.nombre || '', 
    apellidos: '',
    correo: '', 
    celular: '',
    password_actual: ''
  });

  // Estados para la validación del nuevo correo
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    if (user?.id) {
      cargarPerfil();
    }
  }, [user]);

  const cargarPerfil = async () => {
    try {
      const response = await api.get(`/usuarios/${user.id}/perfil`);
      const { nombre, apellidos, correo, celular } = response.data;
      setDatosPerfil({
        nombre: nombre || '',
        apellidos: apellidos || '',
        correo: correo || '',
        celular: celular || '',
        password_actual: ''
      });
      setCorreoOriginal(correo || '');
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    }
  };

  const handlePerfilChange = (e) => setDatosPerfil({ ...datosPerfil, [e.target.name]: e.target.value });

  const guardarPerfil = async (e) => {
    e.preventDefault();
    if (!datosPerfil.password_actual) return alert("⚠️ Ingresa tu contraseña actual para guardar.");

    // Alerta de advertencia si intenta cambiar el correo
    if (datosPerfil.correo !== correoOriginal) {
      const confirmar = window.confirm("⚠️ Si cambia su correo deberá volver a iniciar sesión. ¿Desea continuar?");
      if (!confirmar) return;
    }

    try {
      const response = await api.put(`/usuarios/${user.id}/perfil`, datosPerfil);
      
      // Si el backend detectó un cambio de correo, activamos el paso 2 (OTP)
      if (response.data.requiresEmailVerification) {
        setRequiresVerification(true);
        alert("📧 " + response.data.message + "\nRevisa la bandeja de entrada de tu nuevo correo.");
      } else {
        alert("✅ Perfil actualizado correctamente.");
        login({ ...user, nombre: datosPerfil.nombre, apellidos: datosPerfil.apellidos });
        setCorreoOriginal(datosPerfil.correo);
        setDatosPerfil({ ...datosPerfil, password_actual: '' });
      }
    } catch (error) {
      alert(`❌ Error: ${error.response?.data?.message || 'Error al actualizar perfil'}`);
    }
  };

  const verificarNuevoCorreo = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/usuarios/${user.id}/confirmar-correo`, { codigo: otpCode });
      
      // CAMBIO DE CORREO EXITOSO: FORZAMOS EL CIERRE DE SESIÓN
      alert("✅ Correo actualizado con éxito.\nPor motivos de seguridad, debes volver a iniciar sesión con tu nuevo correo.");
      logout();
      navigate('/login');
      
    } catch (error) {
      alert(`❌ Error: ${error.response?.data?.message || 'Código incorrecto'}`);
    }
  };

  return (
    <div className="perfil-container">
      <h1>Panel de Usuario</h1>
      <p style={{ color: '#64748B' }}>Gestiona tu cuenta y edita tus datos personales.</p>

      <div className="perfil-grid">
        
        {/* PANEL DE AJUSTES DE CUENTA */}
        <div className="ajustes-card">
          
          {/* RENDERIZADO CONDICIONAL: Formulario normal vs Input de Código OTP */}
          {!requiresVerification ? (
            <form className="ajustes-section" onSubmit={guardarPerfil}>
              <h3><FiUser /> Información Personal</h3>
              
              <div className="form-grid-2">
                <div className="input-group-auth"><label>Nombre</label><input type="text" name="nombre" value={datosPerfil.nombre} onChange={handlePerfilChange} required /></div>
                <div className="input-group-auth"><label>Apellidos</label><input type="text" name="apellidos" value={datosPerfil.apellidos} onChange={handlePerfilChange} required /></div>
                <div className="input-group-auth"><label>Correo Electrónico</label><input type="email" name="correo" value={datosPerfil.correo} onChange={handlePerfilChange} required /></div>
                <div className="input-group-auth"><label>Celular</label><input type="text" name="celular" value={datosPerfil.celular} onChange={handlePerfilChange} required /></div>
              </div>

              <div className="password-warning">
                <FiLock style={{ marginRight: '5px' }} />
                Para guardar cambios, ingresa tu contraseña actual.
              </div>
              
              <div className="input-group-auth" style={{ width: '100%', maxWidth: '300px' }}>
                <input type="password" name="password_actual" placeholder="Contraseña actual..." value={datosPerfil.password_actual} onChange={handlePerfilChange} required />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn-seguridad">Actualizar Datos</button>
                <button 
                  type="button" 
                  className="btn-password-update" 
                  onClick={() => navigate('/update-password', { state: { email: datosPerfil.correo } })}
                >
                  <FiLock style={{ marginRight: '5px' }} /> Actualizar Contraseña
                </button>
              </div>
            </form>
          ) : (
            <form className="ajustes-section" onSubmit={verificarNuevoCorreo}>
              <h3 style={{ color: '#2563EB' }}><FiMail /> Verifica tu Nuevo Correo</h3>
              <p style={{ color: '#475569', marginBottom: '20px', fontSize: '0.9rem' }}>
                Hemos enviado un código de 6 dígitos a <strong>{datosPerfil.correo}</strong>.
                Además, hemos enviado una alerta de seguridad a tu correo anterior.
              </p>

              <div className="input-group-auth" style={{ width: '100%', maxWidth: '300px' }}>
                <label>Código de Seguridad</label>
                <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Ej: 123456" maxLength="6" required style={{ fontSize: '1.2rem', letterSpacing: '2px', textAlign: 'center' }}/>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-filtro" onClick={() => setRequiresVerification(false)}>Cancelar</button>
                <button type="submit" className="btn-seguridad">Confirmar Nuevo Correo</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default PerfilTrabajador;