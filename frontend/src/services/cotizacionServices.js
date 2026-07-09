import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarCotizacionFormalPDF = (datosCotizacion, cotizacionId) => {
  const doc = new jsPDF();
  const { cliente, items, total, validez_dias } = datosCotizacion;
  
  // ==========================================
  // 1. MEMBRETE Y CABECERA DE LA EMPRESA
  // ==========================================
  // Color azul corporativo oscuro
  doc.setFillColor(30, 58, 138); 
  doc.rect(0, 0, 210, 40, 'F'); // Franja superior

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("COMPUDOCTOR", 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Soluciones Tecnológicas Integrales", 15, 27);

  // Datos de contacto de la empresa (A la derecha)
  doc.setFontSize(9);
  doc.text("RUC: 20123456789", 140, 15);
  doc.text("Av. Principal 123, Ciudad", 140, 20);
  doc.text("Teléfono: +51 987 654 321", 140, 25);
  doc.text("ventas@compudoctor.com", 140, 30);

  // ==========================================
  // 2. TÍTULO Y DATOS DEL DOCUMENTO
  // ==========================================
  doc.setTextColor(15, 23, 42); // Gris oscuro
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text("COTIZACIÓN DE SERVICIOS Y PRODUCTOS", 15, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cotización N°: COT-${String(cotizacionId).padStart(5, '0')}`, 15, 62);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-PE')}`, 15, 67);
  doc.text(`Validez: ${validez_dias} días calendario`, 15, 72);

  // ==========================================
  // 3. CUADRO DE DATOS DEL CLIENTE
  // ==========================================
  doc.setDrawColor(203, 213, 225); // Borde gris claro
  doc.setFillColor(248, 250, 252); // Fondo muy claro
  doc.roundedRect(15, 80, 180, 35, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.text("PREPARADO PARA:", 20, 88);
  
  doc.setFont('helvetica', 'normal');
  const tipoDoc = cliente.tipo_cliente === 'empresa' ? 'RUC' : 'DNI';
  doc.text(`Cliente / Razón Social: ${cliente.nombre}`, 20, 95);
  doc.text(`${tipoDoc}: ${cliente.documento}`, 20, 101);
  if (cliente.representante_legal) {
    doc.text(`Atención a: ${cliente.representante_legal}`, 20, 107);
  }
  doc.text(`Dirección: ${cliente.direccion}`, 105, 95);
  doc.text(`Teléfono: ${cliente.celular || 'No registrado'}`, 105, 101);

  // ==========================================
  // 4. TABLA DETALLADA DE ÍTEMS
  // ==========================================
  const columnas = ["Ítem", "Descripción del Producto / Servicio", "Cant.", "P. Unitario", "Subtotal"];
  
  const filas = items.map((item, index) => {
    const subtotal = item.cantidad * item.precio_unitario;
    return [
      index + 1,
      item.descripcion,
      item.cantidad,
      `S/ ${item.precio_unitario.toFixed(2)}`,
      `S/ ${subtotal.toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: 125,
    head: [columnas],
    body: filas,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: 255, halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30 }
    },
    styles: { fontSize: 9, cellPadding: 5 }
  });

  // ==========================================
  // 5. TOTALES Y CONDICIONES (Pie de página)
  // ==========================================
  const finalY = doc.lastAutoTable.finalY + 10;
  const valorTotal = Number(total);
  const valorSubtotal = valorTotal / 1.18;
  const valorIGV = valorTotal - valorSubtotal;

  // Cuadro de Totales (Lado Derecho, alineado)
  const boxX = 135;
  const boxWidth = 60;
  const boxHeight = 25;
  
  doc.setFillColor(248, 250, 252); // Fondo gris muy suave
  doc.setDrawColor(226, 232, 240); // Borde gris claro
  doc.roundedRect(boxX, finalY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  
  // Fila 1: Subtotal
  doc.text("Subtotal:", boxX + 4, finalY + 6);
  doc.text(`S/ ${valorSubtotal.toFixed(2)}`, boxX + 56, finalY + 6, { align: 'right' });

  // Fila 2: IGV (18%)
  doc.text("IGV (18%):", boxX + 4, finalY + 12);
  doc.text(`S/ ${valorIGV.toFixed(2)}`, boxX + 56, finalY + 12, { align: 'right' });

  // Línea de separación interna
  doc.setDrawColor(226, 232, 240);
  doc.line(boxX + 3, finalY + 15, boxX + 57, finalY + 15);

  // Fila 3: Total General
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL:", boxX + 4, finalY + 20);
  doc.setTextColor(5, 150, 105); // Verde dinero
  doc.text(`S/ ${valorTotal.toFixed(2)}`, boxX + 56, finalY + 20, { align: 'right' });

  // Términos y Condiciones (Lado Izquierdo)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text("Términos y Condiciones Comerciales:", 15, finalY + 5);
  
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const terminos = [
    `1. La presente cotización tiene una validez de ${validez_dias} días a partir de su emisión.`,
    "2. El tiempo de entrega o ejecución se acordará tras la aprobación.",
    "3. Cuentas Bancarias para depósitos o transferencias:",
    "   - BCP Soles: 193-XXXXXXX-X-XX (A nombre de COMPUDOCTOR SAC)",
    "   - Yape / Plin: 987 654 321",
    "4. Todo trabajo en taller cuenta con 30 días de garantía sobre la mano de obra."
  ];

  let yOffset = finalY + 10;
  terminos.forEach(linea => {
    doc.text(linea, 15, yOffset);
    yOffset += 4.5;
  });

  // Descarga del documento
  doc.save(`Cotizacion_COT-${String(cotizacionId).padStart(5, '0')}_${cliente.nombre.replace(/\s+/g, '_')}.pdf`);
};