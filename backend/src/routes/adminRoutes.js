const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Obtener lista de trabajadores
router.get('/usuarios', adminController.obtenerUsuarios);

// Registrar trabajador directamente como aprobado
router.post('/usuarios', adminController.registrarTrabajador);

// Modificar estado de acceso (suspender/reactivar)
router.put('/usuarios/:id/estado', adminController.cambiarEstadoUsuario);

// Obtener logs de auditoría
router.get('/auditoria', adminController.obtenerAuditoria);

module.exports = router;
