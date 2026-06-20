const db = require('../config/db');
const auditoriaService = require('../services/auditoriaService');

// Crear servicio (Ya lo tienes configurado desde tu formulario, pero lo pongo para tener todo centralizado)
exports.registrarServicio = async (req, res) => {
    const { 
        cliente_nombre, 
        equipo_dispositivo, 
        servicio_realizado, 
        precio, 
        usuario_id,
        estado_pago,
        monto_adelanto,
        metodo_pago,
        estado
    } = req.body;
    const finalUsuarioId = req.headers['x-usuario-id'] || usuario_id || 1; 

    try {
        const query = `
            INSERT INTO servicios_tecnicos 
            (cliente_nombre, equipo_dispositivo, servicio_realizado, precio, usuario_id, estado_pago, monto_adelanto, metodo_pago, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(query, [
            cliente_nombre, 
            equipo_dispositivo, 
            servicio_realizado, 
            precio, 
            finalUsuarioId,
            estado_pago || 'pendiente',
            monto_adelanto || 0,
            metodo_pago || 'Por definir',
            estado || 'en_revision'
        ]);
        await auditoriaService.registrarEvento(finalUsuarioId, 'REGISTRO', 'Servicios', `Servicio registrado para cliente: ${cliente_nombre} - Equipo: ${equipo_dispositivo}`);
        res.status(201).json({ message: "Servicio registrado exitosamente." });
    } catch (error) {
        res.status(500).json({ message: "Error al registrar servicio", error: error.message });
    }
};

// Listar todos los servicios (GET)
exports.obtenerServicios = async (req, res) => {
    try {
        const query = `SELECT * FROM servicios_tecnicos ORDER BY fecha_ingreso DESC`;
        const [servicios] = await db.query(query);
        res.json(servicios);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener servicios", error: error.message });
    }
};

// Actualizar el estado de un servicio (Ej: de 'en_revision' a 'reparado') (PUT)
exports.actualizarEstado = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    try {
        // Si el estado es 'entregado', le ponemos la fecha actual a fecha_entrega
        let query = `UPDATE servicios_tecnicos SET estado = ? WHERE id = ?`;
        let params = [estado, id];

        if (estado === 'entregado') {
            query = `UPDATE servicios_tecnicos SET estado = ?, fecha_entrega = CURRENT_TIMESTAMP WHERE id = ?`;
        }

        await db.query(query, params);
        res.json({ message: `Estado actualizado a ${estado}` });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar estado", error: error.message });
    }
};

// Actualizar el pago de un servicio (PUT)
exports.actualizarPago = async (req, res) => {
    const { id } = req.params;
    const { estado_pago, metodo_pago, monto_adelanto } = req.body;

    try {
        const query = `
            UPDATE servicios_tecnicos 
            SET estado_pago = ?, 
                metodo_pago = ?, 
                monto_adelanto = ? 
            WHERE id = ?
        `;
        await db.query(query, [estado_pago, metodo_pago, monto_adelanto || 0, id]);
        res.json({ message: "Cobro actualizado correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar pago", error: error.message });
    }
};

// Eliminar un servicio (DELETE)
exports.eliminarServicio = async (req, res) => {
    const { id } = req.params;
    try {
        const usuarioId = req.headers['x-usuario-id'] || 1;
        const [[servicio]] = await db.query('SELECT cliente_nombre, equipo_dispositivo FROM servicios_tecnicos WHERE id = ?', [id]);
        if (servicio) {
            await db.query('DELETE FROM servicios_tecnicos WHERE id = ?', [id]);
            await auditoriaService.registrarEvento(usuarioId, 'ELIMINACION', 'Servicios', `Servicio eliminado: Cliente ${servicio.cliente_nombre} - Equipo ${servicio.equipo_dispositivo}`);
            res.json({ message: "Servicio eliminado correctamente" });
        } else {
            res.status(404).json({ message: "Servicio no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar servicio", error: error.message });
    }
};