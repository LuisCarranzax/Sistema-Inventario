import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import FormularioServicio from '../../components/servicios/FormularioServicio';
import { 
  FiPlus, FiArrowLeft, FiTrash2, FiCheckCircle, FiTool, FiAlertCircle, FiDownload,
  FiActivity, FiSearch, FiCalendar, FiMonitor, FiPrinter, FiVideo, FiCreditCard, 
  FiAlertTriangle, FiClock, FiChevronDown, FiPackage 
} from 'react-icons/fi';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { exportarServiciosExcel, exportarServiciosPDF } from '../../services/exportServices';
import './Servicios.css';
import '../inventario/Inventario.css';
import { useToast } from '../../context/ToastContext';

const Servicios = () => {
  const { showToast } = useToast();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [servicios, setServicios] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroEquipo, setFiltroEquipo] = useState('Todos');
  const [filtroPago, setFiltroPago] = useState('Todos');
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [servicioDetalle, setServicioDetalle] = useState(null);

  // NUEVOS ESTADOS: Filtros de Fecha y Dropdown de Exportación
  const [rangoFecha, setRangoFecha] = useState('Todos los tiempos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [menuExportar, setMenuExportar] = useState(false);

  // Estados para selectores de filtro personalizados
  const [openFiltroEstado, setOpenFiltroEstado] = useState(false);
  const [openFiltroEquipo, setOpenFiltroEquipo] = useState(false);
  const [openFiltroPago, setOpenFiltroPago] = useState(false);
  const [openFiltroFecha, setOpenFiltroFecha] = useState(false);
  const [openEditEstado, setOpenEditEstado] = useState(false);
  const [openEditPagoEstado, setOpenEditPagoEstado] = useState(false);
  const [openEditPagoMetodo, setOpenEditPagoMetodo] = useState(false);

  // Referencias para cerrar menús al hacer clic afuera
  const dropdownRef = useRef(null);
  const refEstado = useRef(null);
  const refEquipo = useRef(null);
  const refPago = useRef(null);
  const refFecha = useRef(null);
  const refEditEstado = useRef(null);
  const refEditPagoEstado = useRef(null);
  const refEditPagoMetodo = useRef(null);

  // Opciones de Fecha
  const opcionesFecha = [
    { value: 'Todos los tiempos', label: 'Todos los tiempos', icon: <FiCalendar size={15} /> },
    { value: 'Hoy', label: 'Hoy', icon: <FiCalendar size={15} /> },
    { value: 'Ayer', label: 'Ayer', icon: <FiCalendar size={15} /> },
    { value: 'Este Mes', label: 'Este Mes', icon: <FiCalendar size={15} /> },
    { value: 'Personalizado', label: 'Rango Personalizado...', icon: <FiCalendar size={15} /> }
  ];

  // Opciones de Estado del Servicio con Iconos
  const opcionesEstado = [
    { value: 'Todos', label: 'Todos los estados', icon: <FiActivity size={15} /> },
    { value: 'En Revisión', label: 'En Revisión', icon: <FiSearch size={15} /> },
    { value: 'Reparados', label: 'Reparados', icon: <FiTool size={15} /> },
    { value: 'Entregados', label: 'Entregados', icon: <FiPackage size={15} /> },
    { value: 'Agendados', label: 'Agendados', icon: <FiCalendar size={15} /> },
    { value: 'Instalados', label: 'Instalados', icon: <FiCheckCircle size={15} /> }
  ];

  const opcionesEditEstado = [
    { value: 'en_revision', label: 'En Revisión', icon: <FiSearch size={15} /> },
    { value: 'reparado', label: 'Reparado', icon: <FiTool size={15} /> },
    { value: 'entregado', label: 'Entregado', icon: <FiPackage size={15} /> },
    { value: 'agendado', label: 'Agendado', icon: <FiCalendar size={15} /> },
    { value: 'instalado', label: 'Instalado', icon: <FiCheckCircle size={15} /> }
  ];

  // Opciones de Pago del Modal con Iconos
  const opcionesEditPagoEstado = [
    { value: 'pendiente', label: 'Pendiente', icon: <FiAlertTriangle size={15} color="#EF4444" /> },
    { value: 'a_cuenta', label: 'A Cuenta', icon: <FiClock size={15} color="#F59E0B" /> },
    { value: 'cancelado', label: 'Cancelado', icon: <FiCheckCircle size={15} color="#10B981" /> }
  ];

  const opcionesEditPagoMetodo = [
    { value: 'Por definir', label: 'Por definir', icon: <FiClock size={15} color="#64748B" /> },
    { value: 'Efectivo', label: 'Efectivo', icon: <FiCreditCard size={15} /> },
    { value: 'Yape', label: 'Yape', icon: <FiCreditCard size={15} /> },
    { value: 'Plin', label: 'Plin', icon: <FiCreditCard size={15} /> },
    { value: 'Transferencia', label: 'Transferencia Bancaria', icon: <FiCreditCard size={15} /> }
  ];

  // Opciones de Tipo de Equipo con Iconos
  const opcionesEquipo = [
    { value: 'Todos', label: 'Todos los equipos', icon: <FiMonitor size={15} /> },
    { value: 'Computadora / Laptop', label: 'Computadora / Laptop', icon: <FiMonitor size={15} /> },
    { value: 'Impresora', label: 'Impresora', icon: <FiPrinter size={15} /> },
    { value: 'Cámaras de Seguridad', label: 'Cámaras de Seguridad', icon: <FiVideo size={15} /> }
  ];

  // Opciones de Estado de Pago con Iconos
  const opcionesPago = [
    { value: 'Todos', label: 'Todos los pagos', icon: <FiCreditCard size={15} /> },
    { value: 'pendiente', label: 'Pendiente', icon: <FiAlertTriangle size={15} color="#EF4444" /> },
    { value: 'a_cuenta', label: 'A Cuenta', icon: <FiClock size={15} color="#F59E0B" /> },
    { value: 'cancelado', label: 'Cancelado', icon: <FiCheckCircle size={15} color="#10B981" /> }
  ];

  // ESTADOS PARA LA EDICIÓN DE PAGO EN EL MODAL
  const [editPagoEstado, setEditPagoEstado] = useState('cancelado');
  const [editPagoMetodo, setEditPagoMetodo] = useState('Efectivo');
  const [editPagoAdelanto, setEditPagoAdelanto] = useState('');
  const [editEstado, setEditEstado] = useState('');

  const handleVerDetalles = (serv) => {
    setServicioDetalle(serv);
    setEditPagoEstado(serv.estado_pago);
    setEditPagoMetodo(serv.metodo_pago === 'Por definir' ? 'Efectivo' : serv.metodo_pago);
    setEditPagoAdelanto(serv.monto_adelanto || '');
    setEditEstado(serv.estado);
  };

  const handleActualizarPago = async () => {
    try {
      await api.put(`/servicios/${servicioDetalle.id}/pago`, {
        estado_pago: editPagoEstado,
        metodo_pago: editPagoMetodo,
        monto_adelanto: editPagoEstado === 'a_cuenta' ? Number(editPagoAdelanto) : 0
      });
      showToast("Información de pago actualizada correctamente.", "success");
      setServicioDetalle(prev => ({
        ...prev,
        estado_pago: editPagoEstado,
        metodo_pago: editPagoMetodo,
        monto_adelanto: editPagoEstado === 'a_cuenta' ? Number(editPagoAdelanto) : 0
      }));
      cargarServicios();
    } catch (error) {
      console.error("Error al actualizar pago:", error);
      showToast("Error al actualizar la información de pago.", "error");
    }
  };

  const handleActualizarEstado = async () => {
    try {
      await api.put(`/servicios/${servicioDetalle.id}/estado`, { estado: editEstado });
      showToast("Estado del servicio actualizado correctamente.", "success");
      setServicioDetalle(prev => ({
        ...prev,
        estado: editEstado,
        fecha_entrega: editEstado === 'entregado' ? new Date().toISOString() : prev.fecha_entrega
      }));
      cargarServicios();
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      showToast("Error al actualizar el estado del servicio.", "error");
    }
  };


  // Diccionario para mapear los nombres del filtro con los de la Base de Datos
  const mapeoEstados = {
    'En Revisión': 'en_revision',
    'Reparados': 'reparado',
    'Entregados': 'entregado',
    'Agendados': 'agendado',
    'Instalados': 'instalado'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuExportar(false);
      }
      if (refEstado.current && !refEstado.current.contains(event.target)) {
        setOpenFiltroEstado(false);
      }
      if (refEditEstado.current && !refEditEstado.current.contains(event.target)) {
        setOpenEditEstado(false);
      }
      if (refEditPagoEstado.current && !refEditPagoEstado.current.contains(event.target)) {
        setOpenEditPagoEstado(false);
      }
      if (refEditPagoMetodo.current && !refEditPagoMetodo.current.contains(event.target)) {
        setOpenEditPagoMetodo(false);
      }
      if (refEquipo.current && !refEquipo.current.contains(event.target)) {
        setOpenFiltroEquipo(false);
      }
      if (refPago.current && !refPago.current.contains(event.target)) {
        setOpenFiltroPago(false);
      }
      if (refFecha.current && !refFecha.current.contains(event.target)) {
        setOpenFiltroFecha(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mostrarFormulario) {
      cargarServicios();
    }
  }, [mostrarFormulario]);

  const cargarServicios = async () => {
    try {
      const response = await api.get('/servicios');
      setServicios(response.data);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    }
  };

  const renderServicioRealizado = (texto) => {
    if (!texto) return '';
    const match = texto.match(/^\[([\s\S]*?)\](?:\s*Detalles:\s*([\s\S]*))?$/i);
    
    if (match) {
      const serviciosString = match[1] ? match[1].trim() : '';
      const servicios = serviciosString ? serviciosString.split(',').map(s => s.trim()).filter(Boolean) : [];
      const detalles = match[2] ? match[2].trim() : '';

      return (
        <div className="servicio-realizar-cell">
          {servicios.length > 0 && (
            <div className="servicio-tags">
              {servicios.map((s, idx) => (
                <span key={idx} className="servicio-tag-badge">
                  {s}
                </span>
              ))}
            </div>
          )}
          {detalles && (
            <div className="servicio-detalles-text">
              <strong>Detalles:</strong> {detalles}
            </div>
          )}
        </div>
      );
    }

    return <div className="servicio-realizar-cell">{texto}</div>;
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.put(`/servicios/${id}/estado`, { estado: nuevoEstado });
      showToast(`Estado actualizado a "${nuevoEstado.replace('_', ' ')}"`, 'success');
      cargarServicios(); // Recargamos para ver el cambio de color
    } catch (error) {
      showToast("Error al cambiar estado", 'error');
    }
  };

  const handleEliminarClick = (id, cliente) => {
    setConfirmarEliminar({ id, cliente });
  };

  const ejecutarEliminar = async () => {
    if (!confirmarEliminar) return;
    const { id, cliente } = confirmarEliminar;
    try {
      await api.delete(`/servicios/${id}`);
      showToast(`Servicio de "${cliente}" eliminado correctamente`, 'success');
      setConfirmarEliminar(null);
      cargarServicios();
    } catch (error) {
      showToast("Error al eliminar el servicio", 'error');
    }
  };

  // Lógica de filtrado combinada (Estado, Equipo, Pago, Fechas)
  const serviciosFiltrados = servicios.filter(serv => {
    const matchesEstado = filtroEstado === 'Todos' || serv.estado === mapeoEstados[filtroEstado];
    const matchesEquipo = filtroEquipo === 'Todos' || (serv.equipo_dispositivo && serv.equipo_dispositivo.startsWith(filtroEquipo));
    const matchesPago = filtroPago === 'Todos' || serv.estado_pago === filtroPago;
    
    // Filtro de Fechas Inmune a Zonas Horarias
    if (rangoFecha === 'Todos los tiempos') {
      return matchesEstado && matchesEquipo && matchesPago;
    }

    if (!serv.fecha_ingreso) {
      return false;
    }

    // Parseo seguro en hora local (AAAA-MM-DD)
    const dateStr = serv.fecha_ingreso.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    const fechaServ = new Date(year, month - 1, day);
    
    const hoy = new Date();
    const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    let coincideFecha = true;

    if (rangoFecha === 'Hoy') {
      coincideFecha = fechaServ.getTime() === hoyLocal.getTime();
    } else if (rangoFecha === 'Ayer') {
      const ayerLocal = new Date(hoyLocal);
      ayerLocal.setDate(ayerLocal.getDate() - 1);
      coincideFecha = fechaServ.getTime() === ayerLocal.getTime();
    } else if (rangoFecha === 'Este Mes') {
      coincideFecha = fechaServ.getMonth() === hoy.getMonth() && fechaServ.getFullYear() === hoy.getFullYear();
    } else if (rangoFecha === 'Personalizado') {
      if (fechaInicio && fechaFin) {
        const [iYear, iMonth, iDay] = fechaInicio.split('-').map(Number);
        const inicio = new Date(iYear, iMonth - 1, iDay);
        
        const [fYear, fMonth, fDay] = fechaFin.split('-').map(Number);
        const fin = new Date(fYear, fMonth - 1, fDay);
        
        coincideFecha = fechaServ >= inicio && fechaServ <= fin;
      } else {
        coincideFecha = false;
      }
    }

    return matchesEstado && matchesEquipo && matchesPago && coincideFecha;
  });

  const exportarExcel = () => {
    exportarServiciosExcel(serviciosFiltrados, rangoFecha);
    setMenuExportar(false);
  };

  const exportarPDF = () => {
    exportarServiciosPDF(serviciosFiltrados, rangoFecha, filtroEstado, filtroEquipo, filtroPago);
    setMenuExportar(false);
  };

  return (
    <div className="inventario-container">
      
      <div className="inventario-header">
        <h1>{mostrarFormulario ? 'Registrar Ingreso de Equipo' : 'Gestión de Taller y Servicios'}</h1>
        
        {mostrarFormulario ? (
          <button className="btn-filtro" onClick={() => setMostrarFormulario(false)}>
            <FiArrowLeft /> Volver a la lista
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '15px' }}>
            {/* Dropdown de Exportación */}
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

            <button className="btn-nuevo" onClick={() => setMostrarFormulario(true)}>
              <FiPlus size={20} /> Nuevo Ingreso
            </button>
          </div>
        )}
      </div>

      {mostrarFormulario ? (
        // Reutilizamos el formulario dinámico que creaste antes
        <FormularioServicio cerrarFormulario={() => setMostrarFormulario(false)} recargarTabla={cargarServicios} />
      ) : (
        <>
          {/* Panel de Filtros de Fecha */}
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

          {/* BARRA DE FILTROS EN GRUPO (DROPDOWNS PERSONALIZADOS CON ICONOS) */}
          <div className="filtros-dropdowns-bar">
            
            {/* Filtro por Estado */}
            <div className="filtro-select-group" ref={refEstado}>
              <label>Estado del Servicio</label>
              <div className="custom-select-container">
                <button 
                  type="button" 
                  className="custom-select-trigger" 
                  onClick={() => setOpenFiltroEstado(!openFiltroEstado)}
                >
                  <span className="custom-select-selected-value">
                    {opcionesEstado.find(o => o.value === filtroEstado)?.icon}
                    <span>{opcionesEstado.find(o => o.value === filtroEstado)?.label}</span>
                  </span>
                  <FiChevronDown className={`select-arrow ${openFiltroEstado ? 'open' : ''}`} />
                </button>
                {openFiltroEstado && (
                  <div className="custom-select-options">
                    {opcionesEstado.map(opt => (
                      <button 
                        type="button"
                        key={opt.value} 
                        className={`custom-select-option ${filtroEstado === opt.value ? 'selected' : ''}`}
                        onClick={() => {
                          setFiltroEstado(opt.value);
                          setOpenFiltroEstado(false);
                        }}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filtro por Tipo de Equipo */}
            <div className="filtro-select-group" ref={refEquipo}>
              <label>Tipo de Equipo</label>
              <div className="custom-select-container">
                <button 
                  type="button" 
                  className="custom-select-trigger" 
                  onClick={() => setOpenFiltroEquipo(!openFiltroEquipo)}
                >
                  <span className="custom-select-selected-value">
                    {opcionesEquipo.find(o => o.value === filtroEquipo)?.icon}
                    <span>{opcionesEquipo.find(o => o.value === filtroEquipo)?.label}</span>
                  </span>
                  <FiChevronDown className={`select-arrow ${openFiltroEquipo ? 'open' : ''}`} />
                </button>
                {openFiltroEquipo && (
                  <div className="custom-select-options">
                    {opcionesEquipo.map(opt => (
                      <button 
                        type="button"
                        key={opt.value} 
                        className={`custom-select-option ${filtroEquipo === opt.value ? 'selected' : ''}`}
                        onClick={() => {
                          setFiltroEquipo(opt.value);
                          setOpenFiltroEquipo(false);
                        }}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filtro por Estado de Pago */}
            <div className="filtro-select-group" ref={refPago}>
              <label>Estado de Pago</label>
              <div className="custom-select-container">
                <button 
                  type="button" 
                  className="custom-select-trigger" 
                  onClick={() => setOpenFiltroPago(!openFiltroPago)}
                >
                  <span className="custom-select-selected-value">
                    {opcionesPago.find(o => o.value === filtroPago)?.icon}
                    <span>{opcionesPago.find(o => o.value === filtroPago)?.label}</span>
                  </span>
                  <FiChevronDown className={`select-arrow ${openFiltroPago ? 'open' : ''}`} />
                </button>
                {openFiltroPago && (
                  <div className="custom-select-options">
                    {opcionesPago.map(opt => (
                      <button 
                        type="button"
                        key={opt.value} 
                        className={`custom-select-option ${filtroPago === opt.value ? 'selected' : ''}`}
                        onClick={() => {
                          setFiltroPago(opt.value);
                          setOpenFiltroPago(false);
                        }}
                      >
                        {opt.icon}
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="hint-text">
            <span>💡 Consejo: Selecciona cualquier fila de la tabla para ver el resumen financiero y detalles del servicio técnico.</span>
          </div>

          {/* TABLA PRINCIPAL */}
          <div className="tabla-wrapper">
            <table className="tabla-inventario">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '70px' }}>Ticket</th>
                  <th>Cliente</th>
                  <th>Equipo</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>Precio</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>Estado</th>
                  <th style={{ textAlign: 'center', width: '170px' }}>Pago</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Ingreso</th>
                  <th style={{ textAlign: 'center', width: '150px' }}>Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {serviciosFiltrados.length > 0 ? (
                  serviciosFiltrados.map((serv) => (
                    <tr key={serv.id} onClick={() => handleVerDetalles(serv)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 'bold', color: '#64748B', textAlign: 'center' }}>#{serv.id}</td>
                      <td style={{ fontWeight: 'bold', color: '#334155' }}>{serv.cliente_nombre}</td>
                      <td style={{ color: '#475569' }}>{serv.equipo_dispositivo}</td>
                      <td style={{ color: '#059669', fontWeight: 'bold', textAlign: 'right' }}>S/ {Number(serv.precio).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`estado-badge ${
                          serv.estado === 'en_revision' ? 'estado-revision' :
                          serv.estado === 'reparado' ? 'estado-reparado' :
                          serv.estado === 'entregado' ? 'estado-entregado' :
                          serv.estado === 'agendado' ? 'estado-agendado' : 'estado-instalado'
                        }`} style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '120px' }}>
                          {serv.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`pago-badge ${serv.estado_pago === 'pendiente' ? 'pago-pendiente' :
                          serv.estado_pago === 'a_cuenta' ? 'pago-a_cuenta' : 'pago-cancelado'
                        }`}
                        style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', minWidth: '150px' }}>
                          {serv.estado_pago === 'pendiente' ? 'Pendiente' :
                            serv.estado_pago === 'a_cuenta' ? `A Cuenta (${serv.metodo_pago})` : `Cancelado (${serv.metodo_pago})`}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', textAlign: 'center', whiteSpace: 'nowrap', lineHeight: '1.2' }}>
                        <div style={{ fontWeight: '600', color: '#334155' }}>
                          {new Date(serv.fecha_ingreso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <div style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '3px' }}>
                          {new Date(serv.fecha_ingreso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </td>
                      
                      <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        {/* Botones de acción rápida para el Taller */}
                        <div className="acciones-col">
                          {serv.equipo_dispositivo && serv.equipo_dispositivo.startsWith('Cámaras de Seguridad') && serv.estado === 'agendado' && (
                            <button className="btn-estado-listo" title="Marcar como Instalado" onClick={() => cambiarEstado(serv.id, 'instalado')}>
                              <FiCheckCircle size={14} /> Instalar
                            </button>
                          )}
                          <button className="btn-accion btn-eliminar" title="Eliminar" onClick={() => handleEliminarClick(serv.id, serv.cliente_nombre)}>
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                      No hay servicios registrados en esta categoría.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {confirmarEliminar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <FiAlertCircle size={40} className="modal-warning-icon" />
              <h2>¿Confirmar eliminación?</h2>
            </div>
            <p>
              ¿Estás seguro de que deseas eliminar el servicio técnico registrado de <strong>"{confirmarEliminar.cliente}"</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setConfirmarEliminar(null)}>
                Cancelar
              </button>
              <button className="btn-confirmar-eliminar" onClick={ejecutarEliminar}>
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Servicio */}
      {servicioDetalle && (
        <div className="modal-overlay" onClick={() => setServicioDetalle(null)}>
          <div className="modal-content modal-detalles-servicio" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-detalles">
              <h2>Detalles del Servicio Técnico #{servicioDetalle.id}</h2>
              <button className="btn-close-modal" onClick={() => setServicioDetalle(null)}>&times;</button>
            </div>
            
            <div className="modal-body-detalles">
              <div className="detalles-grid">
                <div className="detalle-card">
                  <h3>Información General</h3>
                  <div className="detalle-item">
                    <span className="detalle-label">Cliente:</span>
                    <span className="detalle-valor">{servicioDetalle.cliente_nombre}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-label">Equipo:</span>
                    <span className="detalle-valor">{servicioDetalle.equipo_dispositivo}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-label">Ingreso:</span>
                    <span className="detalle-valor">
                      {new Date(servicioDetalle.fecha_ingreso).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {servicioDetalle.fecha_entrega && (
                    <div className="detalle-item">
                      <span className="detalle-label">Entrega:</span>
                      <span className="detalle-valor">
                        {new Date(servicioDetalle.fecha_entrega).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="detalle-card">
                  <h3>Estado & Finanzas</h3>
                  <div className="detalle-item">
                    <span className="detalle-label">Estado Técnico:</span>
                    <span className={`estado-badge ${
                      servicioDetalle.estado === 'en_revision' ? 'estado-revision' :
                      servicioDetalle.estado === 'reparado' ? 'estado-reparado' :
                      servicioDetalle.estado === 'entregado' ? 'estado-entregado' :
                      servicioDetalle.estado === 'agendado' ? 'estado-agendado' : 'estado-instalado'
                    }`}>
                      {servicioDetalle.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-label">Precio Acordado:</span>
                    <span className="detalle-valor valor-precio">S/ {Number(servicioDetalle.precio).toFixed(2)}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-label">Estado de Pago:</span>
                    <span className={`pago-badge pago-${servicioDetalle.estado_pago}`}>
                      {servicioDetalle.estado_pago === 'pendiente' ? 'Pendiente' :
                       servicioDetalle.estado_pago === 'a_cuenta' ? 'A Cuenta' : 'Cancelado'}
                    </span>
                  </div>
                  {servicioDetalle.estado_pago === 'a_cuenta' && (
                    <div className="detalle-item">
                      <span className="detalle-label">Adelantado:</span>
                      <span className="detalle-valor">S/ {Number(servicioDetalle.monto_adelanto).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="detalle-item">
                    <span className="detalle-label">Método de Pago:</span>
                    <span className="detalle-valor">{servicioDetalle.metodo_pago}</span>
                  </div>
                </div>
              </div>

              <div className="detalle-seccion-full">
                <h3>Servicio Técnico y Tareas</h3>
                <div className="servicio-tareas-box">
                  {renderServicioRealizado(servicioDetalle.servicio_realizado)}
                </div>
              </div>

              {/* Formulario rápido para cambiar el estado de pago desde el modal */}
              {servicioDetalle.estado_pago !== 'cancelado' && (
                <div className="pago-update-box">
                  <h3>Registrar / Actualizar Pago</h3>
                  <div className="pago-update-form">
                    <div className="input-group-pago" ref={refEditPagoEstado}>
                      <label>Estado del Pago</label>
                      <div className="custom-select-container">
                        <button 
                          type="button" 
                          className="custom-select-trigger" 
                          onClick={() => setOpenEditPagoEstado(!openEditPagoEstado)}
                        >
                          <span className="custom-select-selected-value">
                            {opcionesEditPagoEstado.find(o => o.value === editPagoEstado)?.icon}
                            <span>{opcionesEditPagoEstado.find(o => o.value === editPagoEstado)?.label}</span>
                          </span>
                          <FiChevronDown className={`select-arrow ${openEditPagoEstado ? 'open' : ''}`} />
                        </button>
                        {openEditPagoEstado && (
                          <div className="custom-select-options" style={{ zIndex: 1100 }}>
                            {opcionesEditPagoEstado.map(opt => (
                              <button 
                                type="button"
                                key={opt.value} 
                                className={`custom-select-option ${editPagoEstado === opt.value ? 'selected' : ''}`}
                                onClick={() => {
                                  setEditPagoEstado(opt.value);
                                  setOpenEditPagoEstado(false);
                                  if (opt.value === 'pendiente') {
                                    setEditPagoMetodo('Por definir');
                                  } else if (editPagoMetodo === 'Por definir') {
                                    setEditPagoMetodo('Efectivo');
                                  }
                                }}
                              >
                                {opt.icon}
                                <span>{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {editPagoEstado === 'a_cuenta' && (
                      <div className="input-group-pago">
                        <label>Monto Adelanto (S/)</label>
                        <input 
                          type="number" 
                          step="0.10" 
                          value={editPagoAdelanto} 
                          onChange={(e) => setEditPagoAdelanto(e.target.value)} 
                          placeholder="0.00" 
                        />
                      </div>
                    )}

                    <div className="input-group-pago" ref={refEditPagoMetodo}>
                      <label>Método de Pago</label>
                      <div className="custom-select-container">
                        <button 
                          type="button" 
                          className="custom-select-trigger"
                          style={editPagoEstado === 'pendiente' ? { backgroundColor: '#F1F5F9', color: '#94A3B8', cursor: 'not-allowed', borderColor: '#E2E8F0' } : {}}
                          onClick={() => {
                            if (editPagoEstado !== 'pendiente') {
                              setOpenEditPagoMetodo(!openEditPagoMetodo);
                            }
                          }}
                        >
                          <span className="custom-select-selected-value">
                            {opcionesEditPagoMetodo.find(o => o.value === editPagoMetodo)?.icon}
                            <span>{opcionesEditPagoMetodo.find(o => o.value === editPagoMetodo)?.label}</span>
                          </span>
                          {editPagoEstado !== 'pendiente' && (
                            <FiChevronDown className={`select-arrow ${openEditPagoMetodo ? 'open' : ''}`} />
                          )}
                        </button>
                        {openEditPagoMetodo && editPagoEstado !== 'pendiente' && (
                          <div className="custom-select-options" style={{ zIndex: 1100 }}>
                            {opcionesEditPagoMetodo.filter(o => o.value !== 'Por definir').map(opt => (
                              <button 
                                type="button"
                                key={opt.value} 
                                className={`custom-select-option ${editPagoMetodo === opt.value ? 'selected' : ''}`}
                                onClick={() => {
                                  setEditPagoMetodo(opt.value);
                                  setOpenEditPagoMetodo(false);
                                }}
                              >
                                {opt.icon}
                                <span>{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="btn-actualizar-pago" onClick={handleActualizarPago}>
                      Actualizar Pago
                    </button>
                  </div>
                </div>
              )}

              {/* Formulario rápido para cambiar el estado técnico desde el modal */}
              {servicioDetalle.estado !== 'entregado' && servicioDetalle.estado !== 'instalado' && (
                <div className="estado-update-box">
                  <h3>Actualizar Estado del Servicio</h3>
                  <div className="pago-update-form">
                    <div className="input-group-pago" ref={refEditEstado}>
                      <label>Estado Técnico</label>
                      <div className="custom-select-container">
                        <button 
                          type="button" 
                          className="custom-select-trigger" 
                          onClick={() => setOpenEditEstado(!openEditEstado)}
                        >
                          <span className="custom-select-selected-value">
                            {opcionesEditEstado.find(o => o.value === editEstado)?.icon}
                            <span>{opcionesEditEstado.find(o => o.value === editEstado)?.label}</span>
                          </span>
                          <FiChevronDown className={`select-arrow ${openEditEstado ? 'open' : ''}`} />
                        </button>
                        {openEditEstado && (
                          <div className="custom-select-options" style={{ zIndex: 1100 }}>
                            {opcionesEditEstado.map(opt => (
                              <button 
                                type="button"
                                key={opt.value} 
                                className={`custom-select-option ${editEstado === opt.value ? '' : ''}`}
                                onClick={() => {
                                  setEditEstado(opt.value);
                                  setOpenEditEstado(false);
                                }}
                              >
                                {opt.icon}
                                <span>{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button className="btn-actualizar-estado" onClick={handleActualizarEstado}>
                      Actualizar Estado
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setServicioDetalle(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Servicios;