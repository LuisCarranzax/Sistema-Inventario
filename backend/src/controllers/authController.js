const db = require('../config/db');
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas

exports.registrarUsuario = async (req, res) => {
    const { nombre_usuario, password, rol, dni } = req.body;
    
    try {
        // Encriptar la contraseña antes de guardar
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await db.query('INSERT INTO usuarios (nombre_usuario, password, rol, dni) VALUES (?, ?, ?, ?)', 
                      [nombre_usuario, passwordHash, rol, dni]);

        res.status(201).json({ msg: "Usuario creado con éxito" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};