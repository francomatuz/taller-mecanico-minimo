// Declaración de tipos globales para la API de Electron
declare global {
  interface Window {
    electronAPI: {
      // Base de datos
      getAllFichas: () => Promise<any[]>;
      insertFicha: (ficha: any) => Promise<{ success: boolean; id?: number; error?: string }>;
      updateFicha: (id: number, ficha: any) => Promise<{ success: boolean; error?: string }>;
      deleteFicha: (id: number) => Promise<{ success: boolean; error?: string }>;
      getFichaById: (id: number) => Promise<any>;
      
      // Exportar e imprimir
      exportPDF: (ficha: any) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
      printFicha: (ficha: any) => Promise<{ success: boolean; error?: string }>;
      
      // Utilidades
      getCurrentDate: () => string;
      getCurrentDateTime: () => string;
    };
  }
}

export {};


