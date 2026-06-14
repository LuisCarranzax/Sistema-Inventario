const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

router.post('/registrar', ventaController.registrarVenta);
router.get('/', ventaController.obtenerVentas);

module.exports = router;