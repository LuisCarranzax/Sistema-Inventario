import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UpdatePassword from './pages/auth/UpdatePassword';


function App() {
  return (
   <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
   </BrowserRouter>
  );
}

export default App
