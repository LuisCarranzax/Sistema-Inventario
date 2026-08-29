import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { FiPlus, FiTrash2, FiSave, FiUser, FiBox } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import { generarCotizacionFormalPDF } from '../../services/cotizacionServices';
import './Cotizaciones.css';

const Cotizaciones = () => {
  const { user } = useContext(AuthContext);
  const [productosBD, setProductosBD] = useState([]);
  const { showToast } = useToast();
  
  // 1. Estados del Cliente
  const [tipoCliente, setTipoCliente] = useState('natural'); // 'natural' o 'empresa'
  const [cliente, setCliente] = useState({
    documento: '', nombre: '', representante_legal: '', celular: '', direccion: ''
  });

  // 2. Estados de los Ítems (Arreglo dinámico)
  const [items, setItems] = useState([
    { tipo_item: 'producto', producto_id: '', descripcion: '', cantidad: 1, precio_unitario: 0 }
  ]);
  
  const [validezDias, setValidezDias] = useState(15);

  useEffect(() => {
    // Cargamos los productos para el select dinámico
    const cargarProductos = async () => {
      try {
        const response = await api.get('/productos');
        setProductosBD(response.data);
      } catch (error) {
        console.error("Error al cargar productos", error);
      }
    };
    cargarProductos();
  }, []);

  // Manejadores del Cliente
  const handleClienteChange = (e) => {
    setCliente({ ...cliente, [e.target.name]: e.target.value });
  };

  // Manejadores del Arreglo Dinámico de Ítems
  const agregarItem = () => {
    setItems([...items, { tipo_item: 'producto', producto_id: '', descripcion: '', cantidad: 1, precio_unitario: 0 }]);
  };

  const eliminarItem = (index) => {
    const nuevosItems = items.filter((_, i) => i !== index);
    setItems(nuevosItems);
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...items];
    nuevosItems[index][campo] = valor;

    // MAGIA: Si el usuario selecciona un producto de la BD, autocompletamos su precio y descripción
    if (campo === 'producto_id' && valor !== '') {
      const productoEncontrado = productosBD.find(p => p.id.toString() === valor);
      if (productoEncontrado) {
        nuevosItems[index].descripcion = productoEncontrado.nombre;
        nuevosItems[index].precio_unitario = productoEncontrado.precio_venta;
      }
    }
    
    // Si cambia a 'servicio', limpiamos el producto_id
    if (campo === 'tipo_item' && valor === 'servicio') {
      nuevosItems[index].producto_id = '';
      nuevosItems[index].descripcion = '';
      nuevosItems[index].precio_unitario = 0;
    }

    setItems(nuevosItems);
  };

  const calcularTotal = () => {
    return items.reduce((suma, item) => suma + (item.cantidad * item.precio_unitario), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return alert("Debes agregar al menos un ítem a la cotización.");

    // Preparamos el paquete exacto que espera nuestro backend
    const payload = {
      usuario_id: user.id,
      validez_dias: validezDias,
      total: calcularTotal(),
      cliente: {
        tipo_cliente: tipoCliente,
        documento: cliente.documento,
        nombre: cliente.nombre,
        representante_legal: cliente.representante_legal,
        celular: cliente.celular,
        direccion: cliente.direccion
      },
      items: items.map(item => ({
        tipo_item: item.tipo_item,
        producto_id: item.tipo_item === 'producto' ? item.producto_id : null,
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario)
      }))
    };

    try {
      const response = await api.post('/cotizaciones', payload);
      showToast("Cotización guardada en el sistema exitosamente.", "success");
      
      // ¡AQUÍ ESTÁ LA MAGIA! Llamamos al generador de PDF
      generarCotizacionFormalPDF(payload, response.data.cotizacionId);

      // Limpiamos el formulario después de descargar
      setCliente({ documento: '', nombre: '', representante_legal: '', celular: '', direccion: '' });
      setItems([{ tipo_item: 'producto', producto_id: '', descripcion: '', cantidad: 1, precio_unitario: 0 }]);
      
    } catch (error) {
      console.error("Error al guardar cotización:", error);
      showToast("Error al guardar la cotización.", "error");
    }
  };

  return (
    <div className="cotizacion-container">
      <div className="inventario-header">
        <div>
          <h1>Generar Cotización Formal</h1>
          <p style={{ color: '#64748B' }}>Crea proformas formales para empresas o instituciones públicas.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* SECCIÓN 1: DATOS DEL CLIENTE */}
        <div className="form-seccion">
          <h3><FiUser /> 1. Datos del Cliente</h3>
          
          <div className="radio-group">
            <label className="radio-label">
              <input type="radio" name="tipo_cliente" checked={tipoCliente === 'natural'} onChange={() => setTipoCliente('natural')} />
              Persona Natural
            </label>
            <label className="radio-label">
              <input type="radio" name="tipo_cliente" checked={tipoCliente === 'empresa'} onChange={() => setTipoCliente('empresa')} />
              Empresa / Institución
            </label>
          </div>

          <div className="form-grid-2">
            <div className="input-group-auth">
              <label>{tipoCliente === 'empresa' ? 'RUC' : 'DNI'}</label>
              <input type="text" name="documento" value={cliente.documento} onChange={handleClienteChange} required />
            </div>
            <div className="input-group-auth">
              <label>{tipoCliente === 'empresa' ? 'Razón Social' : 'Nombre Completo'}</label>
              <input type="text" name="nombre" value={cliente.nombre} onChange={handleClienteChange} required />
            </div>
            
            {tipoCliente === 'empresa' && (
              <div className="input-group-auth">
                <label>Representante Legal (Opcional)</label>
                <input type="text" name="representante_legal" value={cliente.representante_legal} onChange={handleClienteChange} />
              </div>
            )}
            
            <div className="input-group-auth">
              <label>Celular / Contacto</label>
              <input type="text" name="celular" value={cliente.celular} onChange={handleClienteChange} />
            </div>
            <div className="input-group-auth" style={{ gridColumn: '1 / -1' }}>
              <label>Dirección</label>
              <input type="text" name="direccion" value={cliente.direccion} onChange={handleClienteChange} required />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: DETALLE DE ÍTEMS */}
        <div className="form-seccion">
          <h3><FiBox /> 2. Detalle de Productos y Servicios</h3>
          
          {/* Cabeceras de la tabla dinámica */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 3fr 1fr 1.5fr 0.5fr', gap: '10px', fontWeight: 'bold', color: '#64748B', fontSize: '0.85rem', marginBottom: '10px', padding: '0 15px' }}>
            <span>Tipo</span>
            <span>Producto BD (Opcional)</span>
            <span>Descripción / Detalle</span>
            <span>Cant.</span>
            <span>P. Unitario (S/)</span>
            <span></span>
          </div>

          {items.map((item, index) => (
            <div className="item-row" key={index}>
              <select value={item.tipo_item} onChange={(e) => actualizarItem(index, 'tipo_item', e.target.value)}>
                <option value="producto">Producto Físico</option>
                <option value="servicio">Servicio Técnico</option>
              </select>

              <select 
                value={item.producto_id} 
                onChange={(e) => actualizarItem(index, 'producto_id', e.target.value)}
                disabled={item.tipo_item === 'servicio'}
              >
                <option value="">-- Seleccionar --</option>
                {productosBD.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.codigo_interno} - {p.nombre} (Stock: {p.stock})
                  </option>
                ))}
              </select>

              <input type="text" placeholder="Ej: Instalación de 4 cámaras" value={item.descripcion} onChange={(e) => actualizarItem(index, 'descripcion', e.target.value)} required />
              
              <input type="number" min="1" value={item.cantidad} onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)} required />
              
              <input type="number" step="0.01" min="0" value={item.precio_unitario} onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)} required />

              <button type="button" onClick={() => eliminarItem(index)} style={{ background: '#FEE2E2', color: '#EF4444', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer' }} title="Eliminar fila">
                <FiTrash2 />
              </button>
            </div>
          ))}

          <button type="button" onClick={agregarItem} style={{ background: '#10B981', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px' }}>
            <FiPlus /> Añadir Fila
          </button>
        </div>

        {/* SECCIÓN 3: TOTALES Y GUARDAR */}
        <div className="totales-container">
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <span style={{ color: '#64748B', fontSize: '1rem' }}>Validez de cotización:</span>
            <select value={validezDias} onChange={(e) => setValidezDias(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
              <option value={7}>7 días</option>
              <option value={15}>15 días</option>
              <option value={30}>30 días</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: '#475569', marginRight: '15px' }}>Total Estimado:</span>
            <span className="total-destacado">S/ {calcularTotal().toFixed(2)}</span>
          </div>

          <button type="submit" className="btn-seguridad" style={{ background: '#2563EB', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <FiSave /> Guardar y Generar PDF
          </button>
        </div>

      </form>
    </div>
  );
};

export default Cotizaciones;