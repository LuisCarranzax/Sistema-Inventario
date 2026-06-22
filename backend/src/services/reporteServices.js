import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const parsearServicioRealizado = (texto) => {
  if (!texto) return '';
  const match = texto.match(/^\[([\s\S]*?)\](?:\s*Detalles:\s*([\s\S]*))?$/i);
  if (match) {
    const servicios = match[1] ? match[1].trim() : '';
    const detalles = match[2] ? match[2].trim() : '';
    return servicios + (detalles ? ` (${detalles})` : '');
  }
  return texto;
};

export const generarReporteMensualPDF = (datosMesa, productosIngresados, ventasMes, serviciosMes, usuarioNombre) => {
  const doc = new jsPDF();
  const mesActual = new Date().toLocaleString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase();
  const totalPagesExp = "{total_pages_count_string}";

  const addHeaderFooter = (data) => {
    if (data.pageNumber === 1) return; // Skip cover page

    // Header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text("COMPUDOCTOR - Reporte Mensual de Rendimiento", 15, 12);
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(15, 14, 195, 14);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    let str = "Página " + data.pageNumber;
    if (typeof doc.putTotalPages === 'function') {
      str = str + " de " + totalPagesExp;
    }
    doc.text(str, 195, 285, { align: "right" });
  };

  // ==========================================
  // HOJA 1: PORTADA CORPORATIVA PREMIUM
  // ==========================================
  // Banner superior
  doc.setFillColor(30, 58, 138); // Azul marino
  doc.rect(0, 0, 210, 25, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(30, 58, 138);
  doc.text("COMPUDOCTOR", 105, 55, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("REPORTE CONTABLE Y RENDIMIENTO DE OPERACIONES", 105, 65, { align: "center" });
  doc.text(`PERIODO: ${mesActual}`, 105, 73, { align: "center" });

  // Línea divisoria decorativa
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(30, 78, 180, 78);

  // Metadatos de la generación
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generado por: ${usuarioNombre}`, 105, 85, { align: "center" });
  doc.text(`Fecha de Impresión: ${new Date().toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 105, 91, { align: "center" });

  // Tabla de balance financiero consolidado
  const colBalance = ["Métrica Financiera", "Monto Consolidado"];
  const filasBalance = [
    ["Ingresos por Venta de Productos (POS)", `S/ ${datosMesa.ingresos_productos.toFixed(2)}`],
    ["Ingresos por Servicios Técnicos (Taller)", `S/ ${datosMesa.ingresos_servicios.toFixed(2)}`],
    ["Total Ingresos Brutos del Periodo", `S/ ${datosMesa.total_ingresos_general.toFixed(2)}`],
    ["Inversión / Costos de Productos Vendidos", `S/ ${datosMesa.costos_productos.toFixed(2)}`],
    ["Ganancia Neta Consolidada (Utilidad Real)", `S/ ${datosMesa.ganancia_total_neta.toFixed(2)}`]
  ];

  autoTable(doc, {
    startY: 100,
    head: [colBalance],
    body: filasBalance,
    theme: "striped",
    styles: { fontSize: 11, cellPadding: 6 },
    headStyles: { fillColor: [30, 58, 138] },
    columnStyles: {
      1: { halign: "right", fontStyle: "bold" }
    },
    willDrawCell: function (data) {
      if (data.row.index === 4) {
        doc.setFillColor(240, 253, 250); // fondo verde menta
        doc.setTextColor(15, 118, 110); // texto verde oscuro
        doc.setFont("helvetica", "bold");
      }
    }
  });

  // ==========================================
  // HOJA 2: PRODUCTOS INGRESADOS EN EL INVENTARIO
  // ==========================================
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text("1. Nuevos Productos Ingresados al Inventario", 15, 25);

  const colProd = ["Código", "Descripción", "P. Compra", "P. Venta", "Stock Inicial", "Fecha Ingreso"];
  
  // Usar cantidad_ingresada si está disponible en la base de datos (con stock como respaldo)
  const filasProd = productosIngresados.map(p => {
    const cantidadIngresada = Number(p.cantidad_ingresada) > 0 ? Number(p.cantidad_ingresada) : Number(p.stock);
    return [
      p.codigo_interno || '-',
      p.nombre || '-',
      `S/ ${Number(p.precio_compra).toFixed(2)}`,
      `S/ ${Number(p.precio_venta).toFixed(2)}`,
      cantidadIngresada,
      p.fecha_abastecimiento ? new Date(p.fecha_abastecimiento).toLocaleDateString('es-PE') : '-'
    ];
  });

  const totalStock = productosIngresados.reduce((sum, p) => {
    const qty = Number(p.cantidad_ingresada) > 0 ? Number(p.cantidad_ingresada) : Number(p.stock);
    return sum + qty;
  }, 0);
  const totalCompraVal = productosIngresados.reduce((sum, p) => {
    const qty = Number(p.cantidad_ingresada) > 0 ? Number(p.cantidad_ingresada) : Number(p.stock);
    return sum + (Number(p.precio_compra) * qty);
  }, 0);
  const totalVentaVal = productosIngresados.reduce((sum, p) => {
    const qty = Number(p.cantidad_ingresada) > 0 ? Number(p.cantidad_ingresada) : Number(p.stock);
    return sum + (Number(p.precio_venta) * qty);
  }, 0);

  autoTable(doc, {
    startY: 30,
    head: [colProd],
    body: filasProd,
    foot: [["", "VALOR TOTAL EN STOCK", `S/ ${totalCompraVal.toFixed(2)}`, `S/ ${totalVentaVal.toFixed(2)}`, totalStock, ""]],
    theme: "striped",
    showFoot: "lastPage", // Solo mostrar el footer en la última página
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [71, 85, 105] }, // Gris pizarra
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "center" }
    },
    margin: { top: 20, bottom: 20 },
    didDrawPage: addHeaderFooter
  });

  // ==========================================
  // HOJA 3: SERVICIOS TÉCNICOS REALIZADOS (ASCENDENTE)
  // ==========================================
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text("2. Registro Histórico de Servicios Realizados", 15, 25);

  const colServRealizados = ["Ticket", "Cliente", "Servicio Realizado", "Precio", "Medio de Pago", "Fecha"];
  
  // Ordenar de forma ascendente (criterio temporal)
  const serviciosOrdenados = [...serviciosMes].sort((a, b) => a.id - b.id);
  const filasServRealizados = serviciosOrdenados.map(s => [
    `#${s.id}`,
    s.cliente_nombre || '-',
    parsearServicioRealizado(s.servicio_realizado),
    `S/ ${Number(s.precio).toFixed(2)}`,
    s.metodo_pago || 'Por definir',
    s.fecha_ingreso ? new Date(s.fecha_ingreso).toLocaleDateString('es-PE') : '-'
  ]);

  // Calcular el total recaudado excluyendo los servicios pendientes para no tener discrepancias con la portada
  const totalServiciosRecaudado = serviciosOrdenados
    .filter(s => s.estado_pago !== 'pendiente')
    .reduce((sum, s) => sum + Number(s.precio), 0);

  autoTable(doc, {
    startY: 30,
    head: [colServRealizados],
    body: filasServRealizados,
    foot: [["", "TOTAL RECAUDADO EN SERVICIOS", "", `S/ ${totalServiciosRecaudado.toFixed(2)}`, "", ""]],
    theme: "striped",
    showFoot: "lastPage", // Solo mostrar el footer en la última página
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [139, 92, 246] }, // Indigo / Violeta
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
    columnStyles: {
      3: { halign: "right" }
    },
    margin: { top: 20, bottom: 20 },
    didDrawPage: addHeaderFooter
  });

  // ==========================================
  // HOJA 4: VENTAS REGISTRADAS EN PUNTO DE VENTA
  // ==========================================
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text("3. Ventas Registradas en el Punto de Venta", 15, 25);

  const colPuntoVenta = ["Cliente", "Producto", "Cantidad", "Precio Unitario", "Subtotal", "Fecha"];
  const filasVentas = ventasMes.map(v => [
    v.cliente_nombre || 'Cliente General',
    v.producto_nombre || '-',
    v.cantidad || 0,
    `S/ ${Number(v.precio_unitario).toFixed(2)}`,
    `S/ ${Number(v.subtotal).toFixed(2)}`,
    v.fecha_venta ? new Date(v.fecha_venta).toLocaleDateString('es-PE') : '-'
  ]);

  const totalVentasVal = ventasMes.reduce((sum, v) => sum + Number(v.subtotal), 0);

  autoTable(doc, {
    startY: 30,
    head: [colPuntoVenta],
    body: filasVentas,
    foot: [["TOTAL GENERAL VENTAS POS", "", "", "", `S/ ${totalVentasVal.toFixed(2)}`, ""]],
    theme: "striped",
    showFoot: "lastPage", // Solo mostrar el footer en la última página
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [16, 185, 129] }, // Esmeralda / Verde
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
    columnStyles: {
      2: { halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" }
    },
    margin: { top: 20, bottom: 20 },
    didDrawPage: addHeaderFooter
  });

  if (typeof doc.putTotalPages === 'function') {
    doc.putTotalPages(totalPagesExp);
  }

  // Guardar y disparar descarga nativa del sistema operativo
  const fechaHoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const nombreArchivo = `Reporte_del_Mes_${datosMesa.mes.toUpperCase()}_${fechaHoy}_COMPUDOCTOR.pdf`;
  doc.save(nombreArchivo);
};

export const generarReportePersonalizadoPDF = (modulo, datos, fechaInicio, fechaFin, usuarioNombre) => {
  const doc = new jsPDF();
  const fechaHoy = new Date().toLocaleDateString('es-PE');
  
  let titulo = '';
  let colorTema = [30, 58, 138]; // Azul marino por defecto
  let headers = [];
  let rows = [];
  let foot = [];
  let showFoot = false;

  if (modulo === 'ventas') {
    titulo = 'REPORTE DE VENTAS REGISTRADAS (POS)';
    colorTema = [37, 99, 235]; // Azul
    headers = [["Ticket", "Fecha", "Cliente", "Producto", "Cant.", "P. Unit.", "Pago", "Total"]];
    
    let totalMonto = 0;
    let totalCant = 0;
    
    rows = datos.map(v => {
      const sub = Number(v.subtotal || v.total || 0);
      const cant = Number(v.cantidad || 1);
      totalMonto += sub;
      totalCant += cant;
      return [
        `#${v.venta_id}`,
        v.fecha_venta ? new Date(v.fecha_venta).toLocaleDateString('es-PE') : '-',
        v.cliente_nombre || 'Cliente General',
        v.producto_nombre || 'Varios',
        cant,
        `S/ ${Number(v.precio_unitario || 0).toFixed(2)}`,
        v.medio_pago || 'Efectivo',
        `S/ ${sub.toFixed(2)}`
      ];
    });

    foot = [[`TOTALES`, `", "", "", ${totalServiciosRecaudado}, "", "`, `S/ ${totalMonto.toFixed(2)}`]];

  } else if (modulo === 'servicios') {
    titulo = 'REPORTE DE SERVICIOS TECNICOS (TALLER)';
    colorTema = [139, 92, 246]; // Morado
    headers = [["ID", "Ingreso", "Cliente", "Equipo/Dispositivo", "Servicio Realizado", "Precio", "Pago", "Estado"]];

    const totalServiciosRecaudado = datos
    .filter(s => s.estado_pago !== 'pendiente')
    .reduce((sum, s) => sum + Number(s.precio), 0);

    let totalPrecio = 0;
    
    rows = datos.map(s => {
      const precio = Number(s.precio || 0);
      //totalPrecio += precio;
      return [
        `#${s.id}`,
        s.fecha_ingreso ? new Date(s.fecha_ingreso).toLocaleDateString('es-PE') : '-',
        s.cliente_nombre,
        s.equipo_dispositivo,
        parsearServicioRealizado(s.servicio_realizado),
        `S/ ${precio.toFixed(2)}`,
        s.estado_pago.toUpperCase(),
        s.estado.toUpperCase()
      ];

    });
    foot = [["TOTALES", "", "", "", "", `S/ ${totalServiciosRecaudado.toFixed(2)}`, "", ""]];

  } else if (modulo === 'inventario') {
    titulo = 'REPORTE DE STOCK E INVENTARIO';
    colorTema = [16, 185, 129]; // Verde
    headers = [["Código", "Nombre", "Categoría", "P. Compra", "P. Venta", "Stock", "S. Mín.", "Valor Stock"]];
    
    let totalCompra = 0;
    let totalVenta = 0;
    let totalStock = 0;
    
    rows = datos.map(p => {
      const stock = Number(p.stock || 0);
      const compra = Number(p.precio_compra || 0);
      const venta = Number(p.precio_venta || 0);
      const valor = stock * compra;
      
      totalCompra += compra;
      totalVenta += venta;
      totalStock += stock;
      
      return [
        p.codigo_interno || 'N/A',
        p.nombre,
        p.categoria_nombre,
        `S/ ${compra.toFixed(2)}`,
        `S/ ${venta.toFixed(2)}`,
        stock,
        p.stock_minimo,
        `S/ ${valor.toFixed(2)}`
      ];
    });

    const valorTotalInventario = datos.reduce((sum, p) => sum + (Number(p.stock || 0) * Number(p.precio_compra || 0)), 0);
    foot = [["TOTALES", "", "", "", "", totalStock, "", `S/ ${valorTotalInventario.toFixed(2)}`]];
  }

  // ENCABEZADO CORPORATIVO EN PDF
  doc.setFillColor(...colorTema);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("COMPUDOCTOR", 15, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`REPORTE PERSONALIZADO`, 195, 20, { align: "right" });

  // Metadatos
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont("helvetica", "bold");
  doc.text(titulo, 15, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  
  const fInicio = fechaInicio ? new Date(fechaInicio).toLocaleDateString('es-PE') : 'Todo el historial';
  const fFin = fechaFin ? new Date(fechaFin).toLocaleDateString('es-PE') : 'Hasta la fecha';
  
  doc.text(`Periodo: ${fInicio} al ${fFin}`, 15, 48);
  doc.text(`Generado por: ${usuarioNombre} | Fecha: ${fechaHoy}`, 15, 54);

  // Tabla
  autoTable(doc, {
    startY: 60,
    head: headers,
    body: rows,
    foot: foot,
    showFoot:"lastPage",
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: colorTema, textColor: [255, 255, 255] },
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: "bold" },
  });

  const nombreArchivo = `registro_${modulo}_${fechaInicio || 'inicio'}_a_${fechaFin || 'fin'}.pdf`;
  doc.save(nombreArchivo);
};