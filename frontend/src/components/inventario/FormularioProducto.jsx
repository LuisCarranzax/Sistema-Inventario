import React, { useState } from 'react';
import './FormularioProducto.css';

// 1. DICCIONARIO DE ATRIBUTOS DINÁMICOS
// Aquí definimos qué campos extra aparecen según la categoría
const configuracionCategorias = {
  'Cargadores': [
    { nombre: 'tipo', label: 'Tipo', tipo: 'select', opciones: ['Cubo', 'Cable', 'Cubo + Cable'] },
    { nombre: 'conexion', label: 'Tipo de Conexión', tipo: 'select', opciones: ['USB-C a USB-C', 'USB-C a Lightning', 'USB-C a USB', 'Micro USB'] },
    { nombre: 'velocidad', label: 'Velocidad de Carga (W)', tipo: 'text', placeholder: 'Ej: 20W, 65W' },
    { nombre: 'marca', label: 'Marca', tipo: 'text', placeholder: 'Ej: Apple, Samsung, Genérico' }
  ],
  'Mouse': [
    { nombre: 'tamano', label: 'Tamaño/Forma', tipo: 'select', opciones: ['Pequeño', 'Grande', 'Ergonómico'] },
    // El tipo 'checkbox' permite selección múltiple como pediste
    { nombre: 'conexiones', label: 'Tipo de Conexión (Puedes elegir varias)', tipo: 'checkbox', opciones: ['Cableado', '2.4 GHz', 'Bluetooth'] },
    { nombre: 'marca', label: 'Marca', tipo: 'text' },
    { nombre: 'color', label: 'Color', tipo: 'text' }
  ],
  'Mousepad': [
    { nombre: 'tamano', label: 'Tamaño', tipo: 'select', opciones: ['Pequeño (Riñón)', 'Cuadrado Normal', 'Grande 40x60', 'Extra Grande 80x30'] },
    { nombre: 'diseno', label: 'Diseño', tipo: 'text', placeholder: 'Ej: Variado, Negro liso, RGB' }
  ],
  'Cables PC': [
    { nombre: 'tipo_cable', label: 'Tipo de Cable', tipo: 'select', opciones: ['VGA', 'HDMI', 'DisplayPort', 'Cable de Poder', 'Trébol'] },
    { nombre: 'longitud', label: 'Longitud (Metros)', tipo: 'text' }
  ]
  // Puedes agregar 'Teclados', 'Audifonos', etc. siguiendo este mismo patrón.
};


const FormularioProducto = () => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  
  // Estado para los campos generales
  const [datosGenerales, setDatosGenerales] = useState({
  nombre: '', precio_compra: '', precio_venta: '', stock: '', stock_minimo: ''});

  // Estado para los campos dinámicos
  const [detallesTecnicos, setDetallesTecnicos] = useState({});

  const handleGeneralChange = (e) => {
    setDatosGenerales({ ...datosGenerales, [e.target.name]: e.target.value });
  };

  const handleDetalleChange = (e) => {
    setDetallesTecnicos({ ...detallesTecnicos, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (nombreCampo, opcion) => {
    // Lógica especial para guardar múltiples checkboxes en un array
    const valoresActuales = detallesTecnicos[nombreCampo] || [];
    if (valoresActuales.includes(opcion)) {
      setDetallesTecnicos({ ...detallesTecnicos, [nombreCampo]: valoresActuales.filter(item => item !== opcion) });
    } else {
      setDetallesTecnicos({ ...detallesTecnicos, [nombreCampo]: [...valoresActuales, opcion] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí empaquetamos todo para enviarlo al backend en el futuro
    const productoFinal = {
      ...datosGenerales,
      categoria: categoriaSeleccionada,
      detalles_tecnicos: detallesTecnicos // Esto se guardará como JSON en MySQL
    };
    console.log("Producto a guardar:", productoFinal);
    alert("Revisa la consola (F12) para ver la estructura de los datos");
  };

  return (
    <div className="form-container">
      <h2>Registrar Nuevo Producto</h2>
      
      <form onSubmit={handleSubmit}>
        
        {/* === SECCIÓN 1: SELECTOR DE CATEGORÍA === */}
        <div className="input-group">
          <label>Categoría del Producto</label>
          <select 
            value={categoriaSeleccionada} 
            onChange={(e) => {
              setCategoriaSeleccionada(e.target.value);
              setDetallesTecnicos({}); // Limpiamos los detalles si cambia de categoría
            }}
            required
          >
            <option value="">-- Selecciona una categoría --</option>
            {Object.keys(configuracionCategorias).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* === SECCIÓN 2: DATOS GENERALES (Siempre visibles) === */}
        {categoriaSeleccionada && (
          <>
            <h3 className="form-section-title">Datos Comerciales</h3>
            
            <div className="input-group">
              <label>Nombre del Producto</label>
              <input type="text" name="nombre" onChange={handleGeneralChange} required placeholder="Ej: Mouse Logitech M170" />
            </div>

            <div className="grid-2-cols">
              <div className="input-group">
                <label>Precio de Compra (S/)</label>
                <input type="number" step="0.10" name="precio_compra" onChange={handleGeneralChange} required />
              </div>
              <div className="input-group">
                <label>Precio de Venta (S/)</label>
                <input type="number" step="0.10" name="precio_venta" onChange={handleGeneralChange} required />
              </div>
              <div className="input-group">
                <label>Stock Actual</label>
                <input type="number" name="stock" onChange={handleGeneralChange} required />
              </div>
              <div className="input-group">
                <label>Stock Mínimo (Alerta)</label>
                <input type="number" name="stock_minimo" onChange={handleGeneralChange} required />
              </div>
            </div>

            {/* === SECCIÓN 3: CAMPOS DINÁMICOS === */}
            {configuracionCategorias[categoriaSeleccionada].length > 0 && (
              <>
                <h3 className="form-section-title">Características Específicas</h3>
                <div className="grid-2-cols">
                  
                  {configuracionCategorias[categoriaSeleccionada].map((campo, index) => (
                    <div className="input-group" key={index}>
                      <label>{campo.label}</label>
                      
                      {/* Renderizado condicional según el tipo de campo */}
                      {campo.tipo === 'text' && (
                        <input type="text" name={campo.nombre} placeholder={campo.placeholder} onChange={handleDetalleChange} />
                      )}
                      
                      {campo.tipo === 'select' && (
                        <select name={campo.nombre} onChange={handleDetalleChange}>
                          <option value="">-- Seleccionar --</option>
                          {campo.opciones.map(opc => <option key={opc} value={opc}>{opc}</option>)}
                        </select>
                      )}

                      {campo.tipo === 'checkbox' && (
                        <div className="checkbox-group">
                          {campo.opciones.map(opc => (
                            <label key={opc} className="checkbox-label">
                              <input 
                                type="checkbox" 
                                checked={(detallesTecnicos[campo.nombre] || []).includes(opc)}
                                onChange={() => handleCheckboxChange(campo.nombre, opc)} 
                              />
                              {opc}
                            </label>
                          ))}
                        </div>
                      )}

                    </div>
                  ))}

                </div>
              </>
            )}

            <button type="submit" className="btn-submit">Guardar Producto</button>
          </>
        )}
      </form>
    </div>
  );
};

export default FormularioProducto;