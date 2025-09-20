import jsPDF from 'jspdf';
import { FichaAuto } from '../types/FichaAuto';

export const generatePDF = (ficha: FichaAuto): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Configuración de fuentes y colores
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(25, 118, 210); // Color primario azul
  
  // Título principal
  doc.text('FICHA DE TALLER MECÁNICO', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Línea separadora
  doc.setDrawColor(25, 118, 210);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 15;

  // Información del vehículo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('INFORMACIÓN DEL VEHÍCULO', 20, yPosition);
  yPosition += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const vehicleInfo = [
    `Marca: ${ficha.marca}`,
    `Modelo: ${ficha.modelo}`,
    `Año: ${ficha.año}`,
    ficha.patente ? `Patente: ${ficha.patente}` : 'Patente: No especificada',
    ficha.numero_chasis ? `Número de Chasis: ${ficha.numero_chasis}` : 'Número de Chasis: No especificado',
    ficha.kilometraje ? `Kilometraje: ${ficha.kilometraje.toLocaleString()} km` : 'Kilometraje: No especificado'
  ];

  vehicleInfo.forEach(info => {
    doc.text(info, 25, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Información del cliente
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INFORMACIÓN DEL CLIENTE', 20, yPosition);
  yPosition += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const clientInfo = [
    `Nombre: ${ficha.cliente_nombre}`,
    `Teléfono: ${ficha.cliente_telefono}`
  ];

  clientInfo.forEach(info => {
    doc.text(info, 25, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Fechas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FECHAS', 20, yPosition);
  yPosition += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };

  const datesInfo = [
    `Fecha de Ingreso: ${formatDate(ficha.fecha_ingreso)}`,
    ficha.fecha_trabajo ? `Fecha de Trabajo: ${formatDate(ficha.fecha_trabajo)}` : 'Fecha de Trabajo: Pendiente'
  ];

  datesInfo.forEach(info => {
    doc.text(info, 25, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Función para agregar texto con salto de línea automático
  const addTextWithWrap = (text: string, x: number, y: number, maxWidth: number) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * 5);
  };

  // Orden de trabajo
  if (ficha.orden_trabajo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ORDEN DE TRABAJO', 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPosition = addTextWithWrap(ficha.orden_trabajo, 25, yPosition, pageWidth - 50);
    yPosition += 10;
  }

  // Repuestos utilizados
  if (ficha.repuestos_utilizados) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('REPUESTOS UTILIZADOS', 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPosition = addTextWithWrap(ficha.repuestos_utilizados, 25, yPosition, pageWidth - 50);
    yPosition += 10;
  }

  // Trabajo realizado
  if (ficha.trabajo_realizado) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TRABAJO REALIZADO', 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPosition = addTextWithWrap(ficha.trabajo_realizado, 25, yPosition, pageWidth - 50);
    yPosition += 10;
  }

  // Observaciones
  if (ficha.observaciones) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('OBSERVACIONES', 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPosition = addTextWithWrap(ficha.observaciones, 25, yPosition, pageWidth - 50);
    yPosition += 10;
  }

  // Pie de página
  const footerY = pageHeight - 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 
    pageWidth / 2, footerY, { align: 'center' });

  // Línea de separación en el pie
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

  return doc;
};

export const savePDF = async (ficha: FichaAuto): Promise<void> => {
  try {
    const pdf = generatePDF(ficha);
    const result = await window.electronAPI.exportPDF(ficha);
    
    if (result.success && result.filePath) {
      // En un entorno real, aquí se guardaría el PDF usando Node.js
      // Por ahora, lo descargamos directamente
      pdf.save(`ficha_${ficha.marca}_${ficha.modelo}_${ficha.año}.pdf`);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

