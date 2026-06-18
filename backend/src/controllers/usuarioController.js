const db = require('../config/db');
const bcrypt = require('bcryptjs'); // Asegúrate de tener instalado bcryptjs
const emailService = require('../services/emailServices')
// 1. Obtener el resumen del día ("Mi Caja") para un trabajador específico
exports.obtenerMiCaja = async (req, res) => {
    const { id } = req.params;

    try {
        // Ventas realizadas por este usuario HOY
        const queryVentas = `
            SELECT COUNT(id) AS total_ventas, IFNULL(SUM(total), 0) AS ingresos_ventas 
            FROM ventas 
            WHERE usuario_id = ? AND DATE(fecha_venta) = CURDATE() AND es_proforma = FALSE
        `;
        
        // Servicios registrados por este usuario HOY
        const queryServicios = `
            SELECT COUNT(id) AS total_servicios 
            FROM servicios_tecnicos 
            WHERE usuario_id = ? AND DATE(fecha_ingreso) = CURDATE()
        `;

        const [[resVentas]] = await db.query(queryVentas, [id]);
        const [[resServicios]] = await db.query(queryServicios, [id]);

        res.json({
            ventas_hoy: resVentas.total_ventas,
            ingresos_hoy: Number(resVentas.ingresos_ventas),
            servicios_hoy: resServicios.total_servicios
        });

    } catch (error) {
        res.status(500).json({ message: "Error al obtener Mi Caja", error: error.message });
    }
};

exports.actualizarPerfil = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellidos, correo, celular, password_actual } = req.body;

    try {
        const [[usuario]] = await db.query('SELECT correo, password FROM usuarios WHERE id = ?', [id]);
        
        const passwordValida = await bcrypt.compare(password_actual, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({ message: "La contraseña actual es incorrecta." });
        }

        // SI EL USUARIO QUIERE CAMBIAR SU CORREO
        if (correo !== usuario.correo) {
            // Verificar que el nuevo correo no esté en uso por otra persona
            const [[existeCorreo]] = await db.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
            if (existeCorreo) return res.status(400).json({ message: "El nuevo correo ya está en uso." });

            // Generamos código OTP
            const codigoOTP = Math.floor(100000 + Math.random() * 900000).toString();

            // Guardamos el código y el correo temporal en la BD
            await db.query(
                `UPDATE usuarios SET nombre = ?, apellidos = ?, celular = ?, 
                 nuevo_correo_temp = ?, codigo_recuperacion = ?, expira_codigo = (NOW() + INTERVAL 15 MINUTE) 
                 WHERE id = ?`,
                [nombre, apellidos, celular, correo, codigoOTP, id]
            );

            // Disparamos los correos
            await emailService.enviarAlertaSeguridad(usuario.correo, nombre);
            await emailService.enviarOTPCambioCorreo(correo, nombre, codigoOTP);

            return res.json({ 
                requiresEmailVerification: true, 
                message: "Se requiere verificación de correo." 
            });
        }

        // SI NO CAMBIÓ EL CORREO, SOLO ACTUALIZAMOS DATOS BÁSICOS
        await db.query(
            'UPDATE usuarios SET nombre = ?, apellidos = ?, celular = ? WHERE id = ?',
            [nombre, apellidos, celular, id]
        );

        res.json({ message: "Perfil actualizado correctamente." });

    } catch (error) {
        res.status(500).json({ message: "Error al actualizar perfil", error: error.message });
    }
};

// NUEVA FUNCIÓN: Verificar el código y aplicar el cambio de correo
exports.confirmarCambioCorreo = async (req, res) => {
    const { id } = req.params;
    const { codigo } = req.body;

    try {
        const [[usuario]] = await db.query('SELECT codigo_recuperacion, expira_codigo, nuevo_correo_temp FROM usuarios WHERE id = ?', [id]);

        if (!usuario || usuario.codigo_recuperacion !== codigo) {
            return res.status(400).json({ message: "El código es inválido." });
        }

        if (new Date() > new Date(usuario.expira_codigo)) {
            return res.status(400).json({ message: "El código ha expirado." });
        }

        // Si el código es correcto, aplicamos el cambio final
        await db.query(
            `UPDATE usuarios SET correo = nuevo_correo_temp, 
             nuevo_correo_temp = NULL, codigo_recuperacion = NULL, expira_codigo = NULL 
             WHERE id = ?`, [id]
        );

        res.json({ message: "Correo actualizado con éxito." });
    } catch (error) {
        res.status(500).json({ message: "Error al confirmar correo", error: error.message });
    }
};

// Obtener datos del perfil del usuario por ID
exports.obtenerPerfil = async (req, res) => {
    const { id } = req.params;

    try {
        const [[usuario]] = await db.query(
            'SELECT id, nombre, apellidos, correo, celular, dni, rol FROM usuarios WHERE id = ?',
            [id]
        );

        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el perfil", error: error.message });
    }
};

