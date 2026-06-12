import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarDocumentoPDF = (ticketId, carrito, total, esProforma, clienteNombre, metodoPago) => {
  const doc = new jsPDF();

  // 1. Cabecera de la Empresa
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // Azul corporativo
  doc.text("COMPUDOCTOR", 105, 20, { align: "center" });
  
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139); // Gris
  doc.text("Soluciones Tecnológicas Integrales y Venta de Accesorios", 105, 28, { align: "center" });

  // 2. Datos del Documento
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Casi negro
  const titulo = esProforma ? "PROFORMA DE COTIZACIÓN" : "TICKET DE VENTA";
  doc.text(titulo, 15, 45);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Documento N°: ${String(ticketId).padStart(6, '0')}`, 15, 55);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`, 15, 62);
  doc.text(`Cliente: ${clienteNombre || 'Cliente General'}`, 15, 69);
  doc.text(`Método de Pago: ${esProforma ? 'N/A' : metodoPago}`, 15, 76);

  // 3. Generación de la Tabla
  const tableColumn = ["Cant.", "Descripción del Producto", "P. Unit.", "Subtotal"];
  const tableRows = [];

  carrito.forEach(item => {
    const subtotal = item.precio_venta * item.cantidad;
    tableRows.push([
      item.cantidad,
      item.nombre,
      `S/ ${Number(item.precio_venta).toFixed(2)}`,
      `S/ ${subtotal.toFixed(2)}`
    ]);
  });

  autoTable(doc, {
    startY: 85,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
    styles: { fontSize: 10 },
    columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } }
  });

  // 4. Total a Pagar
  const finalY = doc.lastAutoTable.finalY || 85;
  doc.setFontSize(14);
  doc.setTextColor(5, 150, 105); // Verde dinero
  doc.text(`TOTAL: S/ ${total.toFixed(2)}`, 195, finalY + 15, { align: "right" });

  // 5. Descargar el archivo
  const nombreArchivo = esProforma ? `Proforma_${ticketId}.pdf` : `Venta_${ticketId}.pdf`;
  doc.save(nombreArchivo);
};