import React, { createContext, useState, useEffect } from 'react';

// Creamos el contexto
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, verificamos si hay una sesión guardada en el navegador
  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Función para iniciar sesión
  const login = (userData) => {
    // IMPORTANTE: Aquí userData ya debe venir con el formato de MySQL (id en lugar de _id)
    setUser(userData);
    localStorage.setItem('user_session', JSON.stringify(userData));
  };

  // Función para cerrar sesión
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_session');
    window.location.href = '/login'; // Redirección limpia al salir
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};