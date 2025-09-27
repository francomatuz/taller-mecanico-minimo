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
    monthsAfterService: 6, // 6 meses por defecto
    enabled: true
  };

  // Verificar recordatorios pendientes
  async checkPendingReminders(): Promise<PendingReminder[]> {
    try {
      console.log('🔍 Verificando recordatorios pendientes...');
      
      if (!this.config.enabled) {
        console.log('⏸️ Sistema de recordatorios deshabilitado');
        return [];
      }
      
      // Obtener todas las fichas
      const fichas = await SupabaseService.getAllFichas();
      
      const pendingReminders: PendingReminder[] = [];
      const today = new Date();
      const reminderDays = this.config.monthsAfterService * 30; // Convertir meses a días
      
      for (const ficha of fichas) {
        console.log('🔍 [REMINDER] Procesando ficha:', ficha.patente, ficha.cliente_nombre);
        console.log('🔍 [REMINDER] ID del auto:', ficha.id);
        console.log('🔍 [REMINDER] fecha_trabajo:', ficha.fecha_trabajo);
        console.log('🔍 [REMINDER] proximo_service:', ficha.proximo_service);
        console.log('🔍 [REMINDER] es_service:', ficha.es_service);
        console.log('🔍 [REMINDER] cliente_telefono:', ficha.cliente_telefono);
        
        // Verificar si es un Service vencido (proximo_service <= hoy)
        const isServiceVencido = ficha.proximo_service && new Date(ficha.proximo_service) <= today;
        
        // Verificar si tiene fecha_trabajo para calcular días desde servicio
        let daysSinceService = 0;
        if (ficha.fecha_trabajo) {
          const lastServiceDate = new Date(ficha.fecha_trabajo);
          daysSinceService = Math.floor((today.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24));
        }
        
        console.log('🔍 [REMINDER] daysSinceService:', daysSinceService);
        console.log('🔍 [REMINDER] isServiceVencido:', isServiceVencido);
        console.log('🔍 [REMINDER] reminderDays:', reminderDays);
        
        // Si tiene teléfono Y (es un Service vencido O han pasado los meses configurados para servicios regulares)
        if (ficha.cliente_telefono && (isServiceVencido || (ficha.fecha_trabajo && daysSinceService >= reminderDays))) {
            console.log('✅ [REMINDER] Agregando recordatorio para:', ficha.patente);
            pendingReminders.push({
              id: ficha.id || 0,
              cliente_nombre: ficha.cliente_nombre,
              cliente_telefono: ficha.cliente_telefono,
              marca: ficha.marca,
              modelo: ficha.modelo,
              patente: ficha.patente,
              fecha_trabajo: ficha.fecha_trabajo || '',
              daysSinceService: isServiceVencido ? (ficha.fecha_trabajo ? this.calculateDaysSinceService(ficha.fecha_trabajo) : 365) : daysSinceService,
              cliente_fiel: ficha.cliente_fiel || false
            });
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
      
      for (const reminder of pendingReminders) {
        try {
          const autoInfo = `${reminder.marca} ${reminder.modelo} (${reminder.patente})`;
          const monthsSince = Math.floor(reminder.daysSinceService / 30);
          
          // Verificar si es un Service vencido
          const isServiceVencido = reminder.daysSinceService >= 365; // Aproximadamente 1 año
          
          // Mensaje personalizado según tipo de recordatorio
          const message = isServiceVencido 
            ? this.generateServiceReminderMessage(reminder.cliente_nombre, autoInfo, reminder.cliente_fiel)
            : (reminder.cliente_fiel 
                ? this.generateLoyalCustomerMessage(reminder.cliente_nombre, autoInfo, monthsSince)
                : this.generateRegularCustomerMessage(reminder.cliente_nombre, autoInfo, monthsSince));
          
          const success = await whatsappPuppeteer.sendMessage(reminder.cliente_telefono, message);
          
          if (success) {
            sent++;
            console.log(`✅ Recordatorio enviado a ${reminder.cliente_nombre} (${reminder.patente})`);
          } else {
            failed++;
            console.log(`❌ Error enviando recordatorio a ${reminder.cliente_nombre} (${reminder.patente})`);
          }
        } catch (error) {
          failed++;
          console.error(`❌ Error procesando recordatorio para ${reminder.cliente_nombre}:`, error);
        }
      }
      
      console.log(`📊 Recordatorios enviados: ${sent}/${pendingReminders.length} (${failed} fallidos)`);
      return { sent, failed, total: pendingReminders.length };
      
    } catch (error) {
      console.error('❌ Error enviando recordatorios:', error);
      return { sent: 0, failed: 0, total: 0 };
    }
  }

  // Generar mensaje para cliente regular
  private generateRegularCustomerMessage(cliente: string, auto: string, monthsSince: number): string {
    return `🔧 *Recordatorio de Servicio*

Hola ${cliente}!

Han pasado ${monthsSince} meses desde el último servicio de tu vehículo *${auto}*.

¿Te gustaría agendar una cita para el mantenimiento?

Saludos,
Taller Mecánico`;
  }

  // Generar mensaje para cliente fiel
  private generateLoyalCustomerMessage(cliente: string, auto: string, monthsSince: number): string {
    return `🏆 *Cliente Fiel - Recordatorio de Servicio*

Hola ${cliente}!

Como cliente fiel, queremos recordarte que han pasado ${monthsSince} meses desde el último servicio de tu vehículo *${auto}*.

¿Te gustaría agendar una cita?

Saludos,
Taller Mecánico`;
  }

  // Generar mensaje para Service vencido
  private generateServiceReminderMessage(cliente: string, auto: string, isLoyal: boolean): string {
    const prefix = isLoyal ? '🏆 *Cliente Fiel - Service Vencido*' : '🔧 *Service Vencido*';
    const clientType = isLoyal ? 'Como cliente fiel, ' : '';
    
    return `${prefix}

Hola ${cliente}!

${clientType}tu vehículo *${auto}* necesita su Service anual.

Es importante realizar el mantenimiento programado para mantener tu vehículo en óptimas condiciones.

¿Te gustaría agendar tu Service?

Saludos,
Taller Mecánico`;
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

  // Calcular días desde el último service
  private calculateDaysSinceService(fechaTrabajo: string): number {
    const today = new Date();
    const lastServiceDate = new Date(fechaTrabajo);
    return Math.floor((today.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24));
  }
}

// Instancia singleton
export const reminderSystem = new ReminderSystem();