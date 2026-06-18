const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Obtener resumen de caja del día para el trabajador
router.get('/:id/caja', usuarioController.obtenerMiCaja);

// Obtener datos del perfil del usuario
router.get('/:id/perfil', usuarioController.obtenerPerfil);

// Actualizar datos del perfil
router.put('/:id/perfil', usuarioController.actualizarPerfil);

// Confirmar cambio de correo electrónico (OTP verification)
router.put('/:id/confirmar-correo', usuarioController.confirmarCambioCorreo);

module.exports = router;
