import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './FormularioProducto.css';
import { useToast } from '../../context/ToastContext';

// Diccionario de atributos dinámicos
const configuracionCategorias = {
  'Cargadores': [
    { nombre: 'tipo', label: 'Tipo', tipo: 'select', opciones: ['Cubo', 'Cable', 'Cubo + Cable'] },
    { nombre: 'conexion', label: 'Tipo de Conexión', tipo: 'select', opciones: ['USB-C a USB-C', 'USB-C a Lightning', 'USB-C a USB', 'Micro USB'] },
    { nombre: 'velocidad', label: 'Velocidad de Carga (W)', tipo: 'text', placeholder: 'Ej: 20W, 65W' },
    { nombre: 'marca', label: 'Marca', tipo: 'text', placeholder: 'Ej: Apple, Samsung, Genérico' }
  ],
  'Mouse': [
    { nombre: 'tamano', label: 'Tamaño/Forma', tipo: 'select', opciones: ['Pequeño', 'Grande', 'Ergonómico'] },
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
};

// 1. AÑADIMOS LOS PROPS AQUI:
const FormularioProducto = ({ productoAEditar, cerrarFormulario }) => {
  const { showToast } = useToast();
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [datosGenerales, setDatosGenerales] = useState({
    nombre: '', precio_compra: '', precio_venta: '', stock: '', stock_minimo: ''
  });
  const [detallesTecnicos, setDetallesTecnicos] = useState({});

  // 2. EL EFECTO DE MEMORIA (Modo Edición)
  useEffect(() => {
    if (productoAEditar) {
      // Si llega un producto, llenamos el formulario
      setCategoriaSeleccionada(productoAEditar.categoria_nombre);
      setDatosGenerales({
        nombre: productoAEditar.nombre,
        precio_compra: productoAEditar.precio_compra,
        precio_venta: productoAEditar.precio_venta,
        stock: productoAEditar.stock,
        stock_minimo: productoAEditar.stock_minimo
      });
      
      // Convertimos el JSON de MySQL a un objeto de React
      let detalles = productoAEditar.detalles_tecnicos;
      if (typeof detalles === 'string') {
        try { detalles = JSON.parse(detalles); } catch (e) { detalles = {}; }
      }
      setDetallesTecnicos(detalles || {});
    }
  }, [productoAEditar]);

  const handleGeneralChange = (e) => {
    setDatosGenerales({ ...datosGenerales, [e.target.name]: e.target.value });
  };

  const handleDetalleChange = (e) => {
    setDetallesTecnicos({ ...detallesTecnicos, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (nombreCampo, opcion) => {
    const valoresActuales = detallesTecnicos[nombreCampo] || [];
    if (valoresActuales.includes(opcion)) {
      setDetallesTecnicos({ ...detallesTecnicos, [nombreCampo]: valoresActuales.filter(item => item !== opcion) });
    } else {
      setDetallesTecnicos({ ...detallesTecnicos, [nombreCampo]: [...valoresActuales, opcion] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productoFinal = {
      ...datosGenerales,
      categoria: categoriaSeleccionada,
      detalles_tecnicos: detallesTecnicos 
    };

    try {
      // 3. DECIDIMOS SI ACTUALIZAR (PUT) O REGISTRAR (POST)
      if (productoAEditar) {
        await api.put(`/productos/${productoAEditar.id}`, productoFinal);
        showToast('Producto actualizado correctamente.', 'success');
      } else {
        const response = await api.post('/productos/registrar', productoFinal);
        showToast(`${response.data.message} Código interno: ${response.data.codigo}`, 'success');
      }

      // Si nos pasaron la función para cerrar (volver a la tabla), la ejecutamos
      if (cerrarFormulario) {
        cerrarFormulario();
      } else {
        // Si estamos creando varios seguidos, solo limpiamos
        setDatosGenerales({ nombre: '', precio_compra: '', precio_venta: '', stock: '', stock_minimo: '' });
        setCategoriaSeleccionada('');
        setDetallesTecnicos({});
      }

    } catch (error) {
      console.error("Error al procesar:", error);
      showToast(`Error: ${error.response?.data?.message || 'Error en el servidor'}`, 'error');
    }
  };

  return (
    <div className="form-container">
      <h2>{productoAEditar ? 'Editar Producto' : 'Registrar Nuevo Producto'}</h2>
      
      <form onSubmit={handleSubmit}>
        
        <div className="input-group">
          <label>Categoría del Producto</label>
          <select 
            value={categoriaSeleccionada} 
            onChange={(e) => {
              setCategoriaSeleccionada(e.target.value);
              setDetallesTecnicos({}); 
            }}
            required
            disabled={!!productoAEditar} /* Bloqueamos cambiar la categoría si estamos editando */
          >
            <option value="">-- Selecciona una categoría --</option>
            {Object.keys(configuracionCategorias).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {categoriaSeleccionada && (
          <>
            <h3 className="form-section-title">Datos Comerciales</h3>
            
            <div className="input-group">
              <label>Nombre del Producto</label>
              <input type="text" name="nombre" value={datosGenerales.nombre} onChange={handleGeneralChange} required />
            </div>

            <div className="grid-2-cols">
              <div className="input-group">
                <label>Precio Compra (S/)</label>
                <input type="number" step="0.10" name="precio_compra" value={datosGenerales.precio_compra} onChange={handleGeneralChange} required />
              </div>
              <div className="input-group">
                <label>Precio Venta (S/)</label>
                <input type="number" step="0.10" name="precio_venta" value={datosGenerales.precio_venta} onChange={handleGeneralChange} required />
              </div>
              <div className="input-group">
                <label>Stock Actual</label>
                <input type="number" name="stock" value={datosGenerales.stock} onChange={handleGeneralChange} required />
              </div>
              <div className="input-group">
                <label>Stock Mínimo (Alerta)</label>
                <input type="number" name="stock_minimo" value={datosGenerales.stock_minimo} onChange={handleGeneralChange} required />
              </div>
            </div>

            {configuracionCategorias[categoriaSeleccionada] && configuracionCategorias[categoriaSeleccionada].length > 0 && (
              <>
                <h3 className="form-section-title">Características Específicas</h3>
                <div className="grid-2-cols">
                  
                  {configuracionCategorias[categoriaSeleccionada].map((campo, index) => (
                    <div className="input-group" key={index}>
                      <label>{campo.label}</label>
                      
                      {campo.tipo === 'text' && (
                        <input type="text" name={campo.nombre} value={detallesTecnicos[campo.nombre] || ''} placeholder={campo.placeholder} onChange={handleDetalleChange} />
                      )}
                      
                      {campo.tipo === 'select' && (
                        <select name={campo.nombre} value={detallesTecnicos[campo.nombre] || ''} onChange={handleDetalleChange}>
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

            <button type="submit" className="btn-submit">
              {productoAEditar ? 'Guardar Cambios' : 'Registrar Producto'}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default FormularioProducto;