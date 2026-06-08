import React, { useState } from 'react';
import api from '../../services/api';
import '../inventario/FormularioProducto.css'; // Reutilizamos los estilos corporativos que ya creaste
import { useToast } from '../../context/ToastContext';

// DICCIONARIO DE SERVICIOS ESTANDARIZADOS
const categoriasServicio = {
  'Computadora / Laptop': [
    'Formateo e Instalación de SO', 
    'Limpieza Física y Pasta Térmica', 
    'Instalación de Programas (Software)', 
    'Activación Office / Windows (Local/Remoto)'
  ],
  'Impresora': [
    'Sacado de aire de Dumper', 
    'Reset de Almohadillas', 
    'Limpieza de Cartuchos (HP)', 
    'Mantenimiento General / Limpieza', 
    'Llenado de Tinta'
  ],
  'Cámaras de Seguridad': [
    'Instalación de Cámaras', 
    'Configuración de Red / DVR', 
    'Mantenimiento / Reubicación'
  ]
};
const placeholders = {
  'Computadora / Laptop': 'Ej: Lenovo Thinkpad T480, HP Pavilion',
  'Impresora': 'Ej: Epson L3250, HP LaserJet',
  'Cámaras de Seguridad': 'Ej: Kit Hikvision 4 Cámaras, DVR Dahua'
};

const estadoServicioCamaras = {
  'agendado': 'Agendado',
  'instalado': 'Instalado'
};

const FormularioServicio = ({ cerrarFormulario, recargarTabla }) => {
  const { showToast } = useToast();
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [estadoPago, setEstadoPago] = useState('pendiente');
  const [metodoPago, setMetodoPago] = useState('Por definir');
  const [montoAdelanto, setMontoAdelanto] = useState('');
  const [estadoServicioCamaras, setEstadoServicioCamaras] = useState('agendado');
  

  // Datos principales para la base de datos
  const [datosServicio, setDatosServicio] = useState({
    cliente_nombre: '',
    marca_modelo: '', // Ej: HP Pavilion, Epson L3150
    precio: '',
    detalles_adicionales: '' // Por si el cliente deja un cargador o da una contraseña
  });

  // Arreglo para guardar los checkboxes seleccionados
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  

  const handleChange = (e) => {
    setDatosServicio({ ...datosServicio, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (servicio) => {
    if (serviciosSeleccionados.includes(servicio)) {
      setServiciosSeleccionados(serviciosSeleccionados.filter(s => s !== servicio));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, servicio]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (serviciosSeleccionados.length === 0 && !datosServicio.detalles_adicionales) {
      return showToast("Por favor, selecciona al menos un servicio o escribe los detalles.", 'error');
    }

    // Unimos la categoría con la marca para la columna 'equipo_dispositivo' de MySQL
    const equipoFinal = `${categoriaSeleccionada} - ${datosServicio.marca_modelo}`;
    
    // Unimos los checkboxes seleccionados con los detalles extra para la columna 'servicio_realizado'
    const descripcionFinal = `[${serviciosSeleccionados.join(', ')}] Detalles: ${datosServicio.detalles_adicionales}`;

    const payload = {
      cliente_nombre: datosServicio.cliente_nombre,
      equipo_dispositivo: equipoFinal,
      servicio_realizado: descripcionFinal,
      precio: datosServicio.precio,
      estado_pago: estadoPago,
      monto_adelanto: estadoPago === 'a_cuenta' ? Number(montoAdelanto) : 0,
      metodo_pago: metodoPago,
      estado: categoriaSeleccionada === 'Cámaras de Seguridad' ? estadoServicioCamaras : 'en_revision'
    };

    try {
      await api.post('/servicios/registrar', payload);
      showToast('Servicio Técnico registrado exitosamente.', 'success');
      
      // Limpiamos y volvemos a la tabla si es necesario
      if (recargarTabla) recargarTabla();
      if (cerrarFormulario) cerrarFormulario();
      
    } catch (error) {
      console.error("Error al registrar servicio:", error);
      showToast(`Error: ${error.response?.data?.message || 'Error en el servidor'}`, 'error');
    }
  };

  return (
    <div className="form-container">
      <h2>Registrar Ingreso al Taller</h2>
      
      <form onSubmit={handleSubmit}>
        {/* === DATOS DEL CLIENTE === */}
        <div className="input-group">
          <label>Nombre del Cliente</label>
          <input 
            type="text" 
            name="cliente_nombre" 
            placeholder="Ej: Juan Pérez"
            value={datosServicio.cliente_nombre} 
            onChange={handleChange} 
            required 
          />
        </div>

        {/* === SELECCIÓN DE CATEGORÍA === */}
        <div className="input-group">
          <label>Tipo de Equipo</label>
          <select 
            value={categoriaSeleccionada} 
            onChange={(e) => {
              setCategoriaSeleccionada(e.target.value);
              setServiciosSeleccionados([]); // Limpiamos los checks si cambia de equipo
              if (e.target.value === 'Cámaras de Seguridad') {
                setEstadoServicioCamaras('agendado');
              }
            }}
            required
          >
            <option value="">-- Selecciona el tipo de equipo --</option>
            {Object.keys(categoriasServicio).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {categoriaSeleccionada && (
          <div className="form-conditional-fields">
            <div className="input-group">
              <label>Marca y Modelo del Equipo</label>
              <input 
                type="text" 
                name="marca_modelo" 
                placeholder={placeholders[categoriaSeleccionada] || "Marca y modelo del equipo"} 
                value={datosServicio.marca_modelo} 
                onChange={handleChange} 
                required 
              />
            </div>

            {categoriaSeleccionada === 'Cámaras de Seguridad' && (
              <div className="input-group">
                <label>Estado del Servicio</label>
                <select value={estadoServicioCamaras} onChange={(e) => setEstadoServicioCamaras(e.target.value)} required>
                  <option value="agendado">📅 Agendado para fecha</option>
                  <option value="entregado">✅ Ya Instalado / Finalizado</option>
                </select>
              </div>
            )}

            <h3 className="form-section-title">Servicios a Realizar</h3>
            
            {/* RENDERIZADO DINÁMICO DE CHECKBOXES SEGÚN EL EQUIPO */}
            <div className="checkbox-grid">
              {categoriasServicio[categoriaSeleccionada].map(servicio => (
                <label key={servicio} className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={serviciosSeleccionados.includes(servicio)}
                    onChange={() => handleCheckboxChange(servicio)} 
                  />
                  <span>{servicio}</span>
                </label>
              ))}
            </div>

            <div className="input-group" style={{ marginTop: '15px' }}>
              <label>Detalles Adicionales / Contraseña del equipo / Accesorios dejados</label>
              <textarea 
                name="detalles_adicionales" 
                rows="3" 
                placeholder="Ej: Deja cargador original. Contraseña de Windows: 12345."
                value={datosServicio.detalles_adicionales} 
                onChange={handleChange} 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', resize: 'vertical' }}
              />
            </div>

            <h3 className="form-section-title">Información Comercial y Pago</h3>
            <div className="grid-2-cols">
              <div className="input-group">
                <label>Precio Acordado (S/)</label>
                <input 
                  type="number" 
                  step="0.10" 
                  name="precio" 
                  placeholder="0.00"
                  value={datosServicio.precio} 
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className="input-group">
                <label>Estado del Pago</label>
                <select 
                  value={estadoPago} 
                  onChange={(e) => {
                    setEstadoPago(e.target.value);
                    if (e.target.value !== 'a_cuenta') setMontoAdelanto('');
                    if (e.target.value === 'pendiente') setMetodoPago('Por definir');
                    else if (metodoPago === 'Por definir') setMetodoPago('Efectivo');
                  }} 
                  required
                >
                  <option value="pendiente">Pendiente (Cancela luego)</option>
                  <option value="a_cuenta">A Cuenta (Adelanto)</option>
                  <option value="cancelado">Cancelado (Pagado completo)</option>
                </select>
              </div>

              {estadoPago === 'a_cuenta' && (
                <div className="input-group">
                  <label>Monto de Adelanto (S/)</label>
                  <input 
                    type="number" 
                    step="0.10" 
                    value={montoAdelanto} 
                    onChange={(e) => setMontoAdelanto(e.target.value)} 
                    placeholder="0.00" 
                    required 
                  />
                </div>
              )}

              <div className="input-group">
                <label>Método de Pago</label>
                <select 
                  value={metodoPago} 
                  onChange={(e) => setMetodoPago(e.target.value)} 
                  disabled={estadoPago === 'pendiente'} 
                  required
                >
                  {estadoPago === 'pendiente' ? (
                    <option value="Por definir">Por definir</option>
                  ) : (
                    <>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                      <option value="Transferencia">Transferencia Bancaria</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-submit" style={{ marginTop: '20px' }}>
              Registrar Ingreso al Taller
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default FormularioServicio;