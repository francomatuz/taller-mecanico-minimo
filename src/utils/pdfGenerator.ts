import jsPDF from 'jspdf';
import { FichaAuto } from '../types/FichaAuto';

// Colores corporativos del taller (sin rojo)
const COLORS = {
  primary: '#424242',    // Negro/gris oscuro (en lugar de rojo)
  secondary: '#666666',  // Gris medio
  accent: '#ffffff',     // Blanco
  lightGray: '#f8f9fa',  // Gris muy claro
  darkGray: '#6c757d',   // Gris oscuro
  black: '#000000',      // Negro puro
  success: '#28a745',    // Verde para Services
  warning: '#ffc107'     // Amarillo para alertas
};

// Función para agregar header con logo del taller
const addHeader = (doc: jsPDF, pageWidth: number) => {
  // Fondo del header (más pequeño)
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  // Intentar agregar el logo real
  try {
    // Crear un canvas temporal para cargar la imagen
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Configurar el canvas (más pequeño)
      canvas.width = 60;
      canvas.height = 20;
      
      // Dibujar la imagen redimensionada
      ctx?.drawImage(img, 0, 0, 60, 20);
      
      // Convertir a base64
      const dataURL = canvas.toDataURL('image/png');
      
      // Agregar la imagen al PDF (más pequeña y centrada)
      doc.addImage(dataURL, 'PNG', pageWidth/2 - 30, 2.5, 60, 20);
    };
    
    img.src = '/nicar.png'; // Ruta del logo en public
    
    // Fallback: texto mientras carga la imagen (negro)
    doc.setTextColor(COLORS.black);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('FICHA DE SERVICIO AUTOMOTRIZ', pageWidth / 2, 15, { align: 'center' });
    
  } catch (error) {
    // Fallback: texto simple (negro)
    doc.setTextColor(COLORS.black);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('FICHA DE SERVICIO AUTOMOTRIZ', pageWidth / 2, 15, { align: 'center' });
  }
  
  return 35; // Retorna la posición Y después del header (más pequeño)
};

