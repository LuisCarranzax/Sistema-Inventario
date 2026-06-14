const db = require('../config/db');

exports.obtenerMetricasMensuales = async (req, res) => {
    try {
        // 1. Ganancias y Costos por Venta de Productos en el mes actual
        const queryProductos = `
            SELECT 
                IFNULL(SUM(dv.cantidad * dv.precio_unitario), 0) AS ingresos_productos,
                IFNULL(SUM(dv.cantidad * p.precio_compra), 0) AS costos_productos,
                IFNULL(SUM(dv.cantidad * (dv.precio_unitario - p.precio_compra)), 0) AS ganancia_neta_productos
            FROM detalle_ventas dv
            JOIN productos p ON dv.producto_id = p.id
            JOIN ventas v ON dv.venta_id = v.id
            WHERE v.es_proforma = FALSE 
              AND MONTH(v.fecha_venta) = MONTH(CURRENT_DATE())
              AND YEAR(v.fecha_venta) = YEAR(CURRENT_DATE())
        `;

        // 2. Ingresos por Servicios Técnicos del mes actual (aquí el ingreso es directo)
        const queryServicios = `
            SELECT 
                IFNULL(SUM(precio), 0) AS ingresos_servicios
            FROM servicios_tecnicos
            WHERE estado_pago IN ('cancelado', 'a_cuenta') -- Solo contamos dinero real ingresado
              AND MONTH(fecha_ingreso) = MONTH(CURRENT_DATE())
              AND YEAR(fecha_ingreso) = YEAR(CURRENT_DATE())
        `;

        const [[resProductos]] = await db.query(queryProductos);
        const [[resServicios]] = await db.query(queryServicios);

        const totalIngresos = Number(resProductos.ingresos_productos) + Number(resServicios.ingresos_servicios);
        const gananciaTotalNeta = Number(resProductos.ganancia_neta_productos) + Number(resServicios.ingresos_servicios);

        res.json({
            mes: new Date().toLocaleString('es-PE', { month: 'long' }),
            ingresos_productos: Number(resProductos.ingresos_productos),
            costos_productos: Number(resProductos.costos_productos),
            ganancia_productos: Number(resProductos.ganancia_neta_productos),
            ingresos_servicios: Number(resServicios.ingresos_servicios),
            total_ingresos_general: totalIngresos,
            ganancia_total_neta: gananciaTotalNeta
        });

    } catch (error) {
        console.error("Error al obtener analíticas:", error);
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};