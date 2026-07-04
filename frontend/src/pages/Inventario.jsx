import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import FormularioProducto from '../components/inventario/FormularioProducto';
import { FiPlus, FiEdit2, FiTrash2, FiDownload, FiCalendar, FiChevronDown } from 'react-icons/fi';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { exportarInventarioExcel, exportarInventarioPDF } from '../services/exportServices';
import '../css/Inventario.css';

const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  
  
  // NUEVOS ESTADOS: Filtros de Fecha y Dropdown de Exportación
  const [rangoFecha, setRangoFecha] = useState('Todos los tiempos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [menuExportar, setMenuExportar] = useState(false);
  
  // Estados para selectores de fecha personalizados
  const [openFiltroFecha, setOpenFiltroFecha] = useState(false);

  // Referencias para cerrar el dropdown si hacen clic afuera
  const dropdownRef = useRef(null);
  const refFecha = useRef(null);

  const opcionesFecha = [
    { value: 'Todos los tiempos', label: 'Todos los tiempos', icon: <FiCalendar size={15} /> },
    { value: 'Hoy', label: 'Hoy', icon: <FiCalendar size={15} /> },
    { value: 'Ayer', label: 'Ayer', icon: <FiCalendar size={15} /> },
    { value: 'Este Mes', label: 'Este Mes', icon: <FiCalendar size={15} /> },
    { value: 'Personalizado', label: 'Rango Personalizado...', icon: <FiCalendar size={15} /> }
  ];

  useEffect(() => {
    if (!mostrarFormulario) cargarInventario();
  }, [mostrarFormulario]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuExportar(false);
      }
      if (refFecha.current && !refFecha.current.contains(event.target)) {
        setOpenFiltroFecha(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cargarInventario = async () => {
    try {
      const response = await api.get('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error("Error al cargar el inventario", error);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto: ${nombre}?`)) {
      try {
        await api.delete(`/productos/${id}`);
        cargarInventario();
      } catch (error) {
        alert("Error al eliminar el producto");
      }
    }
  };

  const abrirEdicion = (producto) => {
    setProductoAEditar(producto);
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setProductoAEditar(null);
    setMostrarFormulario(false);
  };

  // ==========================================
  // LÓGICA DE FILTRADO (Categoría + Fechas)
  // ==========================================
  const categorias = ['Todos', ...new Set(productos.map(p => p.categoria_nombre))];

  const productosFiltrados = productos.filter(prod => {
    // 1. Filtro por Categoría
    const coincideCategoria = filtroCategoria === 'Todos' || prod.categoria_nombre === filtroCategoria;
    
    // 2. Filtro por Fechas (Rango Inteligente Inmune a Desfases Horarios)
    if (rangoFecha === 'Todos los tiempos') {
      return coincideCategoria;
    }

    if (!prod.fecha_abastecimiento) {
      return false;
    }

    // Parseo seguro en hora local (AAAA-MM-DD)
    const dateStr = prod.fecha_abastecimiento.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    const fechaProd = new Date(year, month - 1, day);
    
    const hoy = new Date();
    const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    let coincideFecha = true;

    if (rangoFecha === 'Hoy') {
      coincideFecha = fechaProd.getTime() === hoyLocal.getTime();
    } else if (rangoFecha === 'Ayer') {
      const ayerLocal = new Date(hoyLocal);
      ayerLocal.setDate(ayerLocal.getDate() - 1);
      coincideFecha = fechaProd.getTime() === ayerLocal.getTime();
    } else if (rangoFecha === 'Este Mes') {
      coincideFecha = fechaProd.getMonth() === hoy.getMonth() && fechaProd.getFullYear() === hoy.getFullYear();
    } else if (rangoFecha === 'Personalizado') {
      if (fechaInicio && fechaFin) {
        const [iYear, iMonth, iDay] = fechaInicio.split('-').map(Number);
        const inicio = new Date(iYear, iMonth - 1, iDay);
        
        const [fYear, fMonth, fDay] = fechaFin.split('-').map(Number);
        const fin = new Date(fYear, fMonth - 1, fDay);
        
        coincideFecha = fechaProd >= inicio && fechaProd <= fin;
      } else {
        coincideFecha = false;
      }
    }

    return coincideCategoria && coincideFecha;
  });

  // ==========================================
  // LÓGICA DE EXPORTACIÓN (Llamando al Servicio)
  // ==========================================
  const exportarExcel = () => {
    exportarInventarioExcel(productosFiltrados, rangoFecha);
    setMenuExportar(false);
  };

  const exportarPDF = () => {
    exportarInventarioPDF(productosFiltrados, rangoFecha, filtroCategoria);
    setMenuExportar(false);
  };

  return (
    <div className="inventario-container">
      
      <div className="inventario-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>Gestión de Inventario</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '5px' }}>
            Visualiza y exporta los ingresos de productos según la fecha.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          {/* Menú Dropdown de Exportación */}
          <div className="exportar-container" ref={dropdownRef}>
            <button className="btn-exportar" onClick={() => setMenuExportar(!menuExportar)}>
              <FiDownload /> Exportar ▼
            </button>
            {menuExportar && (
              <div className="dropdown-exportar">
                <button className="dropdown-item-export" onClick={exportarPDF}><FaFilePdf/>Descargar PDF</button>
                <button className="dropdown-item-export" onClick={exportarExcel}><FaFileExcel/>Descargar Excel</button>
              </div>
            )}
          </div>

          <button className="btn-nuevo" onClick={() => { setProductoAEditar(null); setMostrarFormulario(true); }}>
            <FiPlus size={20} /> Nuevo Producto
          </button>
        </div>
      </div>

      <>
          {/* NUEVO: Panel de Filtros Inteligentes (Personalizados con Emojis/Iconos) */}
          <div className="filtros-fecha" style={{ overflow: 'visible' }}>
            <span style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Filtrar por Fecha de Ingreso:</span>
            
            <div className="custom-select-container" ref={refFecha} style={{ maxWidth: '240px' }}>
              <button 
                type="button" 
                className="custom-select-trigger" 
                onClick={() => setOpenFiltroFecha(!openFiltroFecha)}
              >
                <span className="custom-select-selected-value">
                  {opcionesFecha.find(o => o.value === rangoFecha)?.icon}
                  <span>{opcionesFecha.find(o => o.value === rangoFecha)?.label}</span>
                </span>
                <FiChevronDown className={`select-arrow ${openFiltroFecha ? 'open' : ''}`} />
              </button>
              {openFiltroFecha && (
                <div className="custom-select-options">
                  {opcionesFecha.map(opt => (
                    <button 
                      type="button"
                      key={opt.value} 
                      className={`custom-select-option ${rangoFecha === opt.value ? 'selected' : ''}`}
                      onClick={() => {
                        setRangoFecha(opt.value);
                        setOpenFiltroFecha(false);
                      }}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {rangoFecha === 'Personalizado' && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="date" className="input-fecha" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                <span style={{ color: '#64748B' }}>hasta</span>
                <input type="date" className="input-fecha" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            )}
          </div>

          <div className="filtros-container">
            {categorias.map(cat => (
              <button key={cat} className={`btn-filtro ${filtroCategoria === cat ? 'activo' : ''}`} onClick={() => setFiltroCategoria(cat)}>
                {cat}
              </button>
            ))}
          </div>

          <div className="tabla-wrapper">
            <table className="tabla-inventario">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Precio Compra</th>
                  <th>Precio Venta</th>
                  <th>Stock</th>
                  <th>Ingresado el</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((prod) => (
                  <tr key={prod.id}>
                    <td style={{ fontWeight: 'bold', color: '#64748B' }}>{prod.codigo_interno}</td>
                    <td>{prod.nombre}</td>
                    <td>S/ {Number(prod.precio_compra).toFixed(2)}</td>
                    <td>S/ {Number(prod.precio_venta).toFixed(2)}</td>
                    <td>
                      <span className={`estado-badge ${prod.stock <= prod.stock_minimo ? 'estado-rojo' : 'estado-reparado'}`} style={{ backgroundColor: prod.stock <= prod.stock_minimo ? '#FEE2E2' : '#DCFCE7', color: prod.stock <= prod.stock_minimo ? '#991B1B' : '#166534' }}>
                        {prod.stock} und.
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(prod.fecha_abastecimiento).toLocaleDateString('es-PE')}</td>
                    <td>
                      <div className="acciones-col">
                        <button className="btn-accion btn-editar" title="Editar" onClick={() => abrirEdicion(prod)}>
                          <FiEdit2 size={16} />
                        </button>
                        <button className="btn-accion btn-eliminar" title="Eliminar" onClick={() => handleEliminar(prod.id, prod.nombre)}>
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {productosFiltrados.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No se encontraron productos en estas fechas o categoría.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>

      {/* Modal de Formulario de Producto */}
      {mostrarFormulario && (
        <div className="modal-overlay" onClick={cerrarFormulario}>
          <div className="modal-content modal-formulario-producto" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', textAlign: 'left' }}>
            <div className="modal-header-detalles" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#0F172A' }}>
                {productoAEditar ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h2>
              <button className="btn-close-modal" onClick={cerrarFormulario} style={{ fontSize: '1.75rem', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}>&times;</button>
            </div>
            <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '5px' }}>
              <FormularioProducto cerrarFormulario={cerrarFormulario} productoAEditar={productoAEditar} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventario;