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

// Asegúrate de tener importado el emailService arriba
// const emailService = require('../services/emailService');

exports.aprobarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Actualizamos el estado a 'aprobado'
        await db.query("UPDATE usuarios SET estado = 'aprobado' WHERE id = ?", [id]);
        
        // 2. Obtenemos los datos del usuario para enviarle el correo
        const [usuarios] = await db.query("SELECT nombre, correo FROM usuarios WHERE id = ?", [id]);
        if (usuarios.length > 0) {
            await emailService.notificarUsuarioResultado(usuarios[0].correo, usuarios[0].nombre, 'aprobado');
        }

        // 3. Mostramos un mensaje visual al administrador en su navegador
        res.send('<h2 style="color: green; text-align: center; margin-top: 50px;">✅ Usuario Aprobado Exitosamente. Ya puede ingresar al sistema.</h2>');
    } catch (error) {
        res.status(500).send('Error al aprobar usuario.');
    }
};

exports.rechazarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("UPDATE usuarios SET estado = 'rechazado' WHERE id = ?", [id]);
        
        const [usuarios] = await db.query("SELECT nombre, correo FROM usuarios WHERE id = ?", [id]);
        if (usuarios.length > 0) {
            await emailService.notificarUsuarioResultado(usuarios[0].correo, usuarios[0].nombre, 'rechazado');
        }

        res.send('<h2 style="color: red; text-align: center; margin-top: 50px;">❌ Usuario Rechazado. Se ha notificado al solicitante.</h2>');
    } catch (error) {
        res.status(500).send('Error al rechazar usuario.');
    }
};