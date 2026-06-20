const db = require('../config/db');
const auditoriaService = require('../services/auditoriaService');

exports.obtenerCategorias = async (req, res) => {
    try {
        const [categorias] = await db.query('SELECT * FROM categorias');
        
        // Parseamos plantilla_campos si vienen como texto
        const parsedCategorias = categorias.map(c => {
            let campos = c.plantilla_campos;
            if (typeof campos === 'string') {
                try {
                    campos = JSON.parse(campos);
                } catch (e) {
                    campos = [];
                }
            }
            return {
                ...c,
                plantilla_campos: campos || []
            };
        });

        res.json(parsedCategorias);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener categorías", error: error.message });
    }
};

exports.crearCategoria = async (req, res) => {
    const { nombre, prefijo_codigo, plantilla_campos } = req.body;

    try {
        // Convertimos el arreglo de campos a un string JSON para MySQL
        const jsonCampos = JSON.stringify(plantilla_campos || []);
        
        const query = 'INSERT INTO categorias (nombre, prefijo_codigo, plantilla_campos) VALUES (?, ?, ?)';
        await db.query(query, [nombre, prefijo_codigo.toUpperCase(), jsonCampos]);
        
        const usuarioId = req.headers['x-usuario-id'] || 1;
        await auditoriaService.registrarEvento(usuarioId, 'REGISTRO', 'Categorías', `Nueva categoría creada: ${nombre} (${prefijo_codigo.toUpperCase()})`);

        res.status(201).json({ message: "Categoría creada exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al crear la categoría", error: error.message });
    }
};