// Función para agregar footer
const addFooter = (doc: jsPDF, pageWidth: number, pageHeight: number) => {
  const footerY = pageHeight - 20;
  
  // Línea separadora
  doc.setDrawColor(COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 8, pageWidth - 20, footerY - 8);
  
  // Información del taller
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.darkGray);
  doc.text('Taller Nicar - Sistema de Gestion Automotriz', 20, footerY - 2);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`, 
    pageWidth - 20, footerY - 2, { align: 'right' });
};

// Función para agregar sección con fondo
const addSection = (doc: jsPDF, title: string, x: number, y: number, width: number) => {
  // Fondo de la sección
  doc.setFillColor(COLORS.lightGray);
  doc.rect(x, y - 8, width, 20, 'F');
  
  // Borde superior
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(2);
  doc.line(x, y - 8, x + width, y - 8);
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLORS.primary);
  doc.text(title, x + 10, y + 2);
  
  return y + 15;
};

// Función para agregar información en formato de tabla
const addInfoTable = (doc: jsPDF, data: string[][], x: number, y: number, maxWidth: number) => {
  let currentY = y;
  
  data.forEach(([label, value], index) => {
    // Alternar color de fondo para filas
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(x - 5, currentY - 4, maxWidth + 10, 8, 'F');
    }
    
    // Label en negrita
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.secondary);
    doc.text(`${label}:`, x, currentY);
    
    // Valor
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const labelWidth = doc.getTextWidth(`${label}:`);
    doc.text(value || 'No especificado', x + labelWidth + 8, currentY);
    
    currentY += 8;
  });
  
  return currentY + 8;
};


// Función para agregar texto con formato
const addFormattedText = (doc: jsPDF, title: string, content: string, x: number, y: number, maxWidth: number) => {
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.primary);
  doc.text(title, x, y);
  
  // Línea debajo del título
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(x, y + 2, x + doc.getTextWidth(title), y + 2);
  
  // Contenido
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const lines = doc.splitTextToSize(content, maxWidth);
  doc.text(lines, x, y + 8);
  
  return y + (lines.length * 5) + 15;
};

// Función para agregar chip de Service
const addServiceChip = (doc: jsPDF, x: number, y: number) => {
  // Fondo verde
  doc.setFillColor(COLORS.success);
  doc.rect(x, y - 4, 30, 8, 'F');
  
  // Borde
  doc.setDrawColor(COLORS.success);
  doc.setLineWidth(0.3);
  doc.rect(x, y - 4, 30, 8);
  
  // Texto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.accent);
  doc.text('SERVICE', x + 15, y + 1, { align: 'center' });
  
  return x + 35;
};

export const generatePDF = (ficha: FichaAuto): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let yPosition = addHeader(doc, pageWidth);
  
  // Espacio después del header
  yPosition += 10;
  
  // Información del vehículo
  yPosition = addSection(doc, 'INFORMACION DEL VEHICULO', 20, yPosition, pageWidth - 40);
  
  const vehicleData = [
    ['Marca', ficha.marca],
    ['Modelo', ficha.modelo],
    ['Año', ficha.año?.toString() || ''],
    ['Patente', ficha.patente || ''],
    ['Numero de Chasis', ficha.numero_chasis || ''],
    ['Kilometraje', ficha.kilometraje ? `${ficha.kilometraje.toLocaleString()} km` : '']
  ];
  
  yPosition = addInfoTable(doc, vehicleData, 30, yPosition, pageWidth - 60);
  
  // Información del cliente (SIN mostrar si es fiel)
  yPosition = addSection(doc, 'INFORMACION DEL CLIENTE', 20, yPosition, pageWidth - 40);
  
  const clientData = [
    ['Nombre', ficha.cliente_nombre],
    ['Telefono', ficha.cliente_telefono]
  ];
  
  yPosition = addInfoTable(doc, clientData, 30, yPosition, pageWidth - 60);
  
  // Fechas del servicio
  yPosition = addSection(doc, 'FECHAS DEL SERVICIO', 20, yPosition, pageWidth - 40);
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };
  
  const datesData = [
    ['Fecha de Ingreso', formatDate(ficha.fecha_ingreso)],
    ['Fecha de Entrega', ficha.fecha_trabajo ? formatDate(ficha.fecha_trabajo) : 'Pendiente']
  ];
  
  yPosition = addInfoTable(doc, datesData, 30, yPosition, pageWidth - 60);
  
  // Si es un Service, agregar chip
  if (ficha.es_service) {
    addServiceChip(doc, 30, yPosition - 3);
    if (ficha.proximo_service) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(COLORS.success);
      doc.text(`Proximo Service: ${formatDate(ficha.proximo_service)}`, 65, yPosition - 3);
    }
    yPosition += 8;
  }
  
  // Verificar si necesitamos nueva página
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };
  
  // Orden de trabajo
  if (ficha.orden_trabajo) {
    checkNewPage(30);
    yPosition = addFormattedText(doc, 'ORDEN DE TRABAJO', ficha.orden_trabajo, 20, yPosition, pageWidth - 40);
  }
  
  // Repuestos utilizados
  if (ficha.repuestos_utilizados) {
    checkNewPage(30);
    yPosition = addFormattedText(doc, 'REPUESTOS UTILIZADOS', ficha.repuestos_utilizados, 20, yPosition, pageWidth - 40);
  }
  
  // Trabajo realizado
  if (ficha.trabajo_realizado) {
    checkNewPage(30);
    yPosition = addFormattedText(doc, 'TRABAJO REALIZADO', ficha.trabajo_realizado, 20, yPosition, pageWidth - 40);
  }
  
  // Observaciones
  if (ficha.observaciones) {
    checkNewPage(30);
    yPosition = addFormattedText(doc, 'OBSERVACIONES', ficha.observaciones, 20, yPosition, pageWidth - 40);
  }
  
  // Agregar footer a todas las páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, pageWidth, pageHeight);
  }
  
  return doc;
};

export const savePDF = async (ficha: FichaAuto): Promise<void> => {
  try {
    const pdf = generatePDF(ficha);
    const result = await window.electronAPI.exportPDF(ficha);
    
    if (result.success && result.filePath) {
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
  
  let yPosition = addHeader(doc, pageWidth);
  
  // Espacio después del header
  yPosition += 10;
  
  // Información del vehículo
  yPosition = addSection(doc, 'INFORMACION DEL VEHICULO', 20, yPosition, pageWidth - 40);
  
  const vehicleData = [
    ['Marca', autoHistory.marca],
    ['Modelo', autoHistory.modelo],
    ['Año', autoHistory.año?.toString() || ''],
    ['Patente', autoHistory.patente],
    ['Numero de Chasis', autoHistory.numero_chasis || ''],
    ['Cliente', autoHistory.cliente_nombre],
    ['Telefono', autoHistory.cliente_telefono]
  ];
  
  yPosition = addInfoTable(doc, vehicleData, 30, yPosition, pageWidth - 60);
  
  // Información del servicio específico
  const service = autoHistory.servicios[serviceIndex];
  if (!service) {
    throw new Error('Servicio no encontrado');
  }
  
  const serviceNumber = autoHistory.servicios.length - serviceIndex;
  
  // Título del servicio
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(COLORS.primary);
  doc.text(`SERVICIO #${serviceNumber}`, 20, yPosition);
  
  // Si es un Service, agregar chip
  if (service.es_service) {
    addServiceChip(doc, 80, yPosition);
    if (service.proximo_service) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(COLORS.success);
      doc.text(`Proximo: ${new Date(service.proximo_service).toLocaleDateString('es-ES')}`, 115, yPosition);
    }
  }
  
  yPosition += 20;
  
  // Fechas del servicio
  yPosition = addSection(doc, 'FECHAS DEL SERVICIO', 20, yPosition, pageWidth - 40);
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };
  
  const serviceDates = [
    ['Fecha de Ingreso', formatDate(service.fecha_ingreso)],
    ['Fecha de Entrega', service.fecha_trabajo ? formatDate(service.fecha_trabajo) : 'Pendiente'],
    ['Kilometraje', service.kilometraje ? `${service.kilometraje.toLocaleString()} km` : 'No especificado']
  ];
  
  yPosition = addInfoTable(doc, serviceDates, 30, yPosition, pageWidth - 60);
  
  // Verificar si necesitamos nueva página
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };
  
  // Orden de trabajo
  if (service.orden_trabajo) {
    checkNewPage(30);
    yPosition = addFormattedText(doc, 'ORDEN DE TRABAJO', service.orden_trabajo, 20, yPosition, pageWidth - 40);
  }
  
  // Repuestos utilizados
  if (service.repuestos_utilizados) {
    checkNewPage(30);
    yPosition = addFormattedText(doc, 'REPUESTOS UTILIZADOS', service.repuestos_utilizados, 20, yPosition, pageWidth - 40);
  }
  
  // Trabajo realizado
  if (service.trabajo_realizado) {
    checkNewPage(30);
    yPosition = addFormattedText(doc, 'TRABAJO REALIZADO', service.trabajo_realizado, 20, yPosition, pageWidth - 40);
  }
  
  // Observaciones
  if (service.observaciones) {
    checkNewPage(30);
    yPosition = addFormattedText(doc, 'OBSERVACIONES', service.observaciones, 20, yPosition, pageWidth - 40);
  }
  
  // Agregar footer a todas las páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, pageWidth, pageHeight);
  }
  
  return doc;
};

// Función para generar PDF con todos los servicios de un auto
export const generateAllServicesPDF = (autoHistory: import('../types/Auto').AutoHistory): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let yPosition = addHeader(doc, pageWidth);
  
  // Espacio después del header
  yPosition += 10;
  
  // Información del vehículo
  yPosition = addSection(doc, 'INFORMACION DEL VEHICULO', 20, yPosition, pageWidth - 40);
  
  const vehicleData = [
    ['Marca', autoHistory.marca],
    ['Modelo', autoHistory.modelo],
    ['Año', autoHistory.año?.toString() || ''],
    ['Patente', autoHistory.patente],
    ['Numero de Chasis', autoHistory.numero_chasis || ''],
    ['Cliente', autoHistory.cliente_nombre],
    ['Telefono', autoHistory.cliente_telefono],
    ['Total de Servicios', autoHistory.servicios.length.toString()]
  ];
  
  yPosition = addInfoTable(doc, vehicleData, 30, yPosition, pageWidth - 60);
  
  yPosition += 10;
  
  // Función para verificar si necesitamos una nueva página
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch {
      return dateString;
    }
  };
  
  // Iterar por todos los servicios (del más reciente al más antiguo)
  autoHistory.servicios.forEach((service: any, index: number) => {
    const serviceNumber = autoHistory.servicios.length - index;
    
    // Verificar espacio para el servicio
    checkNewPage(80);
    
    // Título del servicio con fondo
    doc.setFillColor(COLORS.lightGray);
    doc.rect(20, yPosition - 5, pageWidth - 40, 15, 'F');
    
    // Borde superior
    doc.setDrawColor(COLORS.primary);
    doc.setLineWidth(1);
    doc.line(20, yPosition - 5, pageWidth - 20, yPosition - 5);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(COLORS.primary);
    doc.text(`SERVICIO #${serviceNumber}`, 25, yPosition + 2);
    
    // Si es un Service, agregar chip
    if (service.es_service) {
      addServiceChip(doc, 130, yPosition + 2);
    }
    
    yPosition += 20;
    
    // Información del servicio en formato compacto
    const serviceInfo = [
      ['Fecha Ingreso', formatDate(service.fecha_ingreso)],
      ['Fecha Trabajo', service.fecha_trabajo ? formatDate(service.fecha_trabajo) : 'Pendiente'],
      ['Kilometraje', service.kilometraje ? `${service.kilometraje.toLocaleString()} km` : 'No especificado']
    ];
    
    serviceInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(COLORS.secondary);
      doc.text(`${label}:`, 25, yPosition);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const labelWidth = doc.getTextWidth(`${label}:`);
      doc.text(value, 25 + labelWidth + 5, yPosition);
      
      yPosition += 5;
    });
    
    yPosition += 3;
    
    // Contenido del servicio
    if (service.orden_trabajo) {
      yPosition = addFormattedText(doc, 'Orden de Trabajo', service.orden_trabajo, 25, yPosition, pageWidth - 50);
    }
    
    if (service.repuestos_utilizados) {
      yPosition = addFormattedText(doc, 'Repuestos', service.repuestos_utilizados, 25, yPosition, pageWidth - 50);
    }
    
    if (service.trabajo_realizado) {
      yPosition = addFormattedText(doc, 'Trabajo Realizado', service.trabajo_realizado, 25, yPosition, pageWidth - 50);
    }
    
    if (service.observaciones) {
      yPosition = addFormattedText(doc, 'Observaciones', service.observaciones, 25, yPosition, pageWidth - 50);
    }
    
    yPosition += 8;
  });
  
  // Agregar footer a todas las páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, pageWidth, pageHeight);
  }
  
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