const db = require('../config/db');

module.exports = async (req, res, next) => {
    // Si la ruta es de autenticación, la dejamos pasar
    // req.path puede venir sin /api si se monta a nivel de router o con /api a nivel de app
    if (req.path.includes('/auth') || req.path === '/') {
        return next();
    }

    const usuarioId = req.headers['x-usuario-id'];
    if (!usuarioId) {
        return next(); // Si no hay cabecera, dejamos que el controlador maneje la falta de auth
    }

    try {
        const [usuarios] = await db.query('SELECT estado FROM usuarios WHERE id = ?', [usuarioId]);
        const usuario = usuarios[0];

        // Si la cuenta no está aprobada (está inactiva, rechazada o pendiente)
        if (usuario && usuario.estado !== 'aprobado') {
            let msg = '';
            if (usuario.estado === 'inactivo') {
                const [[adminUser]] = await db.query('SELECT celular FROM usuarios WHERE rol = "administrador" LIMIT 1');
                const adminCelular = adminUser ? adminUser.celular : '';
                msg = adminCelular 
                    ? `Su cuenta ha sido suspendida. Por favor, contacte con el administrador al celular: ${adminCelular}.`
                    : "Su cuenta ha sido suspendida. Por favor, contacte con el administrador.";
            } else if (usuario.estado === 'pendiente') {
                msg = "Su cuenta aún espera la aprobación del administrador.";
            } else if (usuario.estado === 'rechazado') {
                msg = "Su solicitud de acceso fue rechazada.";
            } else {
                msg = "Acceso denegado.";
            }

            return res.status(403).json({ 
                message: msg, 
                cuentaSuspendida: true 
            });
        }

        next();
    } catch (error) {
        console.error("Error en middleware de verificación de estado:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
