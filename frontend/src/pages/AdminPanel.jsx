import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  FiUsers, 
  FiActivity, 
  FiUser, 
  FiPower, 
  FiShield, 
  FiBox, 
  FiTrash2, 
  FiPlus,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import { evaluatePasswordStrength } from '../utils/passwordValidator';
import PerfilTrabajador from './PerfilTrabajador'; // Reutilizamos el componente que ya creaste
import '../css/Inventario.css'; // Reutilizamos estilos base
import '../css/auth/Register.css'; // Estilos premium para el registro

const PanelAdmin = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('usuarios'); // Agregaremos 'categorias' a las opciones  
  const [empleados, setEmpleados] = useState([]);
  const [logs, setLogs] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);
  const [nuevaCat, setNuevaCat] = useState({ nombre: '', prefijo_codigo: '', campos: [] });
  const [nombreCat, setNombreCat] = useState('');
  
  // Estados para el Registro de Trabajadores
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false);
  const [formRegistroData, setFormRegistroData] = useState({
    nombre: '', apellidos: '', correo: '', celular: '', dni: '', password: '', confirmPassword: ''
  });
  const [registroAlert, setRegistroAlert] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  useEffect(() => {
    if (activeTab === 'usuarios') cargarEmpleados();
    if (activeTab === 'auditoria') cargarLogs();
    if (activeTab === 'categorias') cargarCategorias();
  }, [activeTab]);

  const cargarCategorias = async () => {
    try {
      const response = await api.get('/categorias');
      setCategorias(response.data);
    } catch (error) {
      console.error("Error al cargar categorías");
    }
  };

  const agregarCampoANuevaCat = () => {
    setNuevaCat({
      ...nuevaCat,
      campos: [...nuevaCat.campos, { label: '', tipo: 'text', opcionesRaw: '' }]
    });
  };

  const eliminarCampoDeNuevaCat = (index) => {
    setNuevaCat({
      ...nuevaCat,
      campos: nuevaCat.campos.filter((_, i) => i !== index)
    });
  };

  const actualizarCampoNuevaCat = (index, property, value) => {
    const nuevosCampos = [...nuevaCat.campos];
    nuevosCampos[index][property] = value;
    setNuevaCat({ ...nuevaCat, campos: nuevosCampos });
  };

  const guardarNuevaCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCat.nombre || !nuevaCat.prefijo_codigo) {
      return alert("⚠️ Por favor completa el nombre y prefijo.");
    }

    const plantilla_campos = nuevaCat.campos.map(c => {
      const nombreField = c.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const opciones = c.tipo === 'select' 
        ? c.opcionesRaw.split(',').map(o => o.trim()).filter(Boolean)
        : [];
      return {
        nombre: nombreField,
        label: c.label,
        tipo: c.tipo,
        opciones: opciones
      };
    });

    try {
      await api.post('/categorias', {
        nombre: nuevaCat.nombre,
        prefijo_codigo: nuevaCat.prefijo_codigo.toUpperCase(),
        plantilla_campos: plantilla_campos
      });
      alert("✅ Categoría creada exitosamente.");
      setMostrarModalCategoria(false);
      setNuevaCat({ nombre: '', prefijo_codigo: '', campos: [] });
      cargarCategorias();
    } catch (error) {
      alert(`❌ Error al crear categoría: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRegistroChange = (e) => {
    const { name, value } = e.target;
    setFormRegistroData({ ...formRegistroData, [name]: value });
    setRegistroAlert(null);

    if (name === 'password') {
      setPasswordStrength(evaluatePasswordStrength(value));
    }
  };

  const ejecutarRegistroTrabajador = async (e) => {
    e.preventDefault();
    setRegistroAlert(null);

    // 1. Validación de campos vacíos
    const hasEmptyFields = !formRegistroData.nombre.trim() || !formRegistroData.apellidos.trim() || 
                           !formRegistroData.correo.trim() || !formRegistroData.celular.trim() || 
                           !formRegistroData.dni.trim() || !formRegistroData.password.trim() || 
                           !formRegistroData.confirmPassword.trim();
    if (hasEmptyFields) {
      setRegistroAlert({ type: 'error', message: 'Por favor, completa todos los campos del formulario.' });
      return;
    }

    // 2. Validación de celular (9 dígitos)
    if (formRegistroData.celular.length !== 9 || !/^\d+$/.test(formRegistroData.celular)) {
      setRegistroAlert({ type: 'error', message: 'El celular debe tener exactamente 9 dígitos numéricos.' });
      return;
    }

    // 3. DNI (8 dígitos)
    if (formRegistroData.dni.length !== 8 || !/^\d+$/.test(formRegistroData.dni)) {
      setRegistroAlert({ type: 'error', message: 'El DNI debe tener exactamente 8 dígitos numéricos.' });
      return;
    }

    // 4. Contraseñas coinciden
    if (formRegistroData.password !== formRegistroData.confirmPassword) {
      setRegistroAlert({ type: 'error', message: 'Las contraseñas no coinciden. Inténtalo de nuevo.' });
      return;
    }

    try {
      await api.post('/admin/usuarios', {
        nombre: formRegistroData.nombre,
        apellidos: formRegistroData.apellidos,
        correo: formRegistroData.correo,
        celular: formRegistroData.celular,
        dni: formRegistroData.dni,
        password: formRegistroData.password
      });

      setRegistroAlert({ type: 'success', message: '✅ Trabajador registrado exitosamente con acceso aprobado.' });
      
      setTimeout(() => {
        setMostrarModalRegistro(false);
        setFormRegistroData({ nombre: '', apellidos: '', correo: '', celular: '', dni: '', password: '', confirmPassword: '' });
        setRegistroAlert(null);
        setPasswordStrength(null);
        cargarEmpleados();
      }, 1500);

    } catch (error) {
      setRegistroAlert({ type: 'error', message: error.response?.data?.message || 'Error al registrar el trabajador' });
    }
  };

  const cargarEmpleados = async () => {
    try {
      const response = await api.get('/admin/usuarios');
      setEmpleados(response.data);
    } catch (error) {
      console.error("Error al cargar empleados");
    }
  };

  const cargarLogs = async () => {
    try {
      const response = await api.get('/admin/auditoria');
      setLogs(response.data);
    } catch (error) {
      console.error("Error al cargar auditoría");
    }
  };

  const toggleEstadoUsuario = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'aprobado' ? 'inactivo' : 'aprobado';
    const accion = nuevoEstado === 'inactivo' ? 'SUSPENDER' : 'REACTIVAR';
    
    if (window.confirm(`¿Estás seguro de que deseas ${accion} a este empleado?`)) {
      try {
        await api.put(`/admin/usuarios/${id}/estado`, { estado: nuevoEstado });
        cargarEmpleados();
      } catch (error) {
        alert("Error al actualizar el estado del usuario.");
      }
    }
  };

  return (
    <div className="inventario-container">
      <div className="inventario-header" style={{ marginBottom: '10px' }}>
        <h1>Panel de Administración</h1>
      </div>

      {/* NAVEGACIÓN POR PESTAÑAS */}
      <div className="filtros-container" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0' }}>
        <button className={`btn-filtro ${activeTab === 'usuarios' ? 'activo' : ''}`} onClick={() => setActiveTab('usuarios')}>
          <FiUsers style={{ marginRight: '5px' }} /> Gestión de Empleados
        </button>
        <button className={`btn-filtro ${activeTab === 'categorias' ? 'activo' : ''}`} onClick={() => setActiveTab('categorias')}>
          <FiBox style={{ marginRight: '5px' }} /> Categorías de Inventario
        </button>
        <button className={`btn-filtro ${activeTab === 'auditoria' ? 'activo' : ''}`} onClick={() => setActiveTab('auditoria')}>
          <FiActivity style={{ marginRight: '5px' }} /> Registro de Eventos
        </button>
        <button className={`btn-filtro ${activeTab === 'perfil' ? 'activo' : ''}`} onClick={() => setActiveTab('perfil')}>
          <FiUser style={{ marginRight: '5px' }} /> Mi Perfil
        </button>
      </div>

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <div style={{ marginTop: '20px' }}>
        
        {/* PESTAÑA 1: GESTIÓN DE USUARIOS */}
        {activeTab === 'usuarios' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ color: '#64748B', margin: 0 }}>Administra los accesos del personal técnico y empleados del taller.</p>
              <button className="btn-seguridad" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => setMostrarModalRegistro(true)}>
                <FiPlus /> Registrar Trabajador
              </button>
            </div>

            <div className="tabla-wrapper">
              <table className="tabla-inventario">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Celular</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map(emp => (
                  <tr key={emp.id} style={{ opacity: emp.estado === 'inactivo' ? 0.6 : 1 }}>
                    <td style={{ fontWeight: 'bold' }}>{emp.nombre} {emp.apellidos}</td>
                    <td>{emp.correo}</td>
                    <td>{emp.celular}</td>
                    <td>
                      <span className={`estado-badge ${emp.estado === 'aprobado' ? 'estado-reparado' : 'estado-rojo'}`} style={{ backgroundColor: emp.estado === 'aprobado' ? '#DCFCE7' : '#FEE2E2', color: emp.estado === 'aprobado' ? '#166534' : '#991B1B' }}>
                        {emp.estado.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleEstadoUsuario(emp.id, emp.estado)}
                        style={{ background: emp.estado === 'aprobado' ? '#FEF2F2' : '#EFF6FF', color: emp.estado === 'aprobado' ? '#EF4444' : '#3B82F6', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
                      >
                        <FiPower /> {emp.estado === 'aprobado' ? 'Suspender Acceso' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
                  {empleados.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No hay empleados registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: AUDITORÍA Y REGISTRO DE EVENTOS */}
        {activeTab === 'auditoria' && (
          <div className="tabla-wrapper">
            <div style={{ padding: '15px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px', color: '#475569' }}>
              <FiShield color="#3B82F6" size={20} /> 
              <span>Este registro es inmutable. Muestra todas las acciones críticas realizadas por el personal.</span>
            </div>
            <table className="tabla-inventario">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Trabajador</th>
                  <th>Módulo</th>
                  <th>Acción Realizada</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.85rem', color: '#64748B' }}>
                      {new Date(log.fecha).toLocaleString('es-PE')}
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{log.nombre} {log.apellidos}</td>
                    <td><span style={{ background: '#E2E8F0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{log.modulo}</span></td>
                    <td style={{ color: log.accion.includes('ELIMIN') ? '#EF4444' : '#1E293B', fontWeight: log.accion.includes('ELIMIN') ? 'bold' : 'normal' }}>
                      {log.accion}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{log.detalles}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No hay eventos registrados aún.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* PESTAÑA 3: MI PERFIL (Reutilizamos exactamente el componente del trabajador) */}
        {activeTab === 'perfil' && (
          <div style={{ marginTop: '-20px' }}>
            <PerfilTrabajador hideHeader={true} />
          </div>
        )}

        {/* PESTAÑA 4: GESTIÓN DE CATEGORÍAS */}
        {activeTab === 'categorias' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <p style={{ color: '#64748B', margin: 0 }}>Crea y gestiona las categorías del inventario y define sus características específicas.</p>
              <button className="btn-seguridad" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => setMostrarModalCategoria(true)}>
                <FiPlus /> Nueva Categoría
              </button>
            </div>

            <div className="tabla-wrapper">
              <table className="tabla-inventario">
                <thead>
                  <tr>
                    <th>Nombre de la Categoría</th>
                    <th>Prefijo de Código</th>
                    <th>Campos Técnicos Configurados</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map(cat => {
                    const camposConfigurados = cat.plantilla_campos && cat.plantilla_campos.length > 0
                      ? cat.plantilla_campos.map(c => `${c.label} (${c.tipo})`).join(', ')
                      : 'Ninguno (Campos estándar)';
                    return (
                      <tr key={cat.id}>
                        <td style={{ fontWeight: 'bold' }}>{cat.nombre}</td>
                        <td><span style={{ fontFamily: 'monospace', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>{cat.prefijo_codigo}</span></td>
                        <td style={{ fontSize: '0.85rem', color: '#64748B' }}>{camposConfigurados}</td>
                      </tr>
                    );
                  })}
                  {categorias.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No hay categorías registradas.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* MODAL / FORMULARIO PARA CREAR CATEGORÍA */}
            {mostrarModalCategoria && (
              <div className="modal-sobrecapa" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '20px' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                  <h2 style={{ marginBottom: '10px', fontSize: '1.4rem' }}>Crear Nueva Categoría</h2>
                  <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '20px' }}>Configura el prefijo de código (ej: GPU para Tarjetas Gráficas) y añade las especificaciones técnicas que se le solicitarán al registrar el producto.</p>
                  
                  <form onSubmit={guardarNuevaCategoria}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                      <div className="input-group-auth" style={{ flex: 2 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>Nombre de Categoría</label>
                        <input type="text" placeholder="Ej: Tarjeta Gráfica" value={nuevaCat.nombre} onChange={(e) => setNuevaCat({ ...nuevaCat, nombre: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                      </div>
                      <div className="input-group-auth" style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>Prefijo Código</label>
                        <input type="text" placeholder="Ej: GPU" maxLength={5} value={nuevaCat.prefijo_codigo} onChange={(e) => setNuevaCat({ ...nuevaCat, prefijo_codigo: e.target.value })} required style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', textTransform: 'uppercase' }} />
                      </div>
                    </div>

                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>
                        📋 Campos Base (Incluidos por defecto en el formulario de productos):
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ background: 'white', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#1E293B', border: '1px solid #CBD5E1', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                          ✔️ Nombre
                        </span>
                        <span style={{ background: 'white', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#1E293B', border: '1px solid #CBD5E1', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                          ✔️ Precio Compra
                        </span>
                        <span style={{ background: 'white', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#1E293B', border: '1px solid #CBD5E1', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                          ✔️ Precio Venta
                        </span>
                        <span style={{ background: 'white', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#1E293B', border: '1px solid #CBD5E1', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                          ✔️ Stock Actual
                        </span>
                        <span style={{ background: 'white', padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', color: '#1E293B', border: '1px solid #CBD5E1', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                          ✔️ Stock Mínimo
                        </span>
                      </div>
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                        Estos datos comerciales siempre se solicitarán al registrar cualquier producto de esta categoría.
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '15px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1E293B' }}>Características Técnicas Específicas (Opcional)</h4>
                        <button type="button" onClick={agregarCampoANuevaCat} style={{ background: '#EFF6FF', color: '#3B82F6', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          + Añadir Campo
                        </button>
                      </div>

                      {nuevaCat.campos.map((campo, index) => (
                        <div key={index} style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '6px', background: '#F8FAFC', marginBottom: '10px', position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ flex: 2 }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Nombre del Campo (Visible)</label>
                              <input type="text" placeholder="Ej: VRAM (GB) o Velocidad" value={campo.label} onChange={(e) => actualizarCampoNuevaCat(index, 'label', e.target.value)} required style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.85rem' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Tipo de Campo</label>
                              <select value={campo.tipo} onChange={(e) => actualizarCampoNuevaCat(index, 'tipo', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.85rem' }}>
                                <option value="text">Caja de Texto</option>
                                <option value="select">Lista de Selección</option>
                              </select>
                            </div>
                            <button type="button" onClick={() => eliminarCampoDeNuevaCat(index)} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', marginTop: '16px' }}>
                              <FiTrash2 />
                            </button>
                          </div>

                          {campo.tipo === 'select' && (
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>Opciones de la lista (separadas por comas)</label>
                              <input type="text" placeholder="Ej: 8GB, 12GB, 16GB, 24GB" value={campo.opcionesRaw} onChange={(e) => actualizarCampoNuevaCat(index, 'opcionesRaw', e.target.value)} required style={{ width: '100%', padding: '6px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.85rem' }} />
                            </div>
                          )}
                        </div>
                      ))}
                      {nuevaCat.campos.length === 0 && <p style={{ color: '#94A3B8', fontSize: '0.8rem', textAlign: 'center', fontStyle: 'italic', margin: '20px 0' }}>La categoría no tendrá campos técnicos específicos, sólo se solicitarán los datos comerciales estándar.</p>}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '15px' }}>
                      <button type="button" className="btn-filtro" onClick={() => setMostrarModalCategoria(false)} style={{ margin: 0, padding: '10px 20px', fontSize: '0.9rem' }}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn-seguridad" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}>
                        Crear Categoría
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL PARA REGISTRAR TRABAJADOR */}
        {mostrarModalRegistro && (
          <div className="modal-overlay">
            <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h2 style={{ marginBottom: '5px', fontSize: '1.4rem', color: '#1E293B', fontWeight: 'bold' }}>Registrar Nuevo Trabajador</h2>
              <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '20px' }}>Completa los datos del nuevo empleado. El acceso se creará automáticamente como **Aprobado**.</p>
              
              {registroAlert && (
                <div className={`custom-alert ${registroAlert.type}`}>
                  {registroAlert.type === 'error' ? <FiAlertCircle size={20} /> : <FiCheckCircle size={20} />}
                  <span>{registroAlert.message}</span>
                </div>
              )}

              <form onSubmit={ejecutarRegistroTrabajador} className="auth-form-visual" noValidate>
                <div className="form-row-duo">
                  <div className="input-group-modern">
                    <FiUser className="input-icon" />
                    <input 
                      type="text" 
                      name="nombre" 
                      placeholder="Nombre" 
                      value={formRegistroData.nombre} 
                      onChange={handleRegistroChange} 
                      required 
                    />
                  </div>
                  <div className="input-group-modern">
                    <FiUser className="input-icon" />
                    <input 
                      type="text" 
                      name="apellidos" 
                      placeholder="Apellidos" 
                      value={formRegistroData.apellidos} 
                      onChange={handleRegistroChange} 
                      required 
                    />
                  </div>
                </div>

                <div className="input-group-modern">
                  <FiMail className="input-icon" />
                  <input 
                    type="email" 
                    name="correo" 
                    placeholder="Correo Electrónico" 
                    value={formRegistroData.correo} 
                    onChange={handleRegistroChange} 
                    required 
                  />
                </div>

                <div className="form-row-duo">
                  <div className="input-group-modern">
                    <FiPhone className="input-icon" />
                    <input 
                      type="text" 
                      name="celular" 
                      placeholder="Celular (9 dígitos)" 
                      maxLength="9" 
                      value={formRegistroData.celular} 
                      onChange={handleRegistroChange} 
                      required 
                    />
                  </div>
                  <div className="input-group-modern">
                    <FiCreditCard className="input-icon" />
                    <input 
                      type="text" 
                      name="dni" 
                      placeholder="DNI (8 dígitos)" 
                      maxLength="8" 
                      value={formRegistroData.dni} 
                      onChange={handleRegistroChange} 
                      required 
                    />
                  </div>
                </div>

                <div className="input-group-modern">
                  <FiLock className="input-icon" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    placeholder="Contraseña" 
                    value={formRegistroData.password} 
                    onChange={handleRegistroChange} 
                    required 
                  />
                  <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                {passwordStrength && (
                  <div className="strength-meter">
                    <div 
                      className="meter-bar" 
                      style={{ 
                        width: passwordStrength.label === 'Débil' ? '33%' : passwordStrength.label === 'Regular' ? '66%' : '100%', 
                        backgroundColor: passwordStrength.color 
                      }}
                    ></div>
                    <span>Seguridad: {passwordStrength.label}</span>
                  </div>
                )}

                <div className="input-group-modern">
                  <FiLock className="input-icon" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="confirmPassword" 
                    placeholder="Confirmar Contraseña" 
                    value={formRegistroData.confirmPassword} 
                    onChange={handleRegistroChange} 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: '15px', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-filtro" 
                    onClick={() => {
                      setMostrarModalRegistro(false);
                      setRegistroAlert(null);
                      setPasswordStrength(null);
                    }} 
                    style={{ margin: 0, padding: '10px 20px', fontSize: '0.9rem' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-seguridad" 
                    style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}
                  >
                    Registrar Empleado
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelAdmin;