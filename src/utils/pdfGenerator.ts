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

// Función para generar PDF de un servicio individual
export const generateServicePDF = (autoHistory: import('../types/Auto').AutoHistory, serviceIndex: number): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Configuración de fuentes y colores
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(25, 118, 210);
  
  // Título principal
  doc.text('SERVICIO DE TALLER MECÁNICO', pageWidth / 2, yPosition, { align: 'center' });
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
    `Marca: ${autoHistory.marca}`,
    `Modelo: ${autoHistory.modelo}`,
    `Año: ${autoHistory.año}`,
    `Patente: ${autoHistory.patente}`,
    `Número de Chasis: ${autoHistory.numero_chasis}`,
    `Cliente: ${autoHistory.cliente_nombre}`,
    `Teléfono: ${autoHistory.cliente_telefono}`
  ];

  vehicleInfo.forEach(info => {
    doc.text(info, 25, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Información del servicio específico
  const service = autoHistory.servicios[serviceIndex];
  if (!service) {
    throw new Error('Servicio no encontrado');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(25, 118, 210);
  doc.text(`SERVICIO #${autoHistory.servicios.length - serviceIndex}`, 20, yPosition);
  yPosition += 15;

  // Fechas del servicio
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('FECHAS DEL SERVICIO', 20, yPosition);
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

  const serviceDates = [
    `Fecha de Ingreso: ${formatDate(service.fecha_ingreso)}`,
    service.fecha_trabajo ? `Fecha de Trabajo: ${formatDate(service.fecha_trabajo)}` : 'Fecha de Trabajo: Pendiente',
    service.kilometraje ? `Kilometraje: ${service.kilometraje.toLocaleString()} km` : 'Kilometraje: No especificado'
  ];

  serviceDates.forEach(info => {
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
  if (service.orden_trabajo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ORDEN DE TRABAJO', 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPosition = addTextWithWrap(service.orden_trabajo, 25, yPosition, pageWidth - 50);
    yPosition += 10;
  }

  // Repuestos utilizados
  if (service.repuestos_utilizados) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('REPUESTOS UTILIZADOS', 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPosition = addTextWithWrap(service.repuestos_utilizados, 25, yPosition, pageWidth - 50);
    yPosition += 10;
  }

  // Trabajo realizado
  if (service.trabajo_realizado) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TRABAJO REALIZADO', 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPosition = addTextWithWrap(service.trabajo_realizado, 25, yPosition, pageWidth - 50);
    yPosition += 10;
  }

  // Observaciones
  if (service.observaciones) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('OBSERVACIONES', 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    yPosition = addTextWithWrap(service.observaciones, 25, yPosition, pageWidth - 50);
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

// Función para generar PDF con todos los servicios de un auto
export const generateAllServicesPDF = (autoHistory: import('../types/Auto').AutoHistory): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Configuración de fuentes y colores
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(25, 118, 210);
  
  // Título principal
  doc.text('HISTORIAL COMPLETO DE SERVICIOS', pageWidth / 2, yPosition, { align: 'center' });
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
    `Marca: ${autoHistory.marca}`,
    `Modelo: ${autoHistory.modelo}`,
    `Año: ${autoHistory.año}`,
    `Patente: ${autoHistory.patente}`,
    `Número de Chasis: ${autoHistory.numero_chasis}`,
    `Cliente: ${autoHistory.cliente_nombre}`,
    `Teléfono: ${autoHistory.cliente_telefono}`,
    `Total de Servicios: ${autoHistory.servicios.length}`
  ];

  vehicleInfo.forEach(info => {
    doc.text(info, 25, yPosition);
    yPosition += 6;
  });

  yPosition += 15;

  // Función para agregar texto con salto de línea automático
  const addTextWithWrap = (text: string, x: number, y: number, maxWidth: number) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, x, y);
    return y + (lines.length * 5);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };

  // Función para verificar si necesitamos una nueva página
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Iterar por todos los servicios (del más reciente al más antiguo)
  autoHistory.servicios.forEach((service, index) => {
    const serviceNumber = autoHistory.servicios.length - index;
    
    // Verificar espacio para el servicio
    checkNewPage(50);

    // Título del servicio
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(25, 118, 210);
    doc.text(`SERVICIO #${serviceNumber}`, 20, yPosition);
    yPosition += 15;

    // Línea separadora del servicio
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Fechas del servicio
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Fechas:', 20, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const serviceDates = [
      `Ingreso: ${formatDate(service.fecha_ingreso)}`,
      service.fecha_trabajo ? `Trabajo: ${formatDate(service.fecha_trabajo)}` : 'Trabajo: Pendiente',
      service.kilometraje ? `Kilometraje: ${service.kilometraje.toLocaleString()} km` : 'Kilometraje: No especificado'
    ];

    serviceDates.forEach(date => {
      doc.text(date, 25, yPosition);
      yPosition += 5;
    });

    yPosition += 5;

    // Orden de trabajo
    if (service.orden_trabajo) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Orden de Trabajo:', 20, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      yPosition = addTextWithWrap(service.orden_trabajo, 25, yPosition, pageWidth - 50);
      yPosition += 5;
    }

    // Repuestos utilizados
    if (service.repuestos_utilizados) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Repuestos:', 20, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      yPosition = addTextWithWrap(service.repuestos_utilizados, 25, yPosition, pageWidth - 50);
      yPosition += 5;
    }

    // Trabajo realizado
    if (service.trabajo_realizado) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Trabajo Realizado:', 20, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      yPosition = addTextWithWrap(service.trabajo_realizado, 25, yPosition, pageWidth - 50);
      yPosition += 5;
    }

    // Observaciones
    if (service.observaciones) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Observaciones:', 20, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      yPosition = addTextWithWrap(service.observaciones, 25, yPosition, pageWidth - 50);
      yPosition += 5;
    }

    yPosition += 10;
  });

  // Pie de página en la última página
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

// Función para guardar PDF de servicio individual
export const saveServicePDF = (autoHistory: import('../types/Auto').AutoHistory, serviceIndex: number): void => {
  try {
    const pdf = generateServicePDF(autoHistory, serviceIndex);
    const serviceNumber = autoHistory.servicios.length - serviceIndex;
    const fileName = `servicio_${serviceNumber}_${autoHistory.marca}_${autoHistory.modelo}_${autoHistory.patente}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating service PDF:', error);
    throw error;
  }
};

// Función para guardar PDF de todos los servicios
export const saveAllServicesPDF = (autoHistory: import('../types/Auto').AutoHistory): void => {
  try {
    const pdf = generateAllServicesPDF(autoHistory);
    const fileName = `historial_completo_${autoHistory.marca}_${autoHistory.modelo}_${autoHistory.patente}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating all services PDF:', error);
    throw error;
  }
};

