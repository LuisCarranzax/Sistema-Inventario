import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/authContext';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCreditCard, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiAlertCircle, 
  FiCheckCircle 
} from 'react-icons/fi';
import { evaluatePasswordStrength } from '../../utils/passwordValidator';
import { Link } from 'react-router-dom';
import '../../css/auth/Register.css'; // Mantenemos el CSS que ya configuramos con transiciones y alertas

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '', 
    apellidos: '', 
    correo: '', 
    celular: '', 
    dni: '', 
    password: '', 
    confirmPassword: ''
  });
  
  const [strength, setStrength] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null); // Estado para las alertas personalizadas
  const [isPendingApproval, setIsPendingApproval] = useState(false);  
  const [isLoading, setIsLoading] = useState(false); // NUEVO ESTADO
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setAlert(null); // Limpiamos la alerta en cuanto el usuario empieza a escribir de nuevo

    if (name === 'password') {
      setStrength(evaluatePasswordStrength(value));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validación de campos vacíos
    const hasEmptyFields = Object.values(formData).some(value => value.trim() === '');
    if (hasEmptyFields) {
      setAlert({ type: 'error', message: 'Por favor, completa todos los campos del formulario.' });
      return;
    }

    // 2. Validación de contraseñas
    if (formData.password !== formData.confirmPassword) {
      setAlert({ type: 'error', message: 'Las contraseñas no coinciden. Inténtalo de nuevo.' });
      return;
    }

    try {
      setIsLoading(true); // 1. Desactivamos el botón
      
      await api.post('/auth/register', formData);
      
      setIsPendingApproval(true);

    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Hubo un problema al crear la cuenta' });
    } finally {
      setIsLoading(false); // 2. Volvemos a activar el botón pase lo que pase
    }
  };

  return (
    <>
    <div className={`auth-page-container view-transition ${isPendingApproval ? 'blurred-background' : ''}`}>
      <div className="auth-split-panel">
        
        {/* Lado Formulario */}
        <div className="auth-form-side">
          <div className="auth-form-content">
            <h1 className="welcome-text">Crear Cuenta</h1>
            <p className="subtitle-text">Completa tus datos para empezar a gestionar</p>
            
            {/* Renderizado Condicional de la Alerta */}
            {alert && (
              <div className={`custom-alert ${alert.type}`}>
                {alert.type === 'error' ? <FiAlertCircle size={20} /> : <FiCheckCircle size={20} />}
                <span>{alert.message}</span>
              </div>
            )}
            
            {/* Agregamos noValidate para desactivar los tooltips feos del navegador */}
            <form onSubmit={handleSubmit} className="auth-form-visual" noValidate>
              
              <div className="form-row-duo">
                <div className="input-group-modern">
                  <FiUser className="input-icon" />
                  <input type="text" name="nombre" placeholder="Nombre" onChange={handleChange} required />
                </div>
                <div className="input-group-modern">
                  <FiUser className="input-icon" />
                  <input type="text" name="apellidos" placeholder="Apellidos" onChange={handleChange} required />
                </div>
              </div>

              <div className="input-group-modern">
                <FiMail className="input-icon" />
                <input type="email" name="correo" placeholder="Correo Electrónico" onChange={handleChange} required />
              </div>

              <div className="form-row-duo">
                <div className="input-group-modern">
                  <FiPhone className="input-icon" />
                  <input type="text" name="celular" placeholder="Celular" onChange={handleChange} required maxLength="9"/>
                </div>
                <div className="input-group-modern">
                  <FiCreditCard className="input-icon" />
                  <input type="text" name="dni" placeholder="DNI" onChange={handleChange} required maxLength="8"/>
                </div>
              </div>

              {/* Campo Contraseña con Toggle */}
              <div className="input-group-modern">
                <FiLock className="input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  placeholder="Contraseña" 
                  onChange={handleChange} 
                  required 
                />
                <button type="button" className="toggle-password-btn" onClick={togglePasswordVisibility}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* Medidor de Fuerza */}
              {strength && (
                <div className="strength-meter">
                  <div className="meter-bar" style={{ width: strength.width, backgroundColor: strength.color }}></div>
                  <span>Seguridad: {strength.label}</span>
                </div>
              )}

              <div className="input-group-modern">
                <FiLock className="input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  placeholder="Confirmar Contraseña" 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                className="btn-modern-auth" 
                disabled={isLoading} // Se desactiva si está cargando
                style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
              >
                {isLoading ? 'Enviando solicitud...' : 'Registrarse'}
              </button>              
              <div className="auth-redirect">
                ¿Ya tienes cuenta? <Link to='/login'>Inicia Sesión</Link>
              </div>
            </form>
          </div>
        </div>

        {/* Lado Visual */}
        <div className="auth-visual-side">
          <div className="branding-content">
            <div className="logo-placeholder">SG</div>
            <h2 className="brand-name">Únete al Sistema</h2>
            <p className="brand-slogan">Lleva el control exacto de tu inventario y servicios sin complicaciones.</p>
          </div>
        </div>

      </div>
    </div>
    {isPendingApproval && (
        <div className="modal-overlay">
          <div className="modal-content-success">
            <FiCheckCircle size={50} color="#4CAF50" />
            <h2>Solicitud Enviada</h2>
            <p>
              Su solicitud de registro se encuentra en espera de aceptación por parte del administrador. 
              Recibirá un correo electrónico una vez que su cuenta sea revisada.
            </p>
            <button className="btn-modern-auth" onClick={() => navigate('/login')}>
              Volver al Inicio
            </button>
          </div>
        </div>
      )};
    </>
  );
};

export default Register;