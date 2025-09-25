import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase con variables de entorno
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://srghegdmgvtkijjydgwm.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyZ2hlZ2RtZ3Z0a2lqanlkZ3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMzA1ODAsImV4cCI6MjA3MzkwNjU4MH0.63Tjg9SVY12RCADsH8VVOvH-Uz--ff9xsqLAKqdllOc';

// Log para verificar qué entorno estamos usando
console.log('🔧 Entorno:', process.env.NODE_ENV);
console.log('🗄️ Supabase URL:', supabaseUrl);
console.log('🔑 Usando clave de:', supabaseUrl.includes('srghegdmgvtkijjydgwm') ? 'PRODUCCIÓN' : 'DESARROLLO');

export const supabase = createClient(supabaseUrl, supabaseKey);
