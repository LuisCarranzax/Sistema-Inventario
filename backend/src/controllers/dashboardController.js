const db = require('../config/db');

exports.obtenerDatosDashboard = async (req, res) => {
    try {
        const usuarioId = req.headers['x-usuario-id'] || 1;

        // Obtener rol de este usuario para filtrar la actividad
        const [[userRow]] = await db.query('SELECT rol FROM usuarios WHERE id = ?', [usuarioId]);
        const userRole = userRow ? userRow.rol : 'trabajador';

        // Ingresos y Ventas de HOY
        const queryVentasHoy = `
            SELECT 
                COUNT(id) as total_ventas,
                IFNULL(SUM(total), 0) as ingresos_ventas
            FROM ventas 
            WHERE DATE(fecha_venta) = CURDATE() AND es_proforma = FALSE
        `;

        // Ingresos y Servicios de HOY
        const queryServiciosHoy = `
            SELECT 
                COUNT(id) as total_servicios,
                IFNULL(SUM(precio), 0) as ingresos_servicios
            FROM servicios_tecnicos 
            WHERE DATE(fecha_ingreso) = CURDATE()
        `;

        // Semáforo de Stock (Solo productos en alerta: Rojo o Amarillo)
        const queryAlertasStock = `
            SELECT id, codigo_interno, nombre, stock, stock_minimo 
            FROM productos 
            WHERE stock <= (stock_minimo + 5) -- Muestra los que están por debajo o cerca del mínimo
            ORDER BY stock ASC 
            LIMIT 8
        `;

        // Actividad Reciente desde Auditoría
        let queryActividadReciente = '';
        let paramsActividad = [];

        if (userRole === 'administrador') {
            //El administrador ve toda la actividad
            queryActividadReciente = `
                SELECT a.*, u.nombre, u.apellidos 
                FROM auditoria a
                JOIN usuarios u ON a.usuario_id = u.id
                ORDER BY a.fecha DESC LIMIT 10
            `;
        } else {
            // El trabajador sólo ve su propia actividad
            queryActividadReciente = `
                SELECT a.*, u.nombre, u.apellidos 
                FROM auditoria a
                JOIN usuarios u ON a.usuario_id = u.id
                WHERE a.usuario_id = ?
                ORDER BY a.fecha DESC LIMIT 10
            `;
            paramsActividad = [usuarioId];
        }

        // Servicios pendientes de entrega (cuyo estado no es 'entregado')
        const queryPendientesEntrega = `
            SELECT COUNT(id) as total 
            FROM servicios_tecnicos 
            WHERE estado != 'entregado'
        `;

        // Servicios pendientes de pago (cuyo estado_pago no es 'cancelado')
        const queryPendientesPago = `
            SELECT COUNT(id) as total 
            FROM servicios_tecnicos 
            WHERE estado_pago != 'cancelado'
        `;

        const [[resVentas]] = await db.query(queryVentasHoy);
        const [[resServicios]] = await db.query(queryServiciosHoy);
        const [alertasStock] = await db.query(queryAlertasStock);
        const [actividad] = await db.query(queryActividadReciente, paramsActividad);
        const [[resPendientesEntrega]] = await db.query(queryPendientesEntrega);
        const [[resPendientesPago]] = await db.query(queryPendientesPago);

        res.json({
            hoy: {
                ventas_count: resVentas.total_ventas,
                ventas_ingresos: Number(resVentas.ingresos_ventas),
                servicios_count: resServicios.total_servicios,
                servicios_ingresos: Number(resServicios.ingresos_servicios),
                ingreso_total: Number(resVentas.ingresos_ventas) + Number(resServicios.ingresos_servicios)
            },
            actividad_reciente: actividad,
            alertas_stock: alertasStock,
            servicios_pendientes_entrega: resPendientesEntrega.total,
            servicios_pendientes_pago: resPendientesPago.total
        });

    } catch (error) {
        console.error("Error al cargar dashboard:", error);
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};