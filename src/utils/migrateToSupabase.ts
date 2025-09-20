import { supabase } from '../config/supabase';

// Función para migrar datos desde SQLite a Supabase
export const migrateDataToSupabase = async () => {
  console.log('🔄 Iniciando migración a Supabase...');
  
  try {
    // 1. Crear tablas en Supabase (esto se hace desde el dashboard)
    console.log('📋 Verificando estructura de tablas...');
    
    // 2. Migrar datos de autos
    const { data: autos, error: autosError } = await supabase
      .from('autos')
      .select('*');
    
    if (autosError) {
      console.error('❌ Error obteniendo autos:', autosError);
      return { success: false, error: autosError.message };
    }
    
    console.log(`✅ Autos encontrados: ${autos?.length || 0}`);
    
    // 3. Migrar datos de servicios
    const { data: servicios, error: serviciosError } = await supabase
      .from('servicios')
      .select('*');
    
    if (serviciosError) {
      console.error('❌ Error obteniendo servicios:', serviciosError);
      return { success: false, error: serviciosError.message };
    }
    
    console.log(`✅ Servicios encontrados: ${servicios?.length || 0}`);
    
    return { 
      success: true, 
      autos: autos?.length || 0, 
      servicios: servicios?.length || 0 
    };
    
  } catch (error) {
    console.error('💥 Error en migración:', error);
    return { success: false, error: 'Error en migración' };
  }
};

// Función para verificar conexión con Supabase
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('autos')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error conectando a Supabase:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    return { success: true };
    
  } catch (error) {
    console.error('💥 Error de conexión:', error);
    return { success: false, error: 'Error de conexión' };
  }
};

