import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://srghegdmgvtkijjydgwm.supabase.co'; // Tu URL del proyecto
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyZ2hlZ2RtZ3Z0a2lqanlkZ3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMzA1ODAsImV4cCI6MjA3MzkwNjU4MH0.63Tjg9SVY12RCADsH8VVOvH-Uz--ff9xsqLAKqdllOc'; // API key pública (anon)

export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos para TypeScript
export interface Auto {
  id: number;
  marca: string;
  modelo: string;
  año: number;
  patente: string;
  numero_chasis?: string;
  cliente_nombre: string;
  cliente_telefono: string;
  created_at: string;
  updated_at: string;
}

export interface Servicio {
  id: number;
  auto_id: number;
  fecha_ingreso: string;
  fecha_trabajo?: string;
  kilometraje?: number;
  orden_trabajo?: string;
  repuestos_utilizados?: string;
  trabajo_realizado?: string;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface AutoConServicio extends Auto {
  servicio_id?: number;
  fecha_ingreso?: string;
  fecha_trabajo?: string;
  kilometraje?: number;
  orden_trabajo?: string;
  repuestos_utilizados?: string;
  trabajo_realizado?: string;
  observaciones?: string;
}

export interface AutoHistory extends Auto {
  servicios: Servicio[];
}
