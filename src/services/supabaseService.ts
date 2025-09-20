import { supabase, Auto, AutoConServicio, AutoHistory } from '../config/supabase';

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
        const { data: ultimoServicio } = await supabase
          .from('servicios')
          .select('*')
          .eq('auto_id', auto.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        fichas.push({
          ...auto,
          ...ultimoServicio,
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
      console.log('💾 [SUPABASE] Insertando ficha:', ficha);
      
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
        
        console.log('✅ [SUPABASE] Nuevo servicio agregado:', nuevoServicio.id);
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
        
        console.log('✅ [SUPABASE] Nuevo auto y servicio creados:', nuevoAuto.id, nuevoServicio.id);
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
      console.log('🔄 [SUPABASE] Actualizando ficha ID:', id, 'con datos:', ficha);
      
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
      
      console.log('✅ [SUPABASE] Auto actualizado correctamente');
      
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
      
      console.log('✅ [SUPABASE] Nuevo servicio creado correctamente con ID:', nuevoServicio.id);
      return { success: true, serviceId: nuevoServicio.id };
      
    } catch (error: any) {
      console.error('💥 [SUPABASE] Error actualizando ficha:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Eliminar ficha (auto + todos sus servicios)
  static async deleteFicha(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ [SUPABASE] Eliminando auto ID:', id);
      
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
      
      console.log('✅ [SUPABASE] Auto y servicios eliminados correctamente');
      return { success: true };
      
    } catch (error: any) {
      console.error('💥 [SUPABASE] Error eliminando ficha:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Obtener ficha por ID
  static async getFichaById(id: number): Promise<AutoConServicio | null> {
    try {
      console.log('🔍 [SUPABASE] Obteniendo ficha por ID:', id);
      
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
      
      console.log('✅ [SUPABASE] Ficha obtenida:', auto);
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
      console.log('🔍 [SUPABASE] Buscando historial para auto ID:', autoId);
      
      // Obtener auto
      const { data: auto, error: autoError } = await supabase
        .from('autos')
        .select('*')
        .eq('id', autoId)
        .single();
      
      if (autoError) throw autoError;
      
      console.log('✅ [SUPABASE] Auto encontrado:', auto.marca, auto.modelo, auto.patente);
      
      // Obtener todos los servicios del auto
      const { data: servicios, error: serviciosError } = await supabase
        .from('servicios')
        .select('*')
        .eq('auto_id', autoId)
        .order('created_at', { ascending: false });
      
      if (serviciosError) throw serviciosError;
      
      console.log('📋 [SUPABASE] Servicios encontrados:', servicios?.length || 0);
      
      const autoHistory: AutoHistory = {
        ...auto,
        servicios: servicios || []
      };
      
      console.log('📤 [SUPABASE] Enviando historial completo:', autoHistory);
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

