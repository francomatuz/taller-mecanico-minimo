import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://srghegdmgvtkijjydgwm.supabase.co'; // Tu URL del proyecto
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyZ2hlZ2RtZ3Z0a2lqanlkZ3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMzA1ODAsImV4cCI6MjA3MzkwNjU4MH0.63Tjg9SVY12RCADsH8VVOvH-Uz--ff9xsqLAKqdllOc'; // API key pública (anon)

export const supabase = createClient(supabaseUrl, supabaseKey);
