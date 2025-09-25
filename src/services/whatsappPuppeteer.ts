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

// Función para abrir WhatsApp Web con mensaje (alternativa simple)
export const openWhatsAppWeb = (phoneNumber: string, message: string) => {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
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
