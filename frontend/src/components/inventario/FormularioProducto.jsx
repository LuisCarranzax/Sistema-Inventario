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

const obtenerFechaLocal = () => {
  const hoy = new Date();
  const offset = hoy.getTimezoneOffset();
  const hoyLocal = new Date(hoy.getTime() - (offset * 60 * 1000));
  return hoyLocal.toISOString().split('T')[0];
};

const FormularioProducto = ({ productoAEditar, cerrarFormulario }) => {
  const { showToast } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nuevaCat, setNuevaCat] = useState({ nombre: '', prefijo_codigo: '' });

  const [datosGenerales, setDatosGenerales] = useState({
    nombre: '', 
    precio_compra: '', 
    precio_venta: '', 
    stock: '', 
    stock_minimo: '',
    fecha_abastecimiento: obtenerFechaLocal()
  });
  const [detallesTecnicos, setDetallesTecnicos] = useState({});

  const categoriaObj = categorias.find(cat => cat.nombre === categoriaSeleccionada);
  const camposDinamicos = categoriaObj?.plantilla_campos || [];

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const response = await api.get('/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
    }
  };

  useEffect(() => {
    if (productoAEditar) {
      setCategoriaSeleccionada(productoAEditar.categoria_nombre);
      
      let fechaFormateada = '';
      if (productoAEditar.fecha_abastecimiento) {
        try {
          fechaFormateada = new Date(productoAEditar.fecha_abastecimiento).toISOString().split('T')[0];
        } catch (e) {
          fechaFormateada = productoAEditar.fecha_abastecimiento.substring(0, 10);
        }
      } else {
        fechaFormateada = obtenerFechaLocal();
      }

      setDatosGenerales({
        nombre: productoAEditar.nombre,
        precio_compra: productoAEditar.precio_compra,
        precio_venta: productoAEditar.precio_venta,
        stock: productoAEditar.stock,
        stock_minimo: productoAEditar.stock_minimo,
        fecha_abastecimiento: fechaFormateada
      });
      
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

  const handleCrearCategoria = async () => {
    if (!nuevaCat.nombre || !nuevaCat.prefijo_codigo) {
      return showToast('Por favor completa el nombre y prefijo para la nueva categoría.', 'error');
    }
    try {
      await api.post('/categorias', { 
        nombre: nuevaCat.nombre, 
        prefijo_codigo: nuevaCat.prefijo_codigo.toUpperCase(),
        plantilla_campos: []
      });
      showToast('Categoría creada con éxito.', 'success');
      
      const response = await api.get('/categorias');
      setCategorias(response.data);
      setCategoriaSeleccionada(nuevaCat.nombre);
      setDetallesTecnicos({});
      
      setNuevaCat({ nombre: '', prefijo_codigo: '' });
      setCreandoCategoria(false);
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Error al crear la categoría.', 'error');
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
      if (productoAEditar) {
        await api.put(`/productos/${productoAEditar.id}`, productoFinal);
        showToast('Producto actualizado correctamente.', 'success');
      } else {
        const response = await api.post('/productos/registrar', productoFinal);
        showToast(`${response.data.message} Código interno: ${response.data.codigo}`, 'success');
      }

      if (cerrarFormulario) {
        cerrarFormulario();
      } else {
        setDatosGenerales({ 
          nombre: '', 
          precio_compra: '', 
          precio_venta: '', 
          stock: '', 
          stock_minimo: '',
          fecha_abastecimiento: obtenerFechaLocal()
        });
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ margin: 0 }}>Categoría del Producto</label>
            {!productoAEditar && (
              <button 
                type="button" 
                className="btn-link-categoria" 
                onClick={() => setCreandoCategoria(!creandoCategoria)}
                style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {creandoCategoria ? 'Cancelar' : '+ Nueva Categoría'}
              </button>
            )}
          </div>
          
          {!creandoCategoria ? (
            <select 
              value={categoriaSeleccionada} 
              onChange={(e) => {
                setCategoriaSeleccionada(e.target.value);
                setDetallesTecnicos({}); 
              }}
              required
              disabled={!!productoAEditar}
            >
              <option value="">-- Selecciona una categoría --</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
              ))}
            </select>
          ) : (
            <div style={{ border: '1px dashed #CBD5E1', padding: '12px', borderRadius: '6px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Nombre. Ej: Tarjetas Gráficas" 
                  value={nuevaCat.nombre} 
                  onChange={(e) => setNuevaCat({ ...nuevaCat, nombre: e.target.value })} 
                  style={{ flex: 2, padding: '8px', fontSize: '0.9rem', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                />
                <input 
                  type="text" 
                  placeholder="Prefijo (max 5). Ej: GPU" 
                  value={nuevaCat.prefijo_codigo} 
                  maxLength={5}
                  onChange={(e) => setNuevaCat({ ...nuevaCat, prefijo_codigo: e.target.value })} 
                  style={{ flex: 1, padding: '8px', fontSize: '0.9rem', textTransform: 'uppercase', border: '1px solid #CBD5E1', borderRadius: '4px' }}
                />
              </div>
              <button 
                type="button" 
                className="btn-seguridad" 
                onClick={handleCrearCategoria}
                style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100%' }}
              >
                Crear e ir al formulario
              </button>
            </div>
          )}
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

            <div className="input-group">
              <label>Fecha de Ingreso / Abastecimiento</label>
              <input 
                type="date" 
                name="fecha_abastecimiento" 
                value={datosGenerales.fecha_abastecimiento} 
                onChange={handleGeneralChange} 
                required 
              />
            </div>

            {camposDinamicos && camposDinamicos.length > 0 && (
              <>
                <h3 className="form-section-title">Características Específicas</h3>
                <div className="grid-2-cols">
                  
                  {camposDinamicos.map((campo, index) => (
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