const db = require('../config/db');


// Función para listar productos (GET)
exports.obtenerProductos = async (req, res) => {
    try {
        // Usamos un JOIN para traer el nombre de la categoría en lugar del número
        const query = `
            SELECT p.*, c.nombre AS categoria_nombre,
                   IFNULL(SUM(CASE WHEN mi.tipo_movimiento = 'ingreso' AND MONTH(mi.fecha_movimiento) = MONTH(CURRENT_DATE()) AND YEAR(mi.fecha_movimiento) = YEAR(CURRENT_DATE()) THEN mi.cantidad ELSE 0 END), 0) AS cantidad_ingresada
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            LEFT JOIN movimientos_inventario mi ON p.id = mi.producto_id
            GROUP BY p.id, c.nombre
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
        categoria, 
        detalles_tecnicos,
        fecha_abastecimiento
    } = req.body;
    const connection = await db.getConnection();
    try {
        // Buscar el ID y el prefijo de la categoría en la base de datos
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

        // Generar el código interno dinámico (Ej: MOU-001)
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
        await connection.beginTransaction();

        // 1. Guardar en la tabla productos (tu código actual)
        const queryProducto = `
            INSERT INTO productos 
            (codigo_interno, nombre, precio_compra, precio_venta, stock, stock_minimo, categoria_id, detalles_tecnicos, fecha_abastecimiento) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [resultProducto] = await connection.query(queryProducto, [
            codigoInterno, nombre, precio_compra, precio_venta, stock, stock_minimo, categoriaId, detallesJSON, fecha_abastecimiento || null
        ]);

        const nuevoProductoId = resultProducto.insertId;

        // 2. NUEVO: Registrar el ingreso en la bitácora inmutable
        const queryMovimiento = `
            INSERT INTO movimientos_inventario (producto_id, tipo_movimiento, cantidad) 
            VALUES (?, 'ingreso', ?)
        `;
        await connection.query(queryMovimiento, [nuevoProductoId, stock]);

        await connection.commit();
        res.status(201).json({ message: "Producto registrado exitosamente.", codigo: codigoInterno });

    } catch (error) {
        await connection.rollback();
        console.error("Error al guardar producto:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    } finally {
        connection.release();
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
    await db.query(
        'INSERT INTO auditoria (usuario_id, accion, modulo, detalles) VALUES (?, ?, ?, ?)',
        [req.user.id, 'ELIMINACIÓN DE PRODUCTO', 'Inventario', `Eliminó el producto con ID ${id}`]
    );
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
        detalles_tecnicos,
        fecha_abastecimiento
    } = req.body;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Buscamos el ID de la nueva categoría seleccionada
        const [categoriasDb] = await connection.query(
            'SELECT id FROM categorias WHERE nombre = ?', 
            [categoria]
        );

        if (categoriasDb.length === 0) {
            connection.release();
            return res.status(404).json({ message: "La categoría no existe." });
        }

        const categoriaId = categoriasDb[0].id;
        const detallesJSON = JSON.stringify(detalles_tecnicos || {});

        // 1.5 Obtener stock anterior para registrar la bitácora
        const [productoAnterior] = await connection.query('SELECT stock FROM productos WHERE id = ?', [id]);
        const stockAnterior = productoAnterior[0]?.stock || 0;
        const diferencia = Number(stock) - Number(stockAnterior);

        // 2. Actualizamos el producto en MySQL
        const query = `
            UPDATE productos 
            SET nombre = ?, 
                precio_compra = ?, 
                precio_venta = ?, 
                stock = ?, 
                stock_minimo = ?, 
                categoria_id = ?, 
                detalles_tecnicos = ?,
                fecha_abastecimiento = ?
            WHERE id = ?
        `;

        await connection.query(query, [
            nombre, 
            precio_compra, 
            precio_venta, 
            stock, 
            stock_minimo, 
            categoriaId, 
            detallesJSON, 
            fecha_abastecimiento || null,
            id
        ]);

        // 3. Registrar el movimiento si hubo variación de stock
        if (diferencia !== 0) {
            const tipoMov = diferencia > 0 ? 'ingreso' : 'salida';
            const cantMov = Math.abs(diferencia);
            await connection.query(
                `INSERT INTO movimientos_inventario (producto_id, tipo_movimiento, cantidad) 
                 VALUES (?, ?, ?)`,
                [id, tipoMov, cantMov]
            );
        }

        await connection.commit();
        res.json({ message: "Producto actualizado correctamente." });

    } catch (error) {
        await connection.rollback();
        console.error("Error al actualizar producto:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    } finally {
        connection.release();
    }
};

// 1. Función para inyectar stock (Transacción SQL)
exports.reabastecerProducto = async (req, res) => {
    const { id } = req.params;
    const { cantidad, precio_compra } = req.body;
    
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // A. Sumar al stock y actualizar el precio de compra (si el proveedor lo subió)
        let updateQuery = 'UPDATE productos SET stock = stock + ?';
        let queryParams = [cantidad];
        
        if (precio_compra) {
            updateQuery += ', precio_compra = ?';
            queryParams.push(precio_compra);
        }
        updateQuery += ' WHERE id = ?';
        queryParams.push(id);
        
        await connection.query(updateQuery, queryParams);

        // B. Guardar el registro inmutable en el Kardex
        await connection.query(
            'INSERT INTO movimientos_inventario (producto_id, tipo_movimiento, cantidad) VALUES (?, "ingreso", ?)',
            [id, cantidad]
        );

        await connection.commit();
        res.json({ message: 'Stock reabastecido y registrado en el historial correctamente.' });

    } catch (error) {
        await connection.rollback();
        console.error("Error al reabastecer:", error);
        res.status(500).json({ message: 'Error al reabastecer el producto' });
    } finally {
        connection.release();
    }
};

// 2. Función para obtener el historial de ingresos (Para el PDF)
exports.obtenerHistorialAbastecimientos = async (req, res) => {
    try {
        const query = `
            SELECT m.id, m.cantidad, m.fecha_movimiento, p.codigo_interno, p.nombre, p.precio_compra
            FROM movimientos_inventario m
            JOIN productos p ON m.producto_id = p.id
            WHERE m.tipo_movimiento = 'ingreso'
            ORDER BY m.fecha_movimiento DESC
        `;
        const [historial] = await db.query(query);
        res.json(historial);
    } catch (error) {
        res.status(500).json({ message: 'Error al cargar el historial' });
    }
};