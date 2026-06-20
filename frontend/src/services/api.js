import axios from 'axios';

// Creamos una instancia de Axios con la URL base de tu backend
const api = axios.create({
    baseURL: 'http://localhost:4000/api', // La ruta principal de tu servidor Node.js
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para inyectar el x-usuario-id de la sesión en las cabeceras
api.interceptors.request.use((config) => {
    const session = localStorage.getItem('user_session');
    if (session) {
        try {
            const user = JSON.parse(session);
            if (user && user.id) {
                config.headers['x-usuario-id'] = user.id;
            }
        } catch (e) {
            console.error("Error al parsear la sesión para inyectar el x-usuario-id:", e);
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;