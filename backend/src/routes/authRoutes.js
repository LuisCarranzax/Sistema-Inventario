const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para el registro inicial (queda en estado 'pendiente')
router.post('/register', authController.registrarUsuario);

// Ruta para el login (verificará si está 'aprobado')
router.post('/login', authController.loginUsuario);

module.exports = router;