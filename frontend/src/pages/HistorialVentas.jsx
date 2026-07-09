import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { FiDownload, FiFileText, FiCheckCircle, FiCalendar, FiChevronDown } from 'react-icons/fi';
import { generarDocumentoPDF } from '../../../backend/src/services/pdfServices';
import * as XLSX from 'xlsx';
import '../css/Inventario.css'; // Reutilizamos los estilos de tabla y filtros

const HistorialVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [rangoFecha, setRangoFecha] = useState('Este Mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todas'); // Todas, Ventas, Proformas
  const [menuExportar, setMenuExportar] = useState(false);

  // NUEVOS ESTADOS: Modal de previsualización y cargando detalle
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  

  // Estados de apertura para selectores personalizados
  const [openFiltroFecha, setOpenFiltroFecha] = useState(false);
  const [openFiltroTipo, setOpenFiltroTipo] = useState(false);

  // Referencias para cerrar menús al hacer clic afuera
  const dropdownRef = useRef(null);
  const refFecha = useRef(null);
  const refTipo = useRef(null);
  

  const opcionesFecha = [
    { value: 'Todos los tiempos', label: 'Todos los tiempos', icon: <FiCalendar size={15} /> },
    { value: 'Hoy', label: 'Hoy', icon: <FiCalendar size={15} /> },
    { value: 'Ayer', label: 'Ayer', icon: <FiCalendar size={15} /> },
    { value: 'Este Mes', label: 'Este Mes', icon: <FiCalendar size={15} /> },
    { value: 'Personalizado', label: 'Rango Personalizado...', icon: <FiCalendar size={15} /> }
  ];

  const opcionesTipo = [
    { value: 'Todas', label: 'Ambos (Ventas y Proformas)', icon: <FiFileText size={15} /> },
    { value: 'Ventas', label: 'Solo Ventas Reales', icon: <FiCheckCircle size={15} color="#059669" /> },
    { value: 'Proformas', label: 'Solo Proformas', icon: <FiFileText size={15} color="#64748B" /> }
  ];

  useEffect(() => {
    cargarHistorial();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuExportar(false);
      }
      if (refFecha.current && !refFecha.current.contains(event.target)) {
        setOpenFiltroFecha(false);
      }
      if (refTipo.current && !refTipo.current.contains(event.target)) {
        setOpenFiltroTipo(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cargarHistorial = async () => {
    try {
      const response = await api.get('/ventas/historial');
      setVentas(response.data);
    } catch (error) {
      console.error("Error al cargar historial de ventas", error);
    }
  };

  const verDetalleVenta = async (id) => {
    setCargandoDetalle(true);
    try {
      const response = await api.get(`/ventas/${id}`);
      setVentaSeleccionada(response.data);
    } catch (error) {
      console.error("Error al obtener detalle de venta:", error);
      alert("Error al cargar los detalles del recibo.");
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Lógica de Filtros (Fecha y Tipo - Inmune a desfases horarios)
  const ventasFiltradas = ventas.filter(v => {
    // Filtro por Tipo
    let coincideTipo = true;
    if (filtroTipo === 'Ventas') coincideTipo = v.es_proforma === 0;
    if (filtroTipo === 'Proformas') coincideTipo = v.es_proforma === 1;

    // Filtro por Fechas Inmune a Zonas Horarias
    if (rangoFecha === 'Todos los tiempos') {
      return coincideTipo;
    }

    if (!v.fecha_venta) return false;

    const dateStr = v.fecha_venta.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    const fechaV = new Date(year, month - 1, day);
    
    const hoy = new Date();
    const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    let coincideFecha = true;

    if (rangoFecha === 'Hoy') {
      coincideFecha = fechaV.getTime() === hoyLocal.getTime();
    } else if (rangoFecha === 'Ayer') {
      const ayerLocal = new Date(hoyLocal);
      ayerLocal.setDate(ayerLocal.getDate() - 1);
      coincideFecha = fechaV.getTime() === ayerLocal.getTime();
    } else if (rangoFecha === 'Este Mes') {
      coincideFecha = fechaV.getMonth() === hoy.getMonth() && fechaV.getFullYear() === hoy.getFullYear();
    } else if (rangoFecha === 'Personalizado') {
      if (fechaInicio && fechaFin) {
        const [iYear, iMonth, iDay] = fechaInicio.split('-').map(Number);
        const inicio = new Date(iYear, iMonth - 1, iDay);
        
        const [fYear, fMonth, fDay] = fechaFin.split('-').map(Number);
        const fin = new Date(fYear, fMonth - 1, fDay);
        
        coincideFecha = fechaV >= inicio && fechaV <= fin;
      } else {
        coincideFecha = false;
      }
    }

    return coincideTipo && coincideFecha;
  });

  // Exportación a Excel
  const exportarExcel = () => {
    const datos = ventasFiltradas.map(v => ({
      "N° Ticket": `#${v.id}`,
      "Tipo": v.es_proforma ? 'Proforma' : 'Venta Real',
      "Medio de Pago": v.medio_pago || 'N/A',
      "Total (S/)": Number(v.total).toFixed(2),
      "Fecha": new Date(v.fecha_venta).toLocaleString('es-PE')
    }));
    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial_Ventas");
    XLSX.writeFile(workbook, `Historial_Ventas_${rangoFecha.replace(' ', '_')}.xlsx`);
    setMenuExportar(false);
  };

  return (
    <div className="inventario-container">
      <div className="inventario-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>Historial de Ventas</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '5px' }}>
            Audita y exporta los tickets de caja y proformas.
          </p>
        </div>
        
        <div className="exportar-container" ref={dropdownRef}>
          <button className="btn-exportar" onClick={() => setMenuExportar(!menuExportar)}>
            <FiDownload /> Exportar ▼
          </button>
          {menuExportar && (
            <div className="dropdown-exportar">
              {/* Puedes añadir la de PDF también copiando tu lógica anterior */}
              <button className="dropdown-item-export" onClick={exportarExcel}>📊 Descargar Excel</button>
            </div>
          )}
        </div>
      </div>

      <div className="filtros-fecha" style={{ overflow: 'visible' }}>
        <span style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Fecha:</span>
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
        
        <span style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.9rem', marginLeft: '15px' }}>Tipo:</span>
        <div className="custom-select-container" ref={refTipo} style={{ maxWidth: '250px' }}>
          <button 
            type="button" 
            className="custom-select-trigger" 
            onClick={() => setOpenFiltroTipo(!openFiltroTipo)}
          >
            <span className="custom-select-selected-value">
              {opcionesTipo.find(o => o.value === filtroTipo)?.icon}
              <span>{opcionesTipo.find(o => o.value === filtroTipo)?.label}</span>
            </span>
            <FiChevronDown className={`select-arrow ${openFiltroTipo ? 'open' : ''}`} />
          </button>
          {openFiltroTipo && (
            <div className="custom-select-options">
              {opcionesTipo.map(opt => (
                <button 
                  type="button"
                  key={opt.value} 
                  className={`custom-select-option ${filtroTipo === opt.value ? 'selected' : ''}`}
                  onClick={() => {
                    setFiltroTipo(opt.value);
                    setOpenFiltroTipo(false);
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

      <div className="tabla-wrapper">
        <table className="tabla-inventario">
          <thead>
            <tr>
              <th>Ticket N°</th>
              <th>Cliente</th>
              <th>Tipo de Registro</th>
              <th>Medio de Pago</th>
              <th>Total Cobrado</th>
              <th>Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
            {ventasFiltradas.map((v) => (
              <tr key={v.id} onClick={() => verDetalleVenta(v.id)} style={{ cursor: 'pointer' }} title="Click para ver recibo">
                <td style={{ fontWeight: 'bold' }}>#{v.id}</td>
                <td style={{ fontWeight: 'bold' }}>{v.cliente_nombre || 'Cliente General'}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: v.es_proforma ? '#64748B' : '#059669', fontWeight: 'bold' }}>
                    {v.es_proforma ? <><FiFileText/> Proforma</> : <><FiCheckCircle/> Venta Real</>}
                  </span>
                </td>
                <td style={{ textTransform: 'capitalize' }}>{v.es_proforma ? '-' : (v.medio_pago || 'Efectivo')}</td>
                <td style={{ fontWeight: 'bold', fontSize: '1.1rem', color: v.es_proforma ? '#475569' : '#059669' }}>S/ {Number(v.total).toFixed(2)}</td>
                <td style={{ fontSize: '0.85rem', color: '#475569' }}>{new Date(v.fecha_venta).toLocaleString('es-PE')}</td>
              </tr>
            ))}
            {ventasFiltradas.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No se encontraron registros.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalle de Venta estilo Recibo Térmico */}
      {ventaSeleccionada && (
        <div className="modal-overlay" onClick={() => setVentaSeleccionada(null)}>
          <div className="modal-content modal-recibo-venta" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '0', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'white' }}>
            
            {/* Cabecera del recibo */}
            <div className="recibo-header" style={{ padding: '24px 20px', textAlign: 'center', background: '#F8FAFC', borderBottom: '2px dashed #E2E8F0' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1E3A8A', margin: '0', letterSpacing: '-0.5px' }}>COMPUDOCTOR</h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '5px 0 0 0' }}>Soluciones Tecnológicas Integrales</p>
              
              <div style={{ 
                marginTop: '12px', 
                padding: '6px 14px', 
                borderRadius: '20px', 
                display: 'inline-flex', 
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem', 
                fontWeight: '700', 
                backgroundColor: ventaSeleccionada.es_proforma ? '#F1F5F9' : '#ECFDF5', 
                color: ventaSeleccionada.es_proforma ? '#475569' : '#047857',
                border: ventaSeleccionada.es_proforma ? '1px solid #E2E8F0' : '1px solid #A7F3D0'
              }}>
                {ventaSeleccionada.es_proforma ? <><FiFileText size={13} /> PROFORMA DE COTIZACIÓN</> : <><FiCheckCircle size={13} /> TICKET DE VENTA</>}
              </div>
            </div>

            {/* Datos Generales del Recibo */}
            <div style={{ padding: '20px', fontSize: '0.88rem', color: '#334155' }}>
              
              <div style={{ display: 'flex', justifycontent: 'space-between', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Ticket N°:</span>
                <span style={{ fontWeight: '700', color: '#0F172A', textAlign: 'right' }}>#{String(ventaSeleccionada.id).padStart(6, '0')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Fecha y Hora:</span>
                <span style={{ textAlign: 'right' }}>{new Date(ventaSeleccionada.fecha_venta).toLocaleString('es-PE')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Cliente:</span>
                <span style={{ fontWeight: '600', color: '#0F172A', textAlign: 'right' }}>{ventaSeleccionada.cliente_nombre || 'Cliente General'}</span>
              </div>
              {!ventaSeleccionada.es_proforma && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: '#64748B' }}>Método de Pago:</span>
                  <span style={{ fontWeight: '600', color: '#0F172A', textTransform: 'capitalize', textAlign: 'right' }}>{ventaSeleccionada.medio_pago || 'Efectivo'}</span>
                </div>
              )}

              {/* Línea divisoria */}
              <div style={{ borderTop: '2px dashed #E2E8F0', margin: '15px 0' }}></div>

              {/* Detalle de Artículos */}
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0F172A', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detalle de Artículos</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', paddingRight: '5px' }}>
                {ventaSeleccionada.productos?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                    <div style={{ flex: '1', paddingRight: '10px' }}>
                      <div style={{ fontWeight: '600', color: '#1E293B' }}>{item.nombre}</div>
                      <div style={{ color: '#64748B', fontSize: '0.8rem', marginTop: '2px' }}>
                        {item.cantidad} x S/ {Number(item.precio_unitario).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', color: '#0F172A' }}>
                      S/ {Number(item.subtotal).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Línea divisoria */}
              <div style={{ borderTop: '2px dashed #E2E8F0', margin: '15px 0' }}></div>

              {/* Fila del Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.25rem', fontWeight: '800' }}>
                <span style={{ color: '#0F172A' }}>TOTAL:</span>
                <span style={{ color: '#059669' }}>S/ {Number(ventaSeleccionada.total).toFixed(2)}</span>
              </div>

            </div>

            {/* Acciones del Modal */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
              <button 
                type="button" 
                className="btn-cancelar" 
                onClick={() => setVentaSeleccionada(null)}
                style={{ flex: 1, padding: '10px', fontSize: '0.88rem', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#E2E8F0', color: '#475569' }}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn-nuevo" 
                onClick={() => {
                  const carritoMapped = ventaSeleccionada.productos.map(p => ({
                    id: p.producto_id,
                    nombre: p.nombre,
                    cantidad: p.cantidad,
                    precio_venta: Number(p.precio_unitario),
                    stock: p.cantidad
                  }));
                  generarDocumentoPDF(
                    ventaSeleccionada.id, 
                    carritoMapped, 
                    ventaSeleccionada.total, 
                    ventaSeleccionada.es_proforma, 
                    ventaSeleccionada.cliente_nombre, 
                    ventaSeleccionada.medio_pago
                  );
                }}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  gap: '6px', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  padding: '10px', 
                  fontSize: '0.88rem', 
                  fontWeight: '700', 
                  backgroundColor: '#3B82F6', 
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <FiDownload /> PDF
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialVentas;