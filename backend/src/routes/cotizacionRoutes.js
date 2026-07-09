const express = require('express');
const router = express.Router();
const cotizacionController = require('../controllers/cotizacionController');

router.post('/', cotizacionController.crearCotizacion);
router.get('/', cotizacionController.obtenerCotizaciones);

module.exports = router;