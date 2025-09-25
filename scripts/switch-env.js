#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envFiles = {
  development: '.env.local',
  production: '.env.production.local'
};

function switchEnvironment(env) {
  const envFile = envFiles[env];
  
  if (!envFile) {
    console.error('❌ Entorno no válido. Usa: development o production');
    process.exit(1);
  }

  const envPath = path.join(process.cwd(), envFile);
  
  if (!fs.existsSync(envPath)) {
    console.error(`❌ Archivo ${envFile} no encontrado.`);
    console.log('📝 Crea el archivo con las variables de entorno correspondientes.');
    process.exit(1);
  }

  // Crear .env.local como copia del entorno seleccionado
  const envContent = fs.readFileSync(envPath, 'utf8');
  const localEnvPath = path.join(process.cwd(), '.env.local');
  
  fs.writeFileSync(localEnvPath, envContent);
  
  console.log(`✅ Cambiado a entorno: ${env.toUpperCase()}`);
  console.log(`📁 Archivo activo: .env.local`);
  console.log(`🔄 Reinicia el servidor con: npm start`);
}

const environment = process.argv[2];

if (!environment) {
  console.log('🔧 Cambiar entorno de base de datos');
  console.log('');
  console.log('Uso: node scripts/switch-env.js <entorno>');
  console.log('');
  console.log('Entornos disponibles:');
  console.log('  development  - Base de datos de prueba');
  console.log('  production   - Base de datos productiva');
  console.log('');
  console.log('Ejemplos:');
  console.log('  node scripts/switch-env.js development');
  console.log('  node scripts/switch-env.js production');
  process.exit(0);
}

switchEnvironment(environment);
