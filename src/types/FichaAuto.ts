export interface FichaAuto {
  id?: number;
  marca: string;
  modelo: string;
  año: number;
  patente: string; // OBLIGATORIO
  numero_chasis?: string;
  kilometraje?: number;
  fecha_ingreso: string;
  fecha_trabajo?: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_fiel: boolean; // Cliente VIP/Fiel para recordatorios automáticos
  orden_trabajo?: string;
  repuestos_utilizados?: string;
  trabajo_realizado?: string;
  observaciones?: string;
  es_service?: boolean;
  proximo_service?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FichaFormData {
  marca: string;
  modelo: string;
  año: string;
  patente: string;
  numero_chasis: string;
  kilometraje: string;
  fecha_ingreso: string;
  fecha_trabajo: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_fiel: boolean;
  orden_trabajo: string;
  repuestos_utilizados: string;
  trabajo_realizado: string;
  observaciones: string;
  es_service: boolean;
}

