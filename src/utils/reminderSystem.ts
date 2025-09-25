// Sistema de Recordatorios Automáticos
// Detecta servicios realizados y programa recordatorios

import { SupabaseService } from '../services/supabaseService';
import { whatsappPuppeteer } from '../services/whatsappPuppeteer';

export interface ReminderConfig {
  monthsAfterService: number; // Meses después del servicio para recordar
  enabled: boolean;
}

export interface PendingReminder {
  id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  marca: string;
  modelo: string;
  patente: string;
  fecha_trabajo: string;
  daysSinceService: number;
  cliente_fiel: boolean;
}

class ReminderSystem {
  private config: ReminderConfig = {
    monthsAfterService: 6, // Recordar cada 6 meses
    enabled: true
  };

  // Configurar el sistema de recordatorios
  setConfig(config: Partial<ReminderConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Verificar servicios que necesitan recordatorios
  async checkPendingReminders(): Promise<PendingReminder[]> {
    try {
      console.log('🔍 Verificando recordatorios pendientes...');
      
      // Obtener todas las fichas
      const fichas = await SupabaseService.getAllFichas();
      
      const pendingReminders: PendingReminder[] = [];
      const today = new Date();
      const reminderDays = this.config.monthsAfterService * 30; // Convertir meses a días
      
      for (const ficha of fichas) {
        if (ficha.fecha_trabajo && ficha.cliente_telefono) {
          const lastServiceDate = new Date(ficha.fecha_trabajo);
          const daysSinceService = Math.floor((today.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Si han pasado los meses configurados
          if (daysSinceService >= reminderDays) {
            pendingReminders.push({
              id: ficha.id || 0,
              cliente_nombre: ficha.cliente_nombre,
              cliente_telefono: ficha.cliente_telefono,
              marca: ficha.marca,
              modelo: ficha.modelo,
              patente: ficha.patente,
              fecha_trabajo: ficha.fecha_trabajo,
              daysSinceService,
              cliente_fiel: ficha.cliente_fiel || false
            });
          }
        }
      }
      
      // Ordenar por días desde el último servicio (más antiguos primero)
      pendingReminders.sort((a, b) => b.daysSinceService - a.daysSinceService);
      
      console.log(`📊 Encontrados ${pendingReminders.length} recordatorios pendientes`);
      return pendingReminders;
      
    } catch (error) {
      console.error('❌ Error verificando recordatorios:', error);
      return [];
    }
  }

  // Enviar recordatorios pendientes
  async sendPendingReminders(): Promise<{ sent: number; failed: number; total: number }> {
    try {
      const pendingReminders = await this.checkPendingReminders();
      
      if (pendingReminders.length === 0) {
        console.log('✅ No hay recordatorios pendientes');
        return { sent: 0, failed: 0, total: 0 };
      }
      
      let sent = 0;
      let failed = 0;
      
      console.log(`📱 Enviando ${pendingReminders.length} recordatorios...`);
      
      for (const reminder of pendingReminders) {
        try {
          const autoInfo = `${reminder.marca} ${reminder.modelo} (${reminder.patente})`;
          const monthsSince = Math.floor(reminder.daysSinceService / 30);
          
          // Mensaje personalizado según si es cliente fiel
          const message = reminder.cliente_fiel 
            ? this.generateLoyalCustomerMessage(reminder.cliente_nombre, autoInfo, monthsSince)
            : this.generateRegularCustomerMessage(reminder.cliente_nombre, autoInfo, monthsSince);
          
          const success = await whatsappPuppeteer.sendMessage(reminder.cliente_telefono, message);
          
          if (success) {
            sent++;
            console.log(`✅ Recordatorio enviado a ${reminder.cliente_nombre} (${reminder.patente})`);
          } else {
            failed++;
            console.log(`❌ Error enviando a ${reminder.cliente_nombre} (${reminder.patente})`);
          }
          
          // Pausa entre mensajes para evitar límites
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          failed++;
          console.error(`❌ Error procesando recordatorio para ${reminder.cliente_nombre}:`, error);
        }
      }
      
      const result = { sent, failed, total: pendingReminders.length };
      console.log('📊 Resultado de recordatorios:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en envío de recordatorios:', error);
      return { sent: 0, failed: 0, total: 0 };
    }
  }

  // Generar mensaje para cliente fiel
  private generateLoyalCustomerMessage(cliente: string, auto: string, monthsSince: number): string {
    return `🏆 *Cliente Fiel - Recordatorio de Servicio*

Hola ${cliente}!

Como cliente fiel, queremos recordarte que tu vehículo *${auto}* necesita servicio.

Han pasado ${monthsSince} meses desde tu último servicio.

¿Te gustaría agendar una cita?

Saludos,
Taller Mecánico`;
  }

  // Generar mensaje para cliente regular
  private generateRegularCustomerMessage(cliente: string, auto: string, monthsSince: number): string {
    return `🔧 *Recordatorio de Servicio*

Hola ${cliente}!

Tu vehículo *${auto}* necesita servicio.

Han pasado ${monthsSince} meses desde tu último servicio.

¿Te gustaría agendar una cita?

Saludos,
Taller Mecánico`;
  }

  // Verificar recordatorios cada X tiempo (para uso en useEffect)
  async checkAndSendReminders(): Promise<void> {
    if (!this.config.enabled) {
      console.log('⏸️ Sistema de recordatorios deshabilitado');
      return;
    }
    
    const result = await this.sendPendingReminders();
    
    if (result.sent > 0) {
      console.log(`🎉 ${result.sent} recordatorios enviados exitosamente`);
    }
  }

  // Obtener configuración actual
  getConfig(): ReminderConfig {
    return { ...this.config };
  }

  // Habilitar/deshabilitar recordatorios
  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    console.log(`🔧 Sistema de recordatorios ${enabled ? 'habilitado' : 'deshabilitado'}`);
  }

  // Cambiar intervalo de recordatorios
  setReminderInterval(months: number) {
    this.config.monthsAfterService = months;
    console.log(`🔧 Intervalo de recordatorios cambiado a ${months} meses`);
  }
}

// Instancia singleton
export const reminderSystem = new ReminderSystem();

// Función para verificar recordatorios (para usar en useEffect)
export const checkReminders = async (): Promise<void> => {
  await reminderSystem.checkAndSendReminders();
};
