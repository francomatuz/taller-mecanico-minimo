# 🗄️ Configuración de Base de Datos

## 📋 Instrucciones para Configurar Entornos

### 🚀 Paso 1: Crear Proyecto de Desarrollo en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un **nuevo proyecto** para desarrollo
3. Anota la **URL** y **API Key** del proyecto

### 🔧 Paso 2: Configurar Archivos de Entorno

#### Para Desarrollo (Base de datos de prueba):
```bash
# Copia el archivo de ejemplo
cp env.development.example .env.local

# Edita .env.local con tus datos de desarrollo
REACT_APP_SUPABASE_URL=https://tu-proyecto-dev.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-clave-anonima-dev
NODE_ENV=development
```

#### Para Producción (Base de datos actual):
```bash
# Copia el archivo de ejemplo
cp env.production.example .env.production.local

# Ya está configurado con tu base de datos actual
```

### 🎯 Paso 3: Usar los Scripts

#### Cambiar a entorno de desarrollo:
```bash
npm run env:dev
npm start
```

#### Cambiar a entorno de producción:
```bash
npm run env:prod
npm start
```

#### O usar los comandos combinados:
```bash
npm run start:dev    # Cambia a dev y arranca
npm run start:prod   # Cambia a prod y arranca
```

### 🔍 Verificar Entorno

Cuando arranques la aplicación, verás en la consola:
- 🔧 **Entorno:** development/production
- 🗄️ **Supabase URL:** tu URL actual
- 🔑 **Usando clave de:** DESARROLLO/PRODUCCIÓN

### ⚠️ Importante

- **NUNCA** subas los archivos `.env.local` o `.env.production.local` a git
- **SIEMPRE** usa la base de datos de desarrollo para pruebas
- **SOLO** usa producción cuando estés seguro de los cambios

### 🗃️ Estructura de Base de Datos

Asegúrate de que tu base de datos de desarrollo tenga las mismas tablas:

```sql
-- Tabla autos
CREATE TABLE autos (
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

-- Tabla servicios
CREATE TABLE servicios (
  id SERIAL PRIMARY KEY,
  auto_id INTEGER REFERENCES autos(id) ON DELETE CASCADE,
  fecha_trabajo DATE,
  orden_trabajo TEXT,
  respuestos_utilizados TEXT,
  trabajo_realizado TEXT NOT NULL,
  observaciones TEXT,
  fecha_ingreso TIMESTAMP DEFAULT NOW()
);
```
