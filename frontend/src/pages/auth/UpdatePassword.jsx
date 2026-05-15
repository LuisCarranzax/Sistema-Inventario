import React, { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiKey } from 'react-icons/fi';
import '../../css/auth/Register.css';

const UpdatePassword = () => {
  const [step, setStep] = useState(1); // 1: Correo, 2: Código OTP, 3: Nueva Contraseña
  const [email, setEmail] = useState('');
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
      // await api.post('/auth/forgot-password', { email });
      setAlert({ type: 'success', message: 'Código enviado a tu correo.' });
      setStep(2);
    } catch (error) {
      setAlert({ type: 'error', message: 'No existe una cuenta con este correo.' });
    }
  };

  // PASO 2: Verificar Código OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpCode.length < 6) return setAlert({ type: 'error', message: 'Ingresa el código completo.' });

    try {
      // Lógica backend: Verificar que el código coincida y no haya expirado
      // await api.post('/auth/verify-otp', { email, otpCode });
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
      // await api.post('/auth/reset-password', { email, otpCode, newPassword: passwords.newPassword });
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
                {/* ... (Tus inputs de contraseña actuales se mantienen aquí) ... */}
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