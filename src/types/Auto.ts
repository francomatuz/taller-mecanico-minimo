export interface Auto {
  id: number;
  marca: string;
  modelo: string;
  año: number;
  patente: string; // OBLIGATORIO y ÚNICO
  numero_chasis?: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_fiel: boolean; // Cliente VIP/Fiel para recordatorios automáticos
  created_at: string;
  updated_at?: string;
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
  es_service?: boolean;
  proximo_service?: string;
  created_at: string;
  updated_at?: string;
}

// Para mostrar en la lista principal (auto con último servicio)
export interface AutoConServicio {
  // Info del auto
  id: number;
  marca: string;
  modelo: string;
  año: number;
  patente: string;
  numero_chasis?: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_fiel: boolean;
  created_at: string;
  updated_at?: string;
  
  // Info del último servicio
  servicio_id?: number;
  fecha_ingreso?: string;
  fecha_trabajo?: string;
  kilometraje?: number;
  orden_trabajo?: string;
  repuestos_utilizados?: string;
  trabajo_realizado?: string;
  observaciones?: string;
  es_service?: boolean;
  proximo_service?: string;
}

// Para mostrar historial completo de un auto
export interface AutoHistory {
  auto_id: number;
  marca: string;
  modelo: string;
  año: number;
  patente: string;
  numero_chasis?: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_fiel: boolean;
  servicios: Servicio[];
}

