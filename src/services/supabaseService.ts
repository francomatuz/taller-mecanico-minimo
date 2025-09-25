import { supabase } from '../config/supabase';
import { Auto, AutoConServicio, AutoHistory } from '../types/Auto';

export class SupabaseService {
  
  // Obtener todas las fichas (autos con su último servicio)
  static async getAllFichas(): Promise<AutoConServicio[]> {
    try {
      const { data: autos, error: autosError } = await supabase
        .from('autos')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (autosError) throw autosError;
      
      
      const fichas: AutoConServicio[] = [];
      
      for (const auto of autos || []) {
        // Obtener el último servicio de cada auto
        const { data: ultimoServicio, error: servicioError } = await supabase
          .from('servicios')
          .select('*')
          .eq('auto_id', auto.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (servicioError) {
          console.error(`❌ [SUPABASE] Error obteniendo servicio para auto ${auto.id}:`, servicioError);
        }
        

        fichas.push({
          ...auto, // Mantener todos los datos del auto (incluyendo el ID correcto)
          // Solo agregar campos específicos del servicio, NO sobrescribir el ID
          fecha_ingreso: ultimoServicio?.fecha_ingreso,
          fecha_trabajo: ultimoServicio?.fecha_trabajo,
          kilometraje: ultimoServicio?.kilometraje,
          orden_trabajo: ultimoServicio?.orden_trabajo,
          repuestos_utilizados: ultimoServicio?.repuestos_utilizados,
          trabajo_realizado: ultimoServicio?.trabajo_realizado,
          observaciones: ultimoServicio?.observaciones,
          servicio_id: ultimoServicio?.id
        });
      }
      
      
      return fichas;
      
    } catch (error) {
      console.error('Error obteniendo fichas:', error);
      throw error;
    }
  }
  
  // Verificar si existe un servicio duplicado
  static async checkDuplicateService(autoId: number, trabajoRealizado: string, fechaTrabajo?: string): Promise<boolean> {
    try {
      console.log('🔍 [SUPABASE] Verificando duplicados para auto ID:', autoId);
      console.log('🔍 [SUPABASE] Trabajo realizado:', trabajoRealizado);
      console.log('🔍 [SUPABASE] Fecha trabajo:', fechaTrabajo);

      if (!trabajoRealizado || trabajoRealizado.trim() === '') {
        console.log('⚠️ [SUPABASE] Trabajo realizado vacío, no puede ser duplicado');
        return false; // Si no hay trabajo realizado, no puede ser duplicado
      }

      // Normalizar el trabajo realizado (trim y lowercase para comparación)
      const trabajoNormalizado = trabajoRealizado.trim().toLowerCase();

      // Obtener todos los servicios del auto para verificar duplicados
      const { data: serviciosExistentes, error } = await supabase
        .from('servicios')
        .select('id, trabajo_realizado, fecha_trabajo')
        .eq('auto_id', autoId);

      if (error) {
        console.error('❌ [SUPABASE] Error verificando duplicados:', error);
        return false;
      }

      console.log('🔍 [SUPABASE] Servicios existentes encontrados:', serviciosExistentes?.length || 0);

      // Verificar si hay algún servicio con el mismo trabajo realizado (normalizado)
      if (serviciosExistentes && serviciosExistentes.length > 0) {
        for (const servicio of serviciosExistentes) {
          const servicioTrabajoNormalizado = servicio.trabajo_realizado?.trim().toLowerCase() || '';
          
          console.log('🔍 [SUPABASE] Comparando:', trabajoNormalizado, 'vs', servicioTrabajoNormalizado);
          
          if (servicioTrabajoNormalizado === trabajoNormalizado) {
            // Si también especificó fecha de trabajo, verificar que no sea la misma fecha
            if (fechaTrabajo && servicio.fecha_trabajo === fechaTrabajo) {
              console.log('⚠️ [SUPABASE] Servicio duplicado encontrado (mismo trabajo + fecha):', servicio);
              return true;
            } else if (!fechaTrabajo) {
              // Si no especificó fecha, considerar duplicado si hay cualquier servicio con el mismo trabajo
              console.log('⚠️ [SUPABASE] Servicio duplicado encontrado (mismo trabajo realizado):', servicio);
              return true;
            }
          }
        }
      }

      console.log('✅ [SUPABASE] No se encontraron duplicados');
      return false;
    } catch (error) {
      console.error('❌ [SUPABASE] Error en checkDuplicateService:', error);
      return false;
    }
  }

  // Insertar nueva ficha (auto + servicio)
  static async insertFicha(ficha: any): Promise<{ success: boolean; id?: number; error?: string; isNewAuto?: boolean; serviceId?: number }> {
    try {
      console.log('🔍 [SUPABASE] Iniciando insertFicha para:', ficha.patente, ficha.cliente_nombre);
      
      // Verificar si el auto ya existe por patente
      const { data: autoExistente } = await supabase
        .from('autos')
        .select('id')
        .eq('patente', ficha.patente)
        .single();
      
      if (autoExistente) {
        console.log('✅ [SUPABASE] Auto existe, agregando nuevo servicio para ID:', autoExistente.id);
        
        // Verificar si ya existe un servicio duplicado
        const esDuplicado = await this.checkDuplicateService(
          autoExistente.id, 
          ficha.trabajo_realizado, 
          ficha.fecha_trabajo
        );
        
        if (esDuplicado) {
          console.log('🚫 [SUPABASE] Servicio duplicado detectado, cancelando inserción');
          return { 
            success: false, 
            error: 'Ya existe un servicio con el mismo trabajo realizado para este vehículo' 
          };
        }
        
        // Auto existe, solo agregar nuevo servicio
        const { data: nuevoServicio, error: servicioError } = await supabase
          .from('servicios')
          .insert([{
            auto_id: autoExistente.id,
            fecha_ingreso: ficha.fecha_ingreso,
            fecha_trabajo: ficha.fecha_trabajo,
            kilometraje: ficha.kilometraje,
            orden_trabajo: ficha.orden_trabajo,
            repuestos_utilizados: ficha.repuestos_utilizados,
            trabajo_realizado: ficha.trabajo_realizado,
            observaciones: ficha.observaciones
          }])
          .select()
          .single();
        
        if (servicioError) throw servicioError;
        
        console.log('✅ [SUPABASE] Servicio creado exitosamente, ID:', nuevoServicio.id);
        return { 
          success: true, 
          id: autoExistente.id, 
          isNewAuto: false, 
          serviceId: nuevoServicio.id 
        };
      } else {
        console.log('🆕 [SUPABASE] Auto no existe, creando auto nuevo + primer servicio');
        // Auto no existe, crear auto + primer servicio
        const { data: nuevoAuto, error: autoError } = await supabase
          .from('autos')
          .insert([{
            marca: ficha.marca,
            modelo: ficha.modelo,
            año: ficha.año,
            patente: ficha.patente,
            numero_chasis: ficha.numero_chasis,
            cliente_nombre: ficha.cliente_nombre,
            cliente_telefono: ficha.cliente_telefono,
            cliente_fiel: ficha.cliente_fiel || false
          }])
          .select()
          .single();
        
        if (autoError) throw autoError;
        
        console.log('✅ [SUPABASE] Auto creado exitosamente, ID:', nuevoAuto.id);
        
        // Para autos nuevos, también verificar duplicados (por si acaso)
        const esDuplicado = await this.checkDuplicateService(
          nuevoAuto.id, 
          ficha.trabajo_realizado, 
          ficha.fecha_trabajo
        );
        
        if (esDuplicado) {
          console.log('🚫 [SUPABASE] Servicio duplicado detectado en auto nuevo, cancelando inserción');
          // Eliminar el auto que acabamos de crear
          await supabase.from('autos').delete().eq('id', nuevoAuto.id);
          return { 
            success: false, 
            error: 'Ya existe un servicio con el mismo trabajo realizado' 
          };
        }
        
        // Crear primer servicio
        const { data: nuevoServicio, error: servicioError } = await supabase
          .from('servicios')
          .insert([{
            auto_id: nuevoAuto.id,
            fecha_ingreso: ficha.fecha_ingreso,
            fecha_trabajo: ficha.fecha_trabajo,
            kilometraje: ficha.kilometraje,
            orden_trabajo: ficha.orden_trabajo,
            repuestos_utilizados: ficha.repuestos_utilizados,
            trabajo_realizado: ficha.trabajo_realizado,
            observaciones: ficha.observaciones
          }])
          .select()
          .single();
        
        if (servicioError) throw servicioError;
        
        console.log('✅ [SUPABASE] Primer servicio creado exitosamente, ID:', nuevoServicio.id);
        return { 
          success: true, 
          id: nuevoAuto.id, 
          isNewAuto: true, 
          serviceId: nuevoServicio.id 
        };
      }
      
    } catch (error: any) {
      console.error('💥 [SUPABASE] Error insertando ficha:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Actualizar ficha (actualizar auto + crear nuevo servicio)
  static async updateFicha(id: number, ficha: any): Promise<{ success: boolean; error?: string; serviceId?: number }> {
    try {
      
      // Actualizar datos del auto
      const { error: autoError } = await supabase
        .from('autos')
        .update({
          marca: ficha.marca,
          modelo: ficha.modelo,
          año: ficha.año,
          patente: ficha.patente,
          numero_chasis: ficha.numero_chasis,
          cliente_nombre: ficha.cliente_nombre,
          cliente_telefono: ficha.cliente_telefono,
          cliente_fiel: ficha.cliente_fiel || false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (autoError) throw autoError;
      
      
      // Crear nuevo servicio

      const { data: nuevoServicio, error: servicioError } = await supabase
        .from('servicios')
        .insert([{
          auto_id: id,
          fecha_ingreso: ficha.fecha_ingreso,
          fecha_trabajo: ficha.fecha_trabajo,
          kilometraje: ficha.kilometraje,
          orden_trabajo: ficha.orden_trabajo,
          repuestos_utilizados: ficha.repuestos_utilizados,
          trabajo_realizado: ficha.trabajo_realizado,
          observaciones: ficha.observaciones
        }])
        .select()
        .single();
      
      if (servicioError) throw servicioError;
      
      return { success: true, serviceId: nuevoServicio.id };
      
    } catch (error: any) {
      console.error('💥 [SUPABASE] Error actualizando ficha:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Eliminar ficha (auto + todos sus servicios)
  // Eliminar servicio individual
  static async deleteService(serviceId: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ [SUPABASE] Eliminando servicio ID:', serviceId);
      
      const { error } = await supabase
        .from('servicios')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      console.log('✅ [SUPABASE] Servicio eliminado exitosamente');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [SUPABASE] Error eliminando servicio:', error);
      return { success: false, error: error.message };
    }
  }

  // Eliminar ficha (auto y todos sus servicios)
  static async deleteFicha(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      
      // Eliminar servicios primero (por las foreign keys)
      const { error: serviciosError } = await supabase
        .from('servicios')
        .delete()
        .eq('auto_id', id);
      
      if (serviciosError) throw serviciosError;
      
      // Eliminar auto
      const { error: autoError } = await supabase
        .from('autos')
        .delete()
        .eq('id', id);
      
      if (autoError) throw autoError;
      
      return { success: true };
      
    } catch (error: any) {
      console.error('💥 [SUPABASE] Error eliminando ficha:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Obtener ficha por ID
  static async getFichaById(id: number): Promise<AutoConServicio | null> {
    try {
      
      // Obtener auto
      const { data: auto, error: autoError } = await supabase
        .from('autos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (autoError) throw autoError;
      
      // Obtener último servicio
      const { data: servicio } = await supabase
        .from('servicios')
        .select('*')
        .eq('auto_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      return {
        ...auto,
        ...servicio,
        servicio_id: servicio?.id
      };
      
    } catch (error: any) {
      console.error('💥 [SUPABASE] Error obteniendo ficha por id:', error);
      return null;
    }
  }
  
  // Obtener historial de auto
  static async getAutoHistory(autoId: number): Promise<AutoHistory | null> {
    try {
      
      // Obtener auto
      const { data: auto, error: autoError } = await supabase
        .from('autos')
        .select('*')
        .eq('id', autoId)
        .maybeSingle();
      
      if (autoError) {
        console.error('❌ [SUPABASE] Error buscando auto:', autoError);
        throw autoError;
      }
      
      if (!auto) {
        return null;
      }
      
      
      // Obtener todos los servicios del auto
      const { data: servicios, error: serviciosError } = await supabase
        .from('servicios')
        .select('*')
        .eq('auto_id', autoId)
        .order('created_at', { ascending: false });
      
      
      if (serviciosError) throw serviciosError;
      
      
      const autoHistory: AutoHistory = {
        auto_id: auto.id,
        marca: auto.marca,
        modelo: auto.modelo,
        año: auto.año,
        patente: auto.patente,
        numero_chasis: auto.numero_chasis,
        cliente_nombre: auto.cliente_nombre,
        cliente_telefono: auto.cliente_telefono,
        cliente_fiel: auto.cliente_fiel || false,
        servicios: servicios || []
      };
      
      return autoHistory;
      
    } catch (error: any) {
      console.error('💥 [SUPABASE] Error obteniendo historial:', error);
      return null;
    }
  }
  
  // Buscar auto por patente
  static async searchAutoByPatente(patente: string): Promise<Auto | null> {
    try {
      const { data: auto, error } = await supabase
        .from('autos')
        .select('*')
        .eq('patente', patente)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      return auto;
      
    } catch (error: any) {
      console.error('Error buscando auto por patente:', error);
      return null;
    }
  }
}

