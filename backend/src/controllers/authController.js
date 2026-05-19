const emailService = require('../services/emailServices');
const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.registrarUsuario = async (req, res) => {
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

        // Encriptación de seguridad
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Inserción con estado 'pendiente' por defecto
        const query = `
            INSERT INTO usuarios (nombre, apellidos, correo, celular, dni, password, estado) 
            VALUES (?, ?, ?, ?, ?, ?, 'pendiente')
        `;
        
        const [result] = await db.query(query, [nombre, apellidos, correo, celular, dni, passwordHash]);
        
        const usuarioParaCorreo = { id: result.insertId, ...req.body };
        await emailService.notificarAdminNuevoRegistro(usuarioParaCorreo);

        res.status(201).json({ 
            message: "Registro exitoso. Su cuenta está pendiente de aprobación." 
        });

    } catch (error) {
        res.status(500).json({ message: "Error al registrar el usuario", error: error.message });
    }
};

exports.loginUsuario = async (req, res) => {
    const { correo, password } = req.body;

    try {
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        const usuario = usuarios[0];

        if (!usuario) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        // Validar el estado de la cuenta
        if (usuario.estado === 'pendiente') {
            return res.status(403).json({ message: "Tu cuenta aún espera la aprobación del administrador." });
        }

        if (usuario.estado === 'rechazado') {
            return res.status(403).json({ message: "Tu solicitud de acceso fue rechazada." });
        }

        // Validar contraseña
        const passCorrecto = await bcrypt.compare(password, usuario.password);
        if (!passCorrecto) {
            return res.status(400).json({ message: "Contraseña incorrecta." });
        }

        res.json({ 
            message: "Bienvenido al sistema", 
            user: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } 
        });

    } catch (error) {
        res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};