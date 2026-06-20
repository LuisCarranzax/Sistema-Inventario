const db = require('../config/db');

/**
 * Registra un evento en la tabla de auditoría.
 * @param {number} usuarioId - ID del usuario que realiza la acción
 * @param {string} accion - Tipo de acción ('REGISTRO', 'ELIMINACION', 'REABASTECIMIENTO', 'VENTA', etc.)
 * @param {string} modulo - Nombre del módulo ('Inventario', 'Servicios', 'Ventas', 'Categorías')
 * @param {string} detalles - Descripción detallada del evento
 */
exports.registrarEvento = async (usuarioId, accion, modulo, detalles) => {
    try {
        const query = `
            INSERT INTO auditoria (usuario_id, accion, modulo, detalles)
            VALUES (?, ?, ?, ?)
        `;
        await db.query(query, [usuarioId || 1, accion, modulo, detalles]);
    } catch (error) {
        console.error("Error al registrar evento de auditoría en la BD:", error);
    }
};
