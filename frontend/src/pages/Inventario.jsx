import React from 'react';
import FormularioProducto from '../components/inventario/FormularioProducto';

const Inventario = () => {
  return (
    <div style={{ padding: '20px' }}>
      {/* Más adelante aquí pondremos una tabla y un botón para ocultar/mostrar este formulario */}
      <FormularioProducto />
    </div>
  );
};

export default Inventario;