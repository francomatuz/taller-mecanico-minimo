import { supabase, Auto, AutoConServicio } from '../config/supabase';
import { AutoHistory } from '../types/Auto';

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
  
  // Insertar nueva ficha (auto + servicio)
  static async insertFicha(ficha: any): Promise<{ success: boolean; id?: number; error?: string; isNewAuto?: boolean; serviceId?: number }> {
    try {
      
      // Verificar si el auto ya existe por patente
      const { data: autoExistente } = await supabase
        .from('autos')
        .select('id')
        .eq('patente', ficha.patente)
        .single();
      
      if (autoExistente) {
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
        
        return { 
          success: true, 
          id: autoExistente.id, 
          isNewAuto: false, 
          serviceId: nuevoServicio.id 
        };
      } else {
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
            cliente_telefono: ficha.cliente_telefono
          }])
          .select()
          .single();
        
        if (autoError) throw autoError;
        
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

