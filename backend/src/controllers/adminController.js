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

// Cambiar estado de un trabajador (Suspender / Reactivar)
exports.cambiarEstadoUsuario = async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // 'aprobado' o 'inactivo'

    try {
        await db.query('UPDATE usuarios SET estado = ? WHERE id = ?', [estado, id]);
        res.json({ message: `El usuario ha sido ${estado === 'inactivo' ? 'suspendido' : 'reactivado'} correctamente.` });
    } catch (error) {
        res.status(500).json({ message: "Error al cambiar estado", error: error.message });
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