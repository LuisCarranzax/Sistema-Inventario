const db = require('../config/db');
const auditoriaService = require('../services/auditoriaService');
const bcrypt = require('bcryptjs');

// Obtener todos los trabajadores
exports.obtenerUsuarios = async (req, res) => {
    try {
        const [usuarios] = await db.query(
            'SELECT id, nombre, apellidos, correo, celular, rol, estado FROM usuarios WHERE rol != "administrador" ORDER BY id DESC'
        );
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener usuarios", error: error.message });
    }
};

// Cambiar estado de un trabajador (Aprobar, Rechazar, Suspender, Reactivar)
exports.cambiarEstadoUsuario = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // 'aprobado', 'rechazado', 'inactivo', etc.

    try {
        // 1. Obtener datos del usuario modificado para la auditoría
        const [[usuario]] = await db.query('SELECT nombre, apellidos, correo FROM usuarios WHERE id = ?', [id]);
        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // 2. Modificar el estado del usuario
        await db.query('UPDATE usuarios SET estado = ? WHERE id = ?', [estado, id]);

        // 3. Registrar en auditoría
        const adminId = req.headers['x-usuario-id'] || 1;
        let accionAuditoria = 'ACTUALIZACION';
        let detalleAuditoria = '';

        if (estado === 'aprobado') {
            accionAuditoria = 'APROBACION';
            detalleAuditoria = `Acceso de trabajador aprobado: ${usuario.nombre} ${usuario.apellidos} (${usuario.correo})`;
        } else if (estado === 'rechazado') {
            accionAuditoria = 'RECHAZO';
            detalleAuditoria = `Solicitud de acceso rechazada: ${usuario.nombre} ${usuario.apellidos} (${usuario.correo})`;
        } else if (estado === 'inactivo') {
            accionAuditoria = 'SUSPENSION';
            detalleAuditoria = `Acceso de trabajador suspendido: ${usuario.nombre} ${usuario.apellidos} (${usuario.correo})`;
        } else {
            detalleAuditoria = `Estado del usuario ${usuario.correo} cambiado a: ${estado}`;
        }

        await auditoriaService.registrarEvento(adminId, accionAuditoria, 'Usuarios', detalleAuditoria);

        let mensajeExito = `El usuario ha sido actualizado a ${estado} correctamente.`;
        if (estado === 'aprobado') mensajeExito = "El acceso del trabajador ha sido aprobado.";
        if (estado === 'rechazado') mensajeExito = "La solicitud del trabajador ha sido rechazada.";
        if (estado === 'inactivo') mensajeExito = "El acceso del trabajador ha sido suspendido.";

        res.json({ message: mensajeExito });
    } catch (error) {
        res.status(500).json({ message: "Error al cambiar estado del usuario", error: error.message });
    }
};

// Obtener el registro de eventos (Auditoría)
exports.obtenerAuditoria = async (req, res) => {
    try {
        const query = `
            SELECT a.*, u.nombre, u.apellidos 
            FROM auditoria a
            JOIN usuarios u ON a.usuario_id = u.id
            ORDER BY a.fecha DESC LIMIT 100
        `;
        const [logs] = await db.query(query);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: "Error al cargar el registro de eventos", error: error.message });
    }
};

// Registrar un nuevo trabajador (Administrador crea directamente)
exports.registrarTrabajador = async (req, res) => {
    const { nombre, apellidos, correo, celular, dni, password } = req.body;

    try {
        // Validar si el usuario ya existe por correo o DNI
        const [usuarioExistente] = await db.query(
            'SELECT id FROM usuarios WHERE correo = ? OR dni = ?', 
            [correo, dni]
        );

        if (usuarioExistente.length > 0) {
            return res.status(400).json({ message: "El correo o DNI ya se encuentra registrado." });
        }

        // Encriptación de la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear como aprobado
        const query = `
            INSERT INTO usuarios (nombre, apellidos, correo, celular, dni, password, estado) 
            VALUES (?, ?, ?, ?, ?, ?, 'aprobado')
        `;
        
        await db.query(query, [nombre, apellidos, correo, celular, dni, passwordHash]);

        // Registrar evento de auditoría
        const adminId = req.headers['x-usuario-id'] || 1;
        await auditoriaService.registrarEvento(adminId, 'REGISTRO', 'Usuarios', `Nuevo trabajador registrado: ${nombre} ${apellidos} (${correo})`);

        res.status(201).json({ 
            message: "Trabajador registrado exitosamente." 
        });

    } catch (error) {
        res.status(500).json({ message: "Error al registrar el trabajador", error: error.message });
    }
};