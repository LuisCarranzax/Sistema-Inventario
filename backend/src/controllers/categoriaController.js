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

exports.actualizarCategoria = async (req, res) => {
    const { id } = req.params;
    const { nombre, prefijo_codigo, plantilla_campos } = req.body;

    try {
        const jsonCampos = JSON.stringify(plantilla_campos || []);
        
        await db.query(
            'UPDATE categorias SET nombre = ?, prefijo_codigo = ?, plantilla_campos = ? WHERE id = ?',
            [nombre, prefijo_codigo.toUpperCase(), jsonCampos, id]
        );

        const usuarioId = req.headers['x-usuario-id'] || 1;
        await auditoriaService.registrarEvento(
            usuarioId, 
            'ACTUALIZACION', 
            'Categorías', 
            `Categoría actualizada: ${nombre} (${prefijo_codigo.toUpperCase()})`
        );

        res.json({ message: "Categoría actualizada exitosamente." });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la categoría", error: error.message });
    }
};

exports.eliminarCategoria = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Obtener detalles de la categoría
        const [[categoria]] = await db.query('SELECT nombre FROM categorias WHERE id = ?', [id]);
        if (!categoria) {
            return res.status(404).json({ message: "Categoría no encontrada." });
        }

        // 2. Comprobar si hay productos asociados a esta categoría
        const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM productos WHERE categoria_id = ?', [id]);
        if (count > 0) {
            return res.status(409).json({ 
                message: `No se puede eliminar la categoría "${categoria.nombre}" porque tiene ${count} producto(s) asociado(s) en el inventario. Elimine o reasigne los productos primero.` 
            });
        }

        // 3. Eliminar la categoría
        await db.query('DELETE FROM categorias WHERE id = ?', [id]);

        const usuarioId = req.headers['x-usuario-id'] || 1;
        await auditoriaService.registrarEvento(
            usuarioId, 
            'ELIMINACION', 
            'Categorías', 
            `Categoría eliminada: ${categoria.nombre}`
        );

        res.json({ message: "Categoría eliminada exitosamente." });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la categoría", error: error.message });
    }
};