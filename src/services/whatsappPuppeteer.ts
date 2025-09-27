// WhatsApp Web Service (Versión Simplificada)
// Abre WhatsApp Web con mensajes pre-escritos

class WhatsAppWebService {
  // Enviar mensaje individual (abre WhatsApp Web)
  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      console.log(`📱 Abriendo WhatsApp Web para ${phoneNumber}...`);
      
      // Limpiar número de teléfono
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Crear URL de WhatsApp Web
      const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      
      // Abrir en nueva ventana
      window.open(url, '_blank');
      
      console.log(`✅ WhatsApp Web abierto para ${phoneNumber}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error abriendo WhatsApp Web para ${phoneNumber}:`, error);
      return false;
    }
  }

  // Enviar recordatorio de servicio
  async sendServiceReminder(clientName: string, phoneNumber: string, autoInfo: string, lastService: string): Promise<boolean> {
    const message = `🔧 *Recordatorio de Servicio*

Hola ${clientName}!

Tu vehículo *${autoInfo}* necesita servicio.
Último service: ${lastService}

¿Te gustaría agendar una cita?

Saludos,
Taller Mecánico`;

    return this.sendMessage(phoneNumber, message);
  }

  // Enviar recordatorio anual para clientes fieles
  async sendAnnualReminder(clientName: string, phoneNumber: string, autoInfo: string): Promise<boolean> {
    const message = `🏆 *Cliente Fiel - Recordatorio Anual*

Hola ${clientName}!

Como cliente fiel, queremos recordarte que tu vehículo *${autoInfo}* necesita su servicio anual.

¿Te gustaría agendar una cita?

Saludos,
Taller Mecánico`;

    return this.sendMessage(phoneNumber, message);
  }
}

// Instancia singleton
export const whatsappPuppeteer = new WhatsAppWebService();

// Función para detectar si es dispositivo móvil
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768 ||
         'ontouchstart' in window;
};

// Función para abrir WhatsApp (detecta dispositivo automáticamente)
export const openWhatsAppWeb = (phoneNumber: string, message: string) => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  
  if (isMobileDevice()) {
    // Dispositivo móvil: abrir WhatsApp nativo
    const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
    
    // Intentar abrir WhatsApp nativo
    window.location.href = whatsappUrl;
    
    // Fallback: si WhatsApp no está instalado, abrir WhatsApp Web
    setTimeout(() => {
      const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
      window.open(webUrl, '_blank');
    }, 1000);
    
    console.log('📱 WhatsApp nativo abierto (móvil)');
  } else {
    // Computadora: abrir WhatsApp Web
    const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
    window.open(webUrl, '_blank');
    
    console.log('💻 WhatsApp Web abierto (desktop)');
  }
};

// Función para generar mensaje de recordatorio
export const generateReminderMessage = (cliente: string, auto: string, ultimoService: string): string => {
  return `🔧 *Recordatorio de Servicio*

Hola ${cliente}!

Tu vehículo *${auto}* necesita servicio.
Último service: ${ultimoService}

¿Te gustaría agendar una cita?

Saludos,
Taller Mecánico`;
};

// Función para generar mensaje completo de ficha con servicios
export const generateFichaCompletaMessage = (ficha: any, servicios: any[]): string => {
  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('es-ES');
  };

  let message = `📋 *FICHA DE SERVICIO - TALLER NICAR* 🚗

*VEHÍCULO:*
• Marca: ${ficha.marca}
• Modelo: ${ficha.modelo}
• Año: ${ficha.año}
• Patente: ${ficha.patente || 'No especificada'}
• Chasis: ${ficha.numero_chasis || 'No especificado'}
• Kilometraje: ${ficha.kilometraje ? ficha.kilometraje.toLocaleString() + ' km' : 'No especificado'}

*SERVICIOS REALIZADOS:*`;

  if (servicios && servicios.length > 0) {
    servicios.forEach((servicio, index) => {
      message += `\n\n*Servicio ${index + 1}:*
• Fecha: ${formatDate(servicio.fecha_trabajo || servicio.fecha_ingreso)}
• Kilometraje: ${servicio.kilometraje ? servicio.kilometraje.toLocaleString() + ' km' : 'No especificado'}`;

      if (servicio.orden_trabajo) {
        message += `\n• Orden: ${servicio.orden_trabajo}`;
      }
      if (servicio.repuestos_utilizados) {
        message += `\n• Repuestos: ${servicio.repuestos_utilizados}`;
      }
      if (servicio.trabajo_realizado) {
        message += `\n• Trabajo: ${servicio.trabajo_realizado}`;
      }
      if (servicio.observaciones) {
        message += `\n• Observaciones: ${servicio.observaciones}`;
      }
      if (servicio.es_service) {
        message += `\n• ✅ Service Programado`;
        if (servicio.proximo_service) {
          message += `\n• Próximo Service: ${formatDate(servicio.proximo_service)}`;
        }
      }
    });
  } else {
    message += `\n\nNo hay servicios registrados aún.`;
  }

  message += `\n\n*FECHA DE INGRESO:* ${formatDate(ficha.fecha_ingreso)}`;

  if (ficha.fecha_trabajo) {
    message += `\n*FECHA DE FINALIZACIÓN:* ${formatDate(ficha.fecha_trabajo)}`;
  }

  message += `\n\nTaller Nicar - Servicio de Calidad`;

  return message;
};
