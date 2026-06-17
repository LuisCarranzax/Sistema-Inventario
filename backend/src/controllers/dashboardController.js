const db = require('../config/db');

exports.obtenerDatosDashboard = async (req, res) => {
    try {
        // 1. Ingresos y Ventas de HOY
        const queryVentasHoy = `
            SELECT 
                COUNT(id) as total_ventas,
                IFNULL(SUM(total), 0) as ingresos_ventas
            FROM ventas 
            WHERE DATE(fecha_venta) = CURDATE() AND es_proforma = FALSE
        `;

        // 2. Ingresos y Servicios de HOY
        const queryServiciosHoy = `
            SELECT 
                COUNT(id) as total_servicios,
                IFNULL(SUM(precio), 0) as ingresos_servicios
            FROM servicios_tecnicos 
            WHERE DATE(fecha_ingreso) = CURDATE()
        `;

        // 3. Actividad Reciente (Últimas 5 operaciones mezcladas simuladas, aquí traemos ventas recientes)
        const queryActividadReciente = `
            SELECT id, cliente_nombre, total as monto, fecha_venta as fecha, 'Venta' as tipo 
            FROM ventas 
            WHERE DATE(fecha_venta) = CURDATE() AND es_proforma = FALSE
            ORDER BY fecha_venta DESC LIMIT 5
        `;

        // 4. Semáforo de Stock (Solo productos en alerta: Rojo o Amarillo)
        const queryAlertasStock = `
            SELECT id, codigo_interno, nombre, stock, stock_minimo 
            FROM productos 
            WHERE stock <= (stock_minimo + 5) -- Muestra los que están por debajo o cerca del mínimo
            ORDER BY stock ASC 
            LIMIT 8
        `;

        const [[resVentas]] = await db.query(queryVentasHoy);
        const [[resServicios]] = await db.query(queryServiciosHoy);
        const [actividad] = await db.query(queryActividadReciente);
        const [alertasStock] = await db.query(queryAlertasStock);

        res.json({
            hoy: {
                ventas_count: resVentas.total_ventas,
                ventas_ingresos: Number(resVentas.ingresos_ventas),
                servicios_count: resServicios.total_servicios,
                servicios_ingresos: Number(resServicios.ingresos_servicios),
                ingreso_total: Number(resVentas.ingresos_ventas) + Number(resServicios.ingresos_servicios)
            },
            actividad_reciente: actividad,
            alertas_stock: alertasStock
        });

    } catch (error) {
        console.error("Error al cargar dashboard:", error);
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};