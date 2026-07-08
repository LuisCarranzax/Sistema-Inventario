const db = require('../config/db');
const auditoriaService = require('../services/auditoriaService');

exports.registrarVenta = async (req, res) => {
    const { carrito, total, metodo_pago, es_proforma, cliente_nombre } = req.body;
    
    // Por ahora usamos un ID estático hasta conectar el AuthContext completo
    const usuario_id = req.headers['x-usuario-id'] || 1; 

    // Iniciamos una conexión para la Transacción
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction(); // <-- Inicia la magia de seguridad

        // 1. Insertar el recibo general en la tabla 'ventas'
        const [ventaResult] = await connection.query(
            `INSERT INTO ventas (usuario_id, cliente_nombre, medio_pago, es_proforma, total) 
             VALUES (?, ?, ?, ?, ?)`,
            [usuario_id, cliente_nombre || 'Cliente General', metodo_pago, es_proforma, total]
        );
        
        const ventaId = ventaResult.insertId;

        // 2. Recorrer el carrito para insertar los detalles y descontar el stock
        for (let item of carrito) {
            const subtotal = item.precio_venta * item.cantidad;

            // Guardar en 'detalle_ventas'
            await connection.query(
                `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
                 VALUES (?, ?, ?, ?, ?)`,
                [ventaId, item.id, item.cantidad, item.precio_venta, subtotal]
            );

            // 3. Descontar el stock (SOLO si NO es proforma)
            if (!es_proforma) {
                await connection.query(
                    `UPDATE productos SET stock = stock - ? WHERE id = ?`,
                    [item.cantidad, item.id]
                );

                // Registrar el movimiento de salida en movimientos_inventario
                await connection.query(
                    `INSERT INTO movimientos_inventario (producto_id, tipo_movimiento, cantidad) 
                     VALUES (?, 'salida', ?)`,
                    [item.id, item.cantidad]
                );
            }
        }

        await connection.commit(); // <-- Si todo salió bien, guardamos definitivamente

        const detallesVenta = es_proforma
            ? `Proforma generada para ${cliente_nombre || 'Cliente General'}. Total: S/ ${total}`
            : `Venta registrada para ${cliente_nombre || 'Cliente General'}. Total: S/ ${total} (${metodo_pago})`;
        await auditoriaService.registrarEvento(
            usuario_id, 
            es_proforma ? 'PROFORMA' : 'VENTA', 
            'Ventas', 
            detallesVenta
        );

        res.status(201).json({ 
            message: es_proforma ? "Proforma generada correctamente" : "Venta registrada con éxito",
            ventaId: ventaId 
        });

    } catch (error) {
        await connection.rollback(); // <-- Si hubo un error, deshacemos todo para evitar datos corruptos
        console.error("Error en la transacción de venta:", error);
        res.status(500).json({ message: "Error al procesar la venta", error: error.message });
    } finally {
        connection.release(); // Liberamos la conexión
    }
};

exports.obtenerVentas = async (req, res) => {
    try {
        const query = `
            SELECT 
                v.id AS venta_id,
                v.cliente_nombre,
                v.medio_pago,
                v.es_proforma,
                v.total,
                v.fecha_venta,
                dv.cantidad,
                dv.precio_unitario,
                dv.subtotal,
                p.nombre AS producto_nombre
            FROM ventas v
            LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
            LEFT JOIN productos p ON dv.producto_id = p.id
            WHERE v.es_proforma = FALSE
              AND MONTH(v.fecha_venta) = MONTH(CURRENT_DATE())
              AND YEAR(v.fecha_venta) = YEAR(CURRENT_DATE())
            ORDER BY v.id DESC
        `;
        const [ventas] = await db.query(query);
        res.json(ventas);
    } catch (error) {
        console.error("Error al obtener ventas:", error);
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

exports.obtenerHistorialVentas = async (req, res) => {
    try {
        // Traemos las ventas ordenadas por fecha incluyendo cliente_nombre
        const query = `
            SELECT id, cliente_nombre, medio_pago, es_proforma, total, fecha_venta 
            FROM ventas 
            ORDER BY fecha_venta DESC
        `;
        const [ventas] = await db.query(query);
        res.json(ventas);
    } catch (error) {
        console.error("Error al obtener historial de ventas:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

exports.obtenerDetalleVenta = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Obtener los datos de la venta general
        const [ventas] = await db.query(
            `SELECT id, cliente_nombre, medio_pago, es_proforma, total, fecha_venta 
             FROM ventas WHERE id = ?`, [id]
        );
        
        if (ventas.length === 0) {
            return res.status(404).json({ message: "Venta no encontrada" });
        }
        
        const venta = ventas[0];

        // 2. Obtener los detalles de los productos vendidos
        const [detalles] = await db.query(
            `SELECT dv.cantidad, dv.precio_unitario, dv.subtotal, p.nombre, p.codigo_interno
             FROM detalle_ventas dv
             JOIN productos p ON dv.producto_id = p.id
             WHERE dv.venta_id = ?`, [id]
        );

        res.json({
            ...venta,
            productos: detalles
        });
    } catch (error) {
        console.error("Error al obtener detalle de venta:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};