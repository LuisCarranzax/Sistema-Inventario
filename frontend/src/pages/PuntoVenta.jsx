import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiSearch, FiTrash2, FiPlus, FiMinus, FiUser } from 'react-icons/fi';
import { generarDocumentoPDF } from '../../../backend/src/services/pdfServices';
import '../css/PuntoVenta.css';
import '../css/Inventario.css';
import { useToast } from '../context/ToastContext';

const PuntoVenta = () => {
  const { showToast } = useToast();
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [clienteNombre, setClienteNombre] = useState('');
  
  // NUEVO: Estado para el checkbox de Proforma
  const [esProforma, setEsProforma] = useState(false);

  const categorias = ['Todos', ...new Set(productos.map(p => p.categoria_nombre))];

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await api.get('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error("Error al cargar catálogo:", error);
    }
  };

  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) return; 

    const itemExistente = carrito.find(item => item.id === producto.id);
    if (itemExistente) {
      if (itemExistente.cantidad < producto.stock) {
        setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
      } else {
        alert("Stock máximo alcanzado.");
      }
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const modificarCantidad = (id, delta) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad > 0 && nuevaCantidad <= item.stock) {
          return { ...item, cantidad: nuevaCantidad };
        }
      }
      return item;
    }));
  };

  const eliminarDelCarrito = (id) => setCarrito(carrito.filter(item => item.id !== id));
  
  const calcularTotal = () => carrito.reduce((total, item) => total + (item.precio_venta * item.cantidad), 0);

  const productosFiltrados = productos.filter(prod => {
    const coincideCategoria = filtroCategoria === 'Todos' || prod.categoria_nombre === filtroCategoria;
    const coincideBusqueda = prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                             prod.codigo_interno.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  // ACTUALIZADO: Función de procesar venta adaptada al checkbox y PDF
  const procesarVenta = async () => {
    if (carrito.length === 0) return;
    
    const totalVenta = calcularTotal(); // Lo guardamos en una variable para usarlo en el PDF
    
    const payload = {
      carrito,
      total: totalVenta,
      metodo_pago: esProforma ? 'Por definir' : metodoPago,
      es_proforma: esProforma,
      cliente_nombre: clienteNombre
    };

    try {
      // 1. Guardamos en MySQL
      const response = await api.post('/ventas/registrar', payload);
      
      // 2. Mostramos aviso al usuario
      const tipo = esProforma ? 'Proforma generada' : 'Venta registrada';
      alert(`✅ ${tipo} exitosamente.\nSe descargará el documento PDF a continuación.`);
      
      // 3. Generamos y descargamos el PDF usando nuestro Servicio Externo
      generarDocumentoPDF(response.data.ventaId, carrito, totalVenta, esProforma, clienteNombre, metodoPago);
      
      // NUEVO: Notificación inmediata de stock agotado
      if (!esProforma) {
        carrito.forEach(item => {
          const stockRestante = Number(item.stock) - Number(item.cantidad);
          if (stockRestante <= 0) {
            showToast(`⚠️ ¡Alerta! El producto "${item.nombre}" se ha agotado por completo (Stock: 0).`, 'error');
          }
        });
      }

      // 4. Limpiamos la caja registradora
      setCarrito([]);
      setBusqueda('');
      setClienteNombre('');
      setEsProforma(false); 
      
      // 5. Recargamos catálogo
      cargarProductos();

    } catch (error) {
      console.error("Error al procesar:", error);
      alert("❌ Ocurrió un error al intentar procesar la venta.");
    }
  };

  return (
    <div className="pos-container">
      
      {/* PANEL IZQUIERDO (CATÁLOGO) - SE MANTIENE IGUAL */}
      <div className="pos-catalogo">
        <div className="pos-busqueda">
          <input 
            type="text" 
            placeholder="Buscar producto por nombre o código..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filtros-container">
          {categorias.map(cat => (
            <button 
              key={cat} 
              className={`btn-filtro ${filtroCategoria === cat ? 'activo' : ''}`}
              onClick={() => setFiltroCategoria(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="productos-grid">
          {productosFiltrados.map(prod => (
            <div key={prod.id} className={`producto-card ${prod.stock <= 0 ? 'agotado' : ''}`} onClick={() => agregarAlCarrito(prod)}>
              <div>
                <div className="prod-nombre">{prod.nombre}</div>
                <div className="prod-stock">
                  <span className={`stock-dot ${prod.stock <= 0 ? 'agotado' : prod.stock <= 5 ? 'bajo' : 'disponible'}`}></span>
                  Stock: {prod.stock}
                </div>
              </div>
              <div className="prod-precio">S/ {Number(prod.precio_venta).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PANEL DERECHO (CARRITO) */}
      <div className="pos-carrito">
        <div className="carrito-header" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <FiUser /> 
          <input 
            type="text" 
            placeholder="Nombre del Cliente (Opcional)" 
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
          />
        </div>

        <div className="carrito-items">
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '40px' }}>
              No hay productos en el ticket.
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.nombre}</div>
                  <div style={{ color: '#64748B', fontSize: '0.85rem' }}>S/ {Number(item.precio_venta).toFixed(2)} c/u</div>
                </div>
                <div className="cart-item-controles">
                  <button className="btn-cantidad" onClick={() => modificarCantidad(item.id, -1)}><FiMinus /></button>
                  <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                  <button className="btn-cantidad" onClick={() => modificarCantidad(item.id, 1)}><FiPlus /></button>
                  <button className="btn-eliminar-item" onClick={() => eliminarDelCarrito(item.id)}><FiTrash2 /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="carrito-footer">
          <div className="totales-fila">
            <span>Total a Pagar:</span>
            <span style={{ color: '#059669', fontSize: '1.5rem' }}>S/ {calcularTotal().toFixed(2)}</span>
          </div>

          {/* Ocultamos los métodos de pago si es solo una proforma */}
          {!esProforma && (
            <>
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '8px' }}>Método de Pago:</p>
              <div className="pagos-grid">
                {['Efectivo', 'Yape', 'Plin', 'Tarjeta'].map(metodo => (
                  <button key={metodo} className={`btn-pago ${metodoPago === metodo ? 'activo' : ''}`} onClick={() => setMetodoPago(metodo)}>
                    {metodo}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* NUEVA ESTRUCTURA DE ACCIONES FINALES */}
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#475569', fontWeight: '500' }}>
              <input 
                type="checkbox" 
                checked={esProforma} 
                onChange={(e) => setEsProforma(e.target.checked)} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Generar solo como Proforma (No descuenta stock)
            </label>

            <button 
              className="btn-cobrar" 
              onClick={procesarVenta} 
              disabled={carrito.length === 0}
              style={{ width: '100%', backgroundColor: esProforma ? '#3B82F6' : '#10B981' }}
            >
              {esProforma ? 'Generar Proforma y Descargar PDF' : 'Procesar Venta y Descargar PDF'}
            </button>
            
          </div>
        </div>
      </div>

    </div>
  );
};

export default PuntoVenta;