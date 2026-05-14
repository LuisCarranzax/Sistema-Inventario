const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// Ruta para crear producto: POST /api/productos
router.post('/', productoController.crearProducto);

// Ruta para listar todos (útil para la tabla de inventario) [cite: 8]
router.get('/', async (req, res) => {
    try {
        const [productos] = await require('../config/db').query('SELECT * FROM productos');
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;