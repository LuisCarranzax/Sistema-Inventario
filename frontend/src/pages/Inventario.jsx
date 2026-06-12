import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FormularioProducto from '../components/inventario/FormularioProducto';
import { FiPlus, FiArrowLeft, FiEdit, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';
import '../css/Inventario.css';

const Inventario = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productos, setProductos] = useState([]);
  const [filtroActivo, setFiltroActivo] = useState('Todos');
  
  // NUEVO: Estado para saber si estamos editando un producto
  const [productoAEditar, setProductoAEditar] = useState(null);

  const { showToast } = useToast();
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  const categoriasFiltro = ['Todos', 'Cargadores', 'Mouse', 'Mousepad', 'Cables PC'];

  useEffect(() => {
    if (!mostrarFormulario) {
      cargarProductos();
    }
  }, [mostrarFormulario]);

  const cargarProductos = async () => {
    try {
      const response = await api.get('/productos');
      setProductos(response.data);
    } catch (error) {
      console.error("Error al cargar el inventario:", error);
    }
  };

  // NUEVO: Función para formatear fechas (ej: "13/05/2026")
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'N/A';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-PE'); // Formato de Perú (Día/Mes/Año)
  };

  // NUEVO: Función para abrir el formulario en "Modo Edición"
  const handleEditar = (producto) => {
    setProductoAEditar(producto);
    setMostrarFormulario(true);
  };

  // NUEVO: Función para abrir el formulario en "Modo Creación"
  const handleNuevoProducto = () => {
    setProductoAEditar(null); // Limpiamos cualquier dato anterior
    setMostrarFormulario(true);
  };

  // NUEVO: Lógica de eliminación con Modal de Confirmación
  const handleEliminarClick = (id, nombre) => {
    setConfirmarEliminar({ id, nombre });
  };

  const ejecutarEliminar = async () => {
    if (!confirmarEliminar) return;
    const { id, nombre } = confirmarEliminar;
    try {
      await api.delete(`/productos/${id}`); // Petición DELETE a tu backend
      showToast(`Producto "${nombre}" eliminado correctamente`, 'success');
      setConfirmarEliminar(null);
      cargarProductos(); // Recargamos la tabla automáticamente
    } catch (error) {
      console.error("Error al eliminar:", error);
      showToast('Ocurrió un error al intentar eliminar el producto.', 'error');
    }
  };

  // Filtro local para la tabla
  const productosFiltrados = filtroActivo === 'Todos' 
    ? productos 
    // Asegúrate de que el backend te envíe el nombre de la categoría para poder filtrar
    : productos.filter(prod => prod.categoria_nombre === filtroActivo);

  return (
    <div className="inventario-container">
      <div className="inventario-header">
        <h1>{mostrarFormulario ? (productoAEditar ? 'Editar Producto' : 'Registrar Nuevo Producto') : 'Gestión de Inventario'}</h1>
        
        {mostrarFormulario ? (
          <button className="btn-filtro" onClick={() => setMostrarFormulario(false)}>
            <FiArrowLeft /> Volver a la lista
          </button>
        ) : (
          <button className="btn-nuevo" onClick={handleNuevoProducto}>
            <FiPlus size={20} /> Nuevo Producto
          </button>
        )}
      </div>

      {mostrarFormulario ? (
        // Pasamos el producto a editar como "prop" al formulario
        <FormularioProducto productoAEditar={productoAEditar} cerrarFormulario={() => setMostrarFormulario(false)} />
      ) : (
        <>
          <div className="filtros-container">
            {categoriasFiltro.map(cat => (
              <button 
                key={cat}
                className={`btn-filtro ${filtroActivo === cat ? 'activo' : ''}`}
                onClick={() => setFiltroActivo(cat)}
              >
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
                  <th>Precio Venta</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Fecha Ingreso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.map((prod) => (
                    <tr key={prod.id}>
                      <td style={{ fontWeight: 'bold', color: '#64748B' }}>{prod.codigo_interno}</td>
                      <td>{prod.nombre}</td>
                      <td>S/ {Number(prod.precio_venta).toFixed(2)}</td>
                      <td>{prod.stock}</td>
                      <td>
                        <span className={`stock-badge ${prod.stock <= prod.stock_minimo ? 'stock-low' : 'stock-ok'}`}>
                          {prod.stock === 0 ? 'Agotado' : prod.stock <= prod.stock_minimo ? 'Bajo' : 'Óptimo'}
                        </span>
                      </td>
                      {/* Mostrar la fecha de abastecimiento o registro */}
                      <td>{formatearFecha(prod.fecha_abastecimiento || prod.fecha_registro)}</td>
                      
                      {/* BOTONES DE ACCIÓN */}
                      <td>
                        <div className="acciones-col">
                          <button className="btn-accion btn-editar" title="Editar" onClick={() => handleEditar(prod)}>
                            <FiEdit size={16} />
                          </button>
                          <button className="btn-accion btn-eliminar" title="Eliminar" onClick={() => handleEliminarClick(prod.id, prod.nombre)}>
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                      No se encontraron productos.
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
              ¿Estás seguro de que deseas eliminar el producto <strong>"{confirmarEliminar.nombre}"</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setConfirmarEliminar(null)}>
                Cancelar
              </button>
              <button className="btn-confirmar-eliminar" onClick={ejecutarEliminar}>
                Eliminar Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;