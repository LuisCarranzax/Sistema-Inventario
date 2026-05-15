import React, { useState, useContext } from 'react';
import { FiMail, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Nuestra conexión a Axios
import { AuthContext } from '../../context/authContext';
import '../../css/auth/Login.css'; 

const Login = () => {
  const [credentials, setCredentials] = useState({ correo: '', password: '' });
  const [alert, setAlert] = useState(null); 
  const { login } = useContext(AuthContext); // Extraemos la función del contexto
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setAlert(null); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.correo || !credentials.password) {
      setAlert({ type: 'error', message: 'Por favor, completa todos los campos.' });
      return;
    }

    try {
      // Petición real al backend
      const response = await api.post('/auth/login', credentials);
      
      setAlert({ type: 'success', message: response.data.message });
      
      // Guardamos la sesión globalmente
      login(response.data.user);
      
      // Redirigimos al Dashboard
      setTimeout(() => navigate('/'), 1500);

    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Error al conectar con el servidor' });
    }
  };

  return (
    <div className="auth-page-container view-transition">
      <div className="auth-split-panel">
        <div className="auth-form-side">
          <div className="auth-form-content">
            <h1 className="welcome-text">¡Bienvenido de nuevo!</h1>
            <p className="subtitle-text">Ingresa tus credenciales para acceder</p>
            
            {alert && (
              <div className={`custom-alert ${alert.type}`}>
                {alert.type === 'error' ? <FiAlertCircle size={20} /> : <FiCheckCircle size={20} />}
                <span>{alert.message}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="auth-form-visual" noValidate>
              <div className="input-group-modern">
                <FiMail className="input-icon" />
                <input type="email" name="correo" placeholder="tu@correo.com" onChange={handleChange} />
              </div>
              
              <div className="input-group-modern">
                <FiLock className="input-icon" />
                <input type="password" name="password" placeholder="Tu contraseña secreta" onChange={handleChange} />
              </div>
              <div className="auth-redirect">
                ¿Olvidaste tu contraseña? <Link to='/update-password'>Actualizar contraseña</Link>
              </div>
              <button type="submit" className="btn-modern-auth">Entrar al Sistema</button>
              
              <div className="auth-redirect">
                ¿No tienes cuenta? <Link to='/register'>Regístrate aquí</Link> 
              </div>
            </form>
          </div>
        </div>

        <div className="auth-visual-side">
          <div className="branding-content">
            <div className="logo-placeholder">NS</div>
            <h2 className="brand-name">Nova Salud</h2>
            <p className="brand-slogan">Automatiza tus ventas, optimiza tu negocio y olvida el cuaderno.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;