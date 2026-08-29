import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiKey } from 'react-icons/fi';
import './Register.css';
import api from '../../services/api';

const UpdatePassword = () => {
  const location = useLocation();
  const [step, setStep] = useState(1); // 1: Correo, 2: Código OTP, 3: Nueva Contraseña
  const [email, setEmail] = useState(location.state?.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmNewPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);
  

  // PASO 1: Enviar Correo y pedir código
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!email) return setAlert({ type: 'error', message: 'Ingresa tu correo.' });

    try {
      // Lógica backend: Buscar usuario y enviar correo con código generado
      const response = await api.post('/auth/forgot-password', { email: email.trim() });

      setAlert({ type: 'success', message: response.data.message });
      setStep(2);
    } catch (error) {
      // AHORA SÍ LEEMOS EL ERROR REAL DEL BACKEND
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || 'Error interno del servidor. Revisa la consola del backend.' 
      });
    }
  };

  // PASO 2: Verificar Código OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpCode.length < 6) return setAlert({ type: 'error', message: 'Ingresa el código completo.' });

    try {
      // Lógica backend: Verificar que el código coincida y no haya expirado
      await api.post('/auth/verify-otp', { email, otpCode });
      setAlert(null);
      setStep(3);
    } catch (error) {
      setAlert({ type: 'error', message: 'Código inválido o expirado.' });
    }
  };

  // PASO 3: Actualizar Contraseña
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      return setAlert({ type: 'error', message: 'Las contraseñas no coinciden.' });
    }

    try {
      // Lógica backend: Actualizar password en BD
      await api.post('/auth/reset-password', { email, otpCode, newPassword: passwords.newPassword });
      setAlert({ type: 'success', message: '¡Contraseña actualizada con éxito!' });
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Error al actualizar contraseña.' });
    }
  };

  return (
    <div className="auth-page-container view-transition">
      <div className="auth-split-panel">
        <div className="auth-form-side">
          <div className="auth-form-content">
            <h1 className="welcome-text">Recuperar Acceso</h1>
            <p className="subtitle-text">
              {step === 1 && "Ingresa tu correo para recibir un código de seguridad"}
              {step === 2 && "Ingresa el código de 6 dígitos enviado a tu correo"}
              {step === 3 && "Establece tu nueva credencial de seguridad"}
            </p>
            
            {alert && (
               <div className={`custom-alert ${alert.type}`}>
                 {alert.type === 'error' ? <FiAlertCircle size={20} /> : <FiCheckCircle size={20} />}
                 <span>{alert.message}</span>
               </div>
            )}
            
            {/* RENDERIZADO DEL PASO 1 (Correo) */}
            {step === 1 && (
              <form onSubmit={handleVerifyEmail} className="auth-form-visual view-transition" noValidate>
                <div className="input-group-modern">
                  <FiMail className="input-icon" />
                  <input type="email" placeholder="Correo de la cuenta" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <button type="submit" className="btn-modern-auth">Enviar Código</button>
              </form>
            )}

            {/* RENDERIZADO DEL PASO 2 (Código OTP) */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="auth-form-visual view-transition" noValidate>
                <div className="input-group-modern">
                  <FiKey className="input-icon" />
                  <input type="text" placeholder="Código de 6 dígitos" maxLength="6" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
                </div>
                <button type="submit" className="btn-modern-auth">Verificar Código</button>
              </form>
            )}

            {/* RENDERIZADO DEL PASO 3 (Nueva Contraseña) */}
            {step === 3 && (
              <form onSubmit={handleUpdatePassword} className="auth-form-visual view-transition" noValidate>
                <div className="input-group-modern">
                  <FiLock className="input-icon" />
                  <input 
                    type={passwords.showNewPassword ? "text" : "password"} 
                    placeholder="Nueva Contraseña" 
                    value={passwords.newPassword} 
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} 
                  />
                  <button type="button" className="toggle-pass-btn" onClick={() => setPasswords({...passwords, showNewPassword: !passwords.showNewPassword})}>
                    {passwords.showNewPassword ? <FiEye /> : <FiEyeOff />}
                  </button>
                </div>
                <div className="input-group-modern">
                  <FiLock className="input-icon" />
                  <input 
                    type={passwords.showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirmar Nueva Contraseña" 
                    value={passwords.confirmNewPassword} 
                    onChange={(e) => setPasswords({...passwords, confirmNewPassword: e.target.value})} 
                  />
                  <button type="button" className="toggle-pass-btn" onClick={() => setPasswords({...passwords, showConfirmPassword: !passwords.showConfirmPassword})}>
                    {passwords.showConfirmPassword ? <FiEye /> : <FiEyeOff />}
                  </button>
                </div>
                <button type="submit" className="btn-modern-auth">Guardar Cambios</button>
              </form>
            )}
            {/* ... */}
          </div>
        </div>
        {/* ... (Tu Lado Visual se mantiene igual) ... */}
      </div>
    </div>
  );
};

export default UpdatePassword;