import axios from 'axios';

// Creamos una instancia de Axios con la URL base de tu backend
const api = axios.create({
    baseURL: 'http://localhost:4000/api', // La ruta principal de tu servidor Node.js
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;