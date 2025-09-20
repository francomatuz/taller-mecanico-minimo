// Configuración para la aplicación web
export const webConfig = {
  // Supabase ya está configurado en src/config/supabase.ts
  // No necesitamos cambios aquí
  
  // Configuración del entorno web
  environment: 'web',
  
  // URL base para la aplicación
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://tu-dominio.com' 
    : 'http://localhost:3000',
    
  // Configuración de la aplicación
  appName: 'Taller Mecánico - Sistema de Gestión',
  version: '1.0.0'
};

// Función para detectar si estamos en un navegador
export const isBrowser = typeof window !== 'undefined';

// Función para obtener la URL actual
export const getCurrentUrl = () => {
  if (isBrowser) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

