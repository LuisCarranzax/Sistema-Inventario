const db = require('../config/db');


// Función para listar productos (GET)
exports.obtenerProductos = async (req, res) => {
    try {
        // Usamos un JOIN para traer el nombre de la categoría en lugar del número
        const query = `
            SELECT p.*, c.nombre AS categoria_nombre 
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            ORDER BY p.id DESC
        `;
        
        const [productos] = await db.query(query);
        res.json(productos);
    } catch (error) {
        console.error("Error al obtener inventario:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};
exports.registrarProducto = async (req, res) => {
    const { 
        nombre, 
        precio_compra, 
        precio_venta, 
        stock, 
        stock_minimo, 
        categoria, // El nombre en texto que llega del select de React (Ej: 'Mouse')
        detalles_tecnicos 
    } = req.body;

    try {
        // 1. Buscar el ID y el prefijo de la categoría en la base de datos
        const [categoriasDb] = await db.query(
            'SELECT id, prefijo_codigo FROM categorias WHERE nombre = ?', 
            [categoria]
        );

        if (categoriasDb.length === 0) {
            return res.status(404).json({ 
                message: `La categoría '${categoria}' no existe en la base de datos. Asegúrate de registrarla primero.` 
            });
        }

        const categoriaId = categoriasDb[0].id;
        const prefijo = categoriasDb[0].prefijo_codigo;

        // 2. Generar el código interno dinámico (Ej: MOU-001)
        // Contamos cuántos productos existen en esta categoría específica
        const [conteo] = await db.query(
            'SELECT COUNT(*) as total FROM productos WHERE categoria_id = ?', 
            [categoriaId]
        );
        
        // Sumamos 1 al total y usamos padStart para asegurar el formato 001, 002...
        const numeroSiguiente = conteo[0].total + 1;
        const codigoInterno = `${prefijo}-${numeroSiguiente.toString().padStart(3, '0')}`;

        // 3. Convertir el objeto dinámico a un string JSON para MySQL
        const detallesJSON = JSON.stringify(detalles_tecnicos || {});

        // 4. Inserción en la base de datos
        // Asignamos automáticamente la fecha de hoy a fecha_abastecimiento
        const query = `
            INSERT INTO productos 
            (codigo_interno, nombre, precio_compra, precio_venta, stock, stock_minimo, categoria_id, detalles_tecnicos, fecha_abastecimiento) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
        `;

        await db.query(query, [
            codigoInterno, 
            nombre, 
            precio_compra, 
            precio_venta, 
            stock, 
            stock_minimo, 
            categoriaId, 
            detallesJSON
        ]);

        res.status(201).json({ 
            message: "Producto registrado exitosamente.",
            codigo: codigoInterno
        });

    } catch (error) {
        console.error("Error al guardar producto:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

exports.eliminarProducto = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM productos WHERE id = ?', [id]);
        res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el producto", error: error.message });
    }
};
// Función para actualizar un producto existente (Modo Edición)
exports.actualizarProducto = async (req, res) => {
    const { id } = req.params;
    const { 
        nombre, 
        precio_compra, 
        precio_venta, 
        stock, 
        stock_minimo, 
        categoria, 
        detalles_tecnicos 
    } = req.body;

    try {
        // 1. Buscamos el ID de la nueva categoría seleccionada
        const [categoriasDb] = await db.query(
            'SELECT id FROM categorias WHERE nombre = ?', 
            [categoria]
        );

        if (categoriasDb.length === 0) {
            return res.status(404).json({ message: "La categoría no existe." });
        }

        const categoriaId = categoriasDb[0].id;
        const detallesJSON = JSON.stringify(detalles_tecnicos || {});

        // 2. Actualizamos el producto en MySQL
        const query = `
            UPDATE productos 
            SET nombre = ?, 
                precio_compra = ?, 
                precio_venta = ?, 
                stock = ?, 
                stock_minimo = ?, 
                categoria_id = ?, 
                detalles_tecnicos = ?
            WHERE id = ?
        `;

        await db.query(query, [
            nombre, 
            precio_compra, 
            precio_venta, 
            stock, 
            stock_minimo, 
            categoriaId, 
            detallesJSON, 
            id
        ]);

        res.json({ message: "Producto actualizado correctamente." });

    } catch (error) {
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};