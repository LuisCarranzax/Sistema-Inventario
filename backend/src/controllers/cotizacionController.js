const db = require('../config/db');

exports.crearCotizacion = async (req, res) => {
    const { cliente, items, validez_dias, total, usuario_id } = req.body;
    
    // Iniciamos la transacción porque guardaremos en 3 tablas distintas
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. GESTIÓN DEL CLIENTE
        let clienteId;
        
        // Si el frontend nos manda un ID, el cliente ya existe
        if (cliente.id) {
            clienteId = cliente.id;
        } else {
            const nombreCliente = cliente.nombre || cliente.nombre_completo || 'Cliente General';
            const telefonoCliente = cliente.celular || cliente.telefono || '';
            
            // Si no existe, lo creamos al vuelo
            const [clientResult] = await connection.query(
                `INSERT INTO clientes (nombre_completo, tipo_cliente, documento, representante_legal, telefono, direccion) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [nombreCliente, cliente.tipo_cliente, cliente.documento, cliente.representante_legal, telefonoCliente, cliente.direccion]
            );
            clienteId = clientResult.insertId;
        }

        // 2. CREAR LA CABECERA DE LA COTIZACIÓN
        const [cotizacionResult] = await connection.query(
            `INSERT INTO cotizaciones (cliente_id, usuario_id, validez_dias, total) 
             VALUES (?, ?, ?, ?)`,
            [clienteId, usuario_id, validez_dias || 15, total]
        );
        const cotizacionId = cotizacionResult.insertId;

        // 3. INSERTAR EL DESGLOSE DE ÍTEMS (Productos y Servicios)
        const detallesPromises = items.map(item => {
            return connection.query(
                `INSERT INTO detalle_cotizaciones (cotizacion_id, tipo_item, producto_id, descripcion, cantidad, precio_unitario) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    cotizacionId, 
                    item.tipo_item, 
                    item.producto_id || null, 
                    item.descripcion, 
                    item.cantidad, 
                    item.precio_unitario
                ]
            );
        });
        
        // Esperamos a que todos los ítems se guarden
        await Promise.all(detallesPromises);

        // Si todo salió perfecto, confirmamos los cambios
        await connection.commit();
        
        res.status(201).json({ 
            message: 'Cotización formal generada con éxito.', 
            cotizacionId: cotizacionId 
        });

    } catch (error) {
        // Si ocurre un error, revertimos todo para no dejar datos huérfanos
        await connection.rollback();
        console.error("Error al generar cotización:", error);
        res.status(500).json({ message: 'Error interno al generar la cotización', error: error.message });
    } finally {
        connection.release();
    }
};

exports.obtenerCotizaciones = async (req, res) => {
    try {
        const query = `
            SELECT c.id, c.fecha_emision, c.total, c.estado, cl.nombre_completo AS cliente_nombre, cl.tipo_cliente 
            FROM cotizaciones c
            JOIN clientes cl ON c.cliente_id = cl.id
            ORDER BY c.fecha_emision DESC
        `;
        const [cotizaciones] = await db.query(query);
        res.json(cotizaciones);
    } catch (error) {
        console.error("Error al obtener cotizaciones:", error);
        res.status(500).json({ message: "Error al obtener cotizaciones", error: error.message });
    }
};