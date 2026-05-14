const db = require('../config/db');

exports.crearProducto = async (req, res) => {
    const { nombre, precio_venta, stock, stock_minimo, categoria_id, fecha_abastecimiento } = req.body;

    try {
        // 1. Obtener el prefijo de la categoría (ej: 'COMP')
        const [categoria] = await db.query('SELECT prefijo_codigo FROM categorias WHERE id = ?', [categoria_id]);
        
        if (categoria.length === 0) return res.status(404).json({ msg: "Categoría no encontrada" });
        const prefijo = categoria[0].prefijo_codigo;

        // 2. Contar cuántos productos hay en esa categoría para el correlativo
        const [conteo] = await db.query('SELECT COUNT(*) as total FROM productos WHERE categoria_id = ?', [categoria_id]);
        const correlativo = (conteo[0].total + 1).toString().padStart(3, '0'); // Ej: 001, 002

        const codigo_interno = `${prefijo}-${correlativo}`;

        // 3. Insertar el nuevo producto [cite: 10-18]
        const query = `INSERT INTO productos (codigo_interno, nombre, precio_venta, stock, stock_minimo, categoria_id, fecha_abastecimiento) 
                       VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        await db.query(query, [codigo_interno, nombre, precio_venta, stock, stock_minimo, categoria_id, fecha_abastecimiento]);

        res.status(201).json({ msg: "Producto registrado", codigo: codigo_interno });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};