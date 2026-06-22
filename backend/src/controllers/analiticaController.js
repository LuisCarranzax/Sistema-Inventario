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

exports.obtenerReportePersonalizado = async (req, res) => {
    const { modulo, fecha_inicio, fecha_fin, categoria_id } = req.query;

    if (!modulo) {
        return res.status(400).json({ message: "Parámetro de módulo faltante." });
    }

    try {
        if (modulo === 'ventas') {
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
                    p.nombre AS producto_nombre,
                    p.precio_compra
                FROM ventas v
                LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
                LEFT JOIN productos p ON dv.producto_id = p.id
                WHERE v.es_proforma = FALSE
                  AND (? IS NULL OR ? = '' OR DATE(v.fecha_venta) >= ?)
                  AND (? IS NULL OR ? = '' OR DATE(v.fecha_venta) <= ?)
                ORDER BY v.fecha_venta ASC
            `;
            const [resultados] = await db.query(query, [
                fecha_inicio, fecha_inicio, fecha_inicio,
                fecha_fin, fecha_fin, fecha_fin
            ]);
            return res.json(resultados);
        }

        if (modulo === 'servicios') {
            const query = `
                SELECT st.*, u.nombre AS tecnico_nombre, u.apellidos AS tecnico_apellidos
                FROM servicios_tecnicos st
                LEFT JOIN usuarios u ON st.usuario_id = u.id
                WHERE (? IS NULL OR ? = '' OR DATE(st.fecha_ingreso) >= ?)
                  AND (? IS NULL OR ? = '' OR DATE(st.fecha_ingreso) <= ?)
                ORDER BY st.fecha_ingreso ASC
            `;
            const [resultados] = await db.query(query, [
                fecha_inicio, fecha_inicio, fecha_inicio,
                fecha_fin, fecha_fin, fecha_fin
            ]);
            return res.json(resultados);
        }

        if (modulo === 'inventario') {
            let query = `
                SELECT p.*, c.nombre AS categoria_nombre
                FROM productos p
                JOIN categorias c ON p.categoria_id = c.id
                WHERE 1=1
            `;
            const params = [];
            
            if (categoria_id && categoria_id !== 'todas') {
                query += ` AND p.categoria_id = ?`;
                params.push(categoria_id);
            }

            if (fecha_inicio && fecha_inicio !== '') {
                query += ` AND (DATE(p.fecha_abastecimiento) >= ? OR p.fecha_abastecimiento IS NULL)`;
                params.push(fecha_inicio);
            }

            if (fecha_fin && fecha_fin !== '') {
                query += ` AND (DATE(p.fecha_abastecimiento) <= ? OR p.fecha_abastecimiento IS NULL)`;
                params.push(fecha_fin);
            }

            query += ` ORDER BY p.nombre ASC`;
            
            const [resultados] = await db.query(query, params);
            return res.json(resultados);
        }

        return res.status(400).json({ message: "Módulo no soportado para reportes." });

    } catch (error) {
        console.error("Error al obtener reporte personalizado:", error);
        res.status(500).json({ message: "Error interno en el servidor", error: error.message });
    }
};