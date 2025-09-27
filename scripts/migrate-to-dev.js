#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuración de producción (hardcoded por ahora)
const PROD_URL = 'https://srghegdmgvtkijjydgwm.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyZ2hlZ2RtZ3Z0a2lqanlkZ3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMzA1ODAsImV4cCI6MjA3MzkwNjU4MH0.63Tjg9SVY12RCADsH8VVOvH-Uz--ff9xsqLAKqdllOc';

// Configuración de desarrollo (desde .env.local)
const DEV_URL = process.env.REACT_APP_SUPABASE_URL || 'https://vyhoowtkrbkmjruofdpl.supabase.co';
const DEV_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5aG9vd3RrcmJrbWpydW9mZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA1MzIsImV4cCI6MjA3NDQxNjUzMn0.E00vgWLI92lcLpxx7zGgMJcmtlUnvxn9K_SYDkspbo8';

const prodClient = createClient(PROD_URL, PROD_KEY);
const devClient = createClient(DEV_URL, DEV_KEY);

async function migrateDatabase() {
  console.log('🚀 Iniciando migración de producción a desarrollo...');
  
  try {
    // 1. Crear estructura en desarrollo
    console.log('📋 Creando estructura de tablas...');
    await createTables();
    
    // 2. Exportar datos de producción
    console.log('📤 Exportando datos de producción...');
    const autos = await exportAutos();
    const servicios = await exportServicios();
    
    // 3. Importar datos a desarrollo
    console.log('📥 Importando datos a desarrollo...');
    await importAutos(autos);
    await importServicios(servicios);
    
    console.log('✅ Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
}

async function createTables() {
  // Crear tabla autos
  const { error: autosError } = await devClient.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS autos (
        id SERIAL PRIMARY KEY,
        marca VARCHAR(100) NOT NULL,
        modelo VARCHAR(100) NOT NULL,
        año INTEGER NOT NULL,
        patente VARCHAR(20) UNIQUE NOT NULL,
        numero_chasis VARCHAR(50),
        cliente_nombre VARCHAR(200) NOT NULL,
        cliente_telefono VARCHAR(20),
        cliente_fiel BOOLEAN DEFAULT FALSE,
        fecha_ingreso TIMESTAMP DEFAULT NOW()
      );
    `
  });
  
  if (autosError) console.log('⚠️ Tabla autos ya existe o error:', autosError.message);
  
  // Crear tabla servicios
  const { error: serviciosError } = await devClient.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS servicios (
        id SERIAL PRIMARY KEY,
        auto_id INTEGER REFERENCES autos(id) ON DELETE CASCADE,
        fecha_trabajo DATE,
        orden_trabajo TEXT,
        respuestos_utilizados TEXT,
        trabajo_realizado TEXT,
        observaciones TEXT,
        fecha_ingreso TIMESTAMP DEFAULT NOW()
      );
    `
  });
  
  if (serviciosError) console.log('⚠️ Tabla servicios ya existe o error:', serviciosError.message);
}

async function exportAutos() {
  const { data: autos, error } = await prodClient
    .from('autos')
    .select('*')
    .order('id');
    
  if (error) throw error;
  
  console.log(`📊 Exportados ${autos.length} autos de producción`);
  return autos;
}

async function exportServicios() {
  const { data: servicios, error } = await prodClient
    .from('servicios')
    .select('*')
    .order('id');
    
  if (error) throw error;
  
  console.log(`📊 Exportados ${servicios.length} servicios de producción`);
  return servicios;
}

async function importAutos(autos) {
  for (const auto of autos) {
    const { error } = await devClient
      .from('autos')
      .insert(auto);
      
    if (error) console.error('Error insertando auto:', error);
  }
  
  console.log(`✅ Importados ${autos.length} autos a desarrollo`);
}

async function importServicios(servicios) {
  for (const servicio of servicios) {
    const { error } = await devClient
      .from('servicios')
      .insert(servicio);
      
    if (error) console.error('Error insertando servicio:', error);
  }
  
  console.log(`✅ Importados ${servicios.length} servicios a desarrollo`);
}

// Ejecutar migración
migrateDatabase();

