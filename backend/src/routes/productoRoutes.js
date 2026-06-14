const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// Ruta para crear producto: POST /api/productos
router.post('/registrar', productoController.registrarProducto);

router.get('/', productoController.obtenerProductos);
router.delete('/:id', productoController.eliminarProducto);
router.put('/:id', productoController.actualizarProducto);
router.put('/:id/reabastecer', productoController.reabastecerProducto);

module.exports = router;

