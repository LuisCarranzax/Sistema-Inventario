const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para el registro inicial (queda en estado 'pendiente')
router.post('/register', authController.registrarUsuario);

// Ruta para el login (verificará si está 'aprobado')
router.post('/login', authController.loginUsuario);

// ... tus rutas de register y login actuales

// Nuevas rutas (Usamos GET porque los clics en correos electrónicos siempre son peticiones GET)
router.get('/aprobar/:id', authController.aprobarUsuario);
router.get('/rechazar/:id', authController.rechazarUsuario);

// Rutas para recuperación de contraseña
router.post('/forgot-password', authController.solicitarRecuperacion);
router.post('/verify-otp', authController.verificarOTP);
router.post('/reset-password', authController.restablecerPassword);

module.exports = router;