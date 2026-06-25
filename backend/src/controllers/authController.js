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

        if (usuario.estado === 'inactivo') {
            const [[adminUser]] = await db.query('SELECT celular FROM usuarios WHERE rol = "administrador" LIMIT 1');
            const adminCelular = adminUser ? adminUser.celular : '';
            const msg = adminCelular 
                ? `Tu cuenta ha sido suspendida. Por favor, contacta con el administrador al celular: ${adminCelular}.`
                : "Tu cuenta ha sido suspendida. Por favor, contacta con el administrador.";
            return res.status(403).json({ message: msg });
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

exports.aprobarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const [usuarios] = await db.query("SELECT nombre, correo, estado FROM usuarios WHERE id = ?", [id]);
        if (usuarios.length === 0) return res.status(404).send('Usuario no encontrado');
        
        if (usuarios[0].estado !== 'pendiente') {
            return res.send('<h2 style="color: #f59e0b; text-align: center; margin-top: 50px;">⚠️ Esta solicitud ya fue procesada anteriormente.</h2>');
        } 

        await db.query("UPDATE usuarios SET estado = 'aprobado' WHERE id = ?", [id]);
        await emailService.notificarUsuarioResultado(usuarios[0].correo, usuarios[0].nombre, 'aprobado');
        res.send('<h2 style="color: green; text-align: center; margin-top: 50px;">✅ Usuario Aprobado Exitosamente.</h2>');
    } catch (error) { 
        res.status(500).send('Error.');
    }
};

exports.rechazarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const [usuarios] = await db.query("SELECT nombre, correo, estado FROM usuarios WHERE id = ?", [id]);
        if (usuarios.length === 0) return res.status(404).send('Usuario no encontrado');
        if(usuarios[0].estado !== 'pendiente') {
            return res.send('<h2 style="color: #f59e0b; text-align: center; margin-top: 50px;">⚠️ Esta solicitud ya fue procesada anteriormente.</h2>');
        }
        
        await db.query("UPDATE usuarios SET estado = 'rechazado' WHERE id = ?", [id]);
        await emailService.notificarUsuarioResultado(usuarios[0].correo, usuarios[0].nombre, 'rechazado');
        res.send('<h2 style="color: red; text-align: center; margin-top: 50px;">❌ Usuario Rechazado. Se ha notificado al solicitante.</h2>');
    } catch (error) {
        res.status(500).send('Error al rechazar usuario.');
    }
};

exports.solicitarRecuperacion = async (req, res) => {
    const { email } = req.body;
    try {
        // Buscamos al usuario incluyendo sus datos de recuperación actuales
        const [usuarios] = await db.query(
            "SELECT id, codigo_recuperacion, expira_codigo FROM usuarios WHERE correo = ?", 
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ message: "No existe una cuenta con este correo." });
        }

        const usuario = usuarios[0];

        //  Verificar si ya existe un código activo
        // Comparamos la fecha de expiración guardada con la fecha actual del servidor
        if (usuario.codigo_recuperacion && new Date(usuario.expira_codigo) > new Date()) {
            return res.status(200).json({ 
                message: "Ya hemos enviado un código válido a tu correo recientemente. Por favor, revísalo." 
            });
        }

        // Si no tiene código o ya expiró (pasaron los 15 min), generamos uno nuevo
        const codigoOTP = Math.floor(100000 + Math.random() * 900000).toString();

        await db.query(`
            UPDATE usuarios 
            SET codigo_recuperacion = ?, expira_codigo = (NOW() + INTERVAL 15 MINUTE) 
            WHERE correo = ?`, 
            [codigoOTP, email]
        );

        await emailService.enviarCorreoRecuperacion(email, codigoOTP);
        
        res.status(200).json({ message: "Nuevo código de seguridad enviado a tu correo." });

    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

exports.verificarOTP = async (req, res) => {
    const { email, otpCode } = req.body;
    try {
        // Buscamos el usuario y verificamos si la fecha actual (NOW) es menor a la de expiración
        const [usuarios] = await db.query(`
            SELECT id FROM usuarios 
            WHERE correo = ? AND codigo_recuperacion = ? AND expira_codigo > NOW()
        `, [email, otpCode]);

        if (usuarios.length === 0) {
            return res.status(400).json({ message: "El código es inválido o ha expirado." });
        }

        res.json({ message: "Código verificado correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

exports.restablecerPassword = async (req, res) => {
    const { email, otpCode, newPassword } = req.body;
    try {
        // Doble verificación por seguridad
        const [usuarios] = await db.query(`
            SELECT id FROM usuarios 
            WHERE correo = ? AND codigo_recuperacion = ? AND expira_codigo > NOW()
        `, [email, otpCode]);

        if (usuarios.length === 0) {
            return res.status(400).json({ message: "El código es inválido o ha expirado." });
        }

        // Encriptar la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña y limpiar el código de seguridad
        await db.query(`
            UPDATE usuarios 
            SET password = ?, codigo_recuperacion = NULL, expira_codigo = NULL 
            WHERE correo = ?`, 
            [passwordHash, email]
        );

        res.json({ message: "¡Contraseña actualizada con éxito!" });
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};