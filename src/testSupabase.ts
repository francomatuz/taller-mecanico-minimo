import { testSupabaseConnection } from './utils/migrateToSupabase';

// Función para probar la conexión con Supabase
const testConnection = async () => {
  console.log('🧪 Probando conexión con Supabase...');
  
  try {
    const result = await testSupabaseConnection();
    
    if (result.success) {
      console.log('✅ Conexión exitosa con Supabase!');
      console.log('🎉 Ya puedes usar la base de datos en la nube');
    } else {
      console.error('❌ Error de conexión:', result.error);
    }
  } catch (error) {
    console.error('💥 Error:', error);
  }
};

// Ejecutar prueba
testConnection();

