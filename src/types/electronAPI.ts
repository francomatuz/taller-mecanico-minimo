export interface ElectronAPI {
  // Base de datos
  getAllFichas: () => Promise<any[]>;
  insertFicha: (ficha: any) => Promise<{ success: boolean; id?: number; error?: string; isNewAuto?: boolean; serviceId?: number }>;
  updateFicha: (id: number, ficha: any) => Promise<{ success: boolean; error?: string }>;
  deleteFicha: (id: number) => Promise<{ success: boolean; error?: string }>;
  getFichaById: (id: number) => Promise<any>;
  
  // Nuevos handlers para historial
  getAutoHistory: (autoId: number) => Promise<any>;
  searchAutoByPatente: (patente: string) => Promise<any>;
  
  // Handler para desarrollo
  resetDatabase: () => Promise<{ success: boolean; message?: string; error?: string }>;
  
  // Exportar e imprimir
  exportPDF: (ficha: any) => Promise<any>;
  printFicha: (ficha: any) => Promise<any>;
  
  // Utilidades
  getCurrentDate: () => string;
  getCurrentDateTime: () => string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
