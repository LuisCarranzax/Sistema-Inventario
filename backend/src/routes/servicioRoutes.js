const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');

router.post('/registrar', servicioController.registrarServicio);
router.get('/', servicioController.obtenerServicios);
router.put('/:id/estado', servicioController.actualizarEstado);
router.put('/:id/pago', servicioController.actualizarPago);
router.delete('/:id', servicioController.eliminarServicio);

module.exports = router;