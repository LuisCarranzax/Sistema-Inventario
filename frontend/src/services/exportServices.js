import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';



export const exportarInventarioExcel = (productosFiltrados, rangoFecha) => {

  const datos = productosFiltrados.map(p => ({
    "Código": p.codigo_interno,
    "Categoría": p.categoria_nombre,
    "Producto": p.nombre,
    "Precio Compra (S/)": Number(p.precio_compra).toFixed(2),
    "Precio Venta (S/)": Number(p.precio_venta).toFixed(2),
    "Stock Actual": p.stock,
    "Fecha Registro": p.fecha_abastecimiento ? new Date(p.fecha_abastecimiento).toLocaleDateString('es-PE') : 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(datos);

  // Auto-ajustar el ancho de las columnas para evitar cortes de texto
  if (datos.length > 0) {
    const colWidths = Object.keys(datos[0]).map(key => {
      let maxLen = key.length;
      datos.forEach(row => {
        const valStr = row[key] ? String(row[key]) : "";
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      return { wch: maxLen + 4 };
    });
    worksheet["!cols"] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
  XLSX.writeFile(workbook, `Reporte_Inventario_${rangoFecha.replace(/\s+/g, '_')}.xlsx`);
};

export const exportarInventarioPDF = (productosFiltrados, rangoFecha, filtroCategoria) => {
  const doc = new jsPDF();
  const fechaHoy = new Date().toLocaleDateString('es-PE');
  
  // ENCABEZADO CORPORATIVO EN PDF (Igual al estilo de los reportes anteriores)
  const colorTema = [16, 185, 129]; // Verde corporativo para Inventario
  doc.setFillColor(...colorTema);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("COMPUDOCTOR", 15, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("REPORTE DE INVENTARIO", 195, 20, { align: "right" });

  // Metadatos del reporte
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont("helvetica", "bold");
  doc.text("ESTADO ACTUAL DE PRODUCTOS EN STOCK", 15, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  
  doc.text(`Filtro Aplicado: ${rangoFecha} | Categoría: ${filtroCategoria}`, 15, 48);
  doc.text(`Fecha de Impresión: ${fechaHoy}`, 15, 54);

  const tableColumn = ["Código", "Categoría", "Producto", "P. Compra", "P. Venta", "Stock", "Ingreso"];
  const tableRows = productosFiltrados.map(p => [
    p.codigo_interno || 'N/A',
    p.categoria_nombre,
    p.nombre,
    `S/ ${Number(p.precio_compra).toFixed(2)}`,
    `S/ ${Number(p.precio_venta).toFixed(2)}`,
    `${p.stock} und.`,
    p.fecha_abastecimiento ? new Date(p.fecha_abastecimiento).toLocaleDateString('es-PE') : 'N/A'
  ]);

  autoTable(doc, {
    startY: 62,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: colorTema, fontStyle: 'bold', textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`Reporte_Inventario_${rangoFecha.replace(/\s+/g, '_')}.pdf`);
};

export const exportarServiciosExcel = (serviciosFiltrados, rangoFecha) => {
  const datos = serviciosFiltrados.map(s => ({
    "Ticket": `#${s.id}`,
    "Cliente": s.cliente_nombre,
    "Equipo / Dispositivo": s.equipo_dispositivo,
    "Servicio a Realizar": s.servicio_realizado ? s.servicio_realizado.replace(/[\[\]]/g, '') : '',
    "Precio (S/)": Number(s.precio).toFixed(2),
    "Estado Técnico": s.estado.toUpperCase().replace('_', ' '),
    "Estado de Pago": s.estado_pago.toUpperCase(),
    "Método de Pago": s.metodo_pago,
    "Adelanto (S/)": Number(s.monto_adelanto || 0).toFixed(2),
    "Fecha Ingreso": s.fecha_ingreso ? new Date(s.fecha_ingreso).toLocaleString('es-PE') : 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(datos);

  // Auto-ajustar el ancho de las columnas
  if (datos.length > 0) {
    const colWidths = Object.keys(datos[0]).map(key => {
      let maxLen = key.length;
      datos.forEach(row => {
        const valStr = row[key] ? String(row[key]) : "";
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      return { wch: maxLen + 4 };
    });
    worksheet["!cols"] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Servicios");
  XLSX.writeFile(workbook, `Reporte_Servicios_${rangoFecha.replace(/\s+/g, '_')}.xlsx`);
};

export const exportarServiciosPDF = (serviciosFiltrados, rangoFecha, filtroEstado, filtroEquipo, filtroPago) => {
  const doc = new jsPDF();
  const fechaHoy = new Date().toLocaleDateString('es-PE');
  
  // ENCABEZADO CORPORATIVO EN PDF (Morado corporativo para Taller)
  const colorTema = [139, 92, 246];
  doc.setFillColor(...colorTema);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("COMPUDOCTOR", 15, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("REPORTE DE TALLER Y SERVICIOS", 195, 20, { align: "right" });

  // Metadatos
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont("helvetica", "bold");
  doc.text("HISTORIAL DE SERVICIOS TECNICOS", 15, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  
  doc.text(`Periodo: ${rangoFecha} | Estado: ${filtroEstado} | Equipo: ${filtroEquipo} | Pago: ${filtroPago}`, 15, 48);
  doc.text(`Fecha de Impresión: ${fechaHoy}`, 15, 54);

  const tableColumn = ["Ticket", "Cliente", "Equipo", "Precio", "Estado", "Pago", "Ingreso"];
  const tableRows = serviciosFiltrados.map(s => [
    `#${s.id}`,
    s.cliente_nombre,
    s.equipo_dispositivo,
    `S/ ${Number(s.precio).toFixed(2)}`,
    s.estado.toUpperCase().replace('_', ' '),
    s.estado_pago.toUpperCase(),
    s.fecha_ingreso ? new Date(s.fecha_ingreso).toLocaleDateString('es-PE') : 'N/A'
  ]);

  const totalServiciosRecaudado = serviciosFiltrados.reduce((total, servicio) => {
    const precio = parseFloat(servicio.precio) || 0;
    return total + precio;
  }, 0);

  autoTable(doc, {
    startY: 62,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    foot: [[ "", "TOTAL RECAUDADO EN SERVICIOS", "", `S/ ${totalServiciosRecaudado.toFixed(2)}`, "", ""]],
    headStyles: { fillColor: colorTema, fontStyle: 'bold', textColor: [255, 255, 255] },
    styles: { fontSize: 8.5, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`Reporte_Servicios_${rangoFecha.replace(/\s+/g, '_')}.pdf`);
};
