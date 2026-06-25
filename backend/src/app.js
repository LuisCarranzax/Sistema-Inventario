const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); 
const db = require('./config/db');
const app = express();


const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const analiticaRoutes = require('./routes/analiticaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Middlewares
app.use(cors());
app.use(express.json());

const verificarEstado = require('./middlewares/verificarEstado');
app.use(verificarEstado);


// Prueba de conexión a la base de datos
db.getConnection()
    .then(connection => {
        console.log('Conexión a la base de datos MySQL establecida con éxito.');
        connection.release();
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos MySQL:', err.message);
    });


// Montaje de rutas (Endpoints base)
app.use('/api/productos', productoRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/analiticas', analiticaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ia', aiRoutes);

// Ruta de comprobación de salud del servidor (Health check)
app.get('/', (req, res) => {
    res.json({ mensaje: 'API del Sistema de Gestión IT funcionando correctamente.' });
});

// Inicialización del servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});