const express = require('express');
const router = express.Router();
const analiticaController = require('../controllers/analiticaController');

router.get('/metrics/monthly', analiticaController.obtenerMetricasMensuales);
router.get('/mensual', analiticaController.obtenerMetricasMensuales);
router.get('/reporte-personalizado', analiticaController.obtenerReportePersonalizado);

module.exports = router;