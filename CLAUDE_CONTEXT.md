# Claude Context - Taller Mecánico Mínimo (Taller Nicar)

## 🎯 Propósito de este archivo
Este archivo contiene información crítica para que Claude (IA) pueda entender rápidamente el proyecto sin necesidad de explorar todo el código. Está diseñado para ser leído por Claude al inicio de una nueva conversación.

---

## 📋 Resumen Ejecutivo

**Nombre:** Taller Mecánico Mínimo - Taller Nicar
**Tipo:** Sistema web de gestión para taller mecánico automotriz
**Estado:** En producción activa
**Stack:** React + TypeScript + Material-UI + Supabase (PostgreSQL)
**Deploy:** Netlify

---

## 🏗️ Arquitectura del Sistema

### Separación Auto/Servicio (CRÍTICO)
El sistema usa un modelo de **auto único con múltiples servicios**:

- **Tabla `autos`**: Datos del vehículo y cliente (marca, modelo, patente, cliente, etc.)
- **Tabla `servicios`**: Historial de trabajos realizados al auto (fecha_trabajo, repuestos, trabajo_realizado, etc.)
- **Relación**: Un auto → Muchos servicios (1:N)

### Flujo de Datos Importante
1. Al listar fichas, se muestra cada auto con su **último servicio**
2. Al editar una ficha existente, se **actualiza el último servicio** (NO se crea uno nuevo)
3. Solo se crea un nuevo servicio cuando hay "trabajo_realizado" diferente al existente
4. Si un auto no tiene servicios, al editarlo se **crea el primer servicio**

---

## 📊 Base de Datos (Supabase/PostgreSQL)

### Tabla: `autos`
```sql
- id (SERIAL PRIMARY KEY)
- marca (VARCHAR - marca del vehículo)
- modelo (VARCHAR - modelo del vehículo)
- año (INTEGER - año del vehículo)
- patente (VARCHAR UNIQUE - identificador único, ej: ABC123)
- numero_chasis (VARCHAR - opcional)
- cliente_nombre (VARCHAR - nombre del dueño)
- cliente_telefono (VARCHAR - teléfono del cliente)
- cliente_fiel (BOOLEAN - cliente VIP/fiel)
- created_at, updated_at (TIMESTAMP)
```

### Tabla: `servicios`
```sql
- id (SERIAL PRIMARY KEY)
- auto_id (INTEGER FOREIGN KEY → autos.id ON DELETE CASCADE)
- fecha_ingreso (DATE - cuándo ingresó al taller)
- fecha_trabajo (DATE - cuándo se entregó el vehículo al cliente)
- kilometraje (INTEGER - km del vehículo)
- orden_trabajo (TEXT - qué pidió el cliente)
- repuestos_utilizados (TEXT - repuestos usados)
- trabajo_realizado (TEXT - trabajo efectivamente hecho)
- observaciones (TEXT - notas adicionales)
- es_service (BOOLEAN - es mantenimiento programado)
- proximo_service (DATE - fecha del próximo service, calculado automáticamente como +12 meses)
- created_at, updated_at (TIMESTAMP)
```

---

## 🔑 Conceptos Clave del Sistema

### Estados de Fichas
Los estados se determinan automáticamente:

- **"En Proceso"** (amarillo): `fecha_trabajo` es NULL → Vehículo NO entregado
- **"Completado"** (verde): `fecha_trabajo` existe → Vehículo entregado al cliente

### Cliente Fiel/VIP
- Campo: `cliente_fiel` (boolean)
- Propósito: Identificar clientes importantes para recordatorios automáticos

### Service (Mantenimiento)
- Campo: `es_service` (boolean)
- Cuando es TRUE, el sistema calcula automáticamente `proximo_service = fecha_trabajo + 12 meses`
- Se usa para recordatorios de mantenimiento programado

---

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── FichaForm.tsx          # Formulario crear/editar ficha
│   ├── FichasList.tsx         # Lista principal de fichas
│   ├── AutoHistory.tsx        # Historial completo de un auto
│   ├── Statistics.tsx         # Estadísticas del taller
│   ├── ReminderNotifications.tsx  # Recordatorios automáticos
│   └── ThemeToggle.tsx        # Cambio de tema claro/oscuro
├── services/
│   ├── supabaseService.ts     # CRÍTICO: Toda la lógica de BD
│   └── whatsappPuppeteer.ts   # Integración con WhatsApp
├── types/
│   ├── Auto.ts                # Tipos de Auto y Servicio
│   └── FichaAuto.ts           # Tipos del formulario
├── utils/
│   ├── pdfGenerator.ts        # Generación de PDFs
│   └── reminderSystem.ts      # Sistema de recordatorios
└── config/
    └── supabase.ts            # Cliente de Supabase
```

---

## ⚙️ Funcionalidad Crítica: `updateFicha`

**Archivo:** `src/services/supabaseService.ts`
**Líneas:** ~248-353

### Qué hace:
1. Actualiza los datos del auto SIEMPRE
2. Detecta si hay campos de servicio para actualizar
3. Si hay servicios:
   - **Si el auto NO tiene servicios**: Crea el primero
   - **Si el auto tiene servicios**: Actualiza el último
4. NUNCA crea servicios duplicados

### Campos que actualiza en servicios:
- `kilometraje`
- `fecha_trabajo` ← **CRÍTICO para cambiar estado**
- `fecha_ingreso`
- `orden_trabajo`
- `repuestos_utilizados`
- `trabajo_realizado`
- `observaciones`
- `es_service`
- `proximo_service` (calculado automáticamente)

---

## 🎨 UI/UX Importante

### Formulario de Ficha (FichaForm.tsx)
- **Altura fija**: 100% del contenedor
- **Scroll interno**: Solo el contenido del formulario (NO los botones)
- **Botones fijos**: Siempre visibles en la parte inferior
- **Cierre del modal**:
  - ✅ Click en X → Cierra
  - ✅ Click en "Cancelar" → Cierra
  - ✅ Presionar ESC → Cierra
  - ❌ Click afuera (backdrop) → NO cierra (protege datos)

### Estados visuales:
- **Chip "En Proceso"**: Color warning (amarillo/naranja)
- **Chip "Completado"**: Color success (verde)

---

## 🔄 Flujos de Trabajo Comunes

### 1. Editar una ficha existente
```
Usuario hace clic en "Editar"
→ Se carga la ficha con datos del auto + último servicio
→ Usuario modifica campos (ej: agrega fecha_trabajo)
→ Al guardar, se llama updateFicha()
→ Se actualiza el auto Y el último servicio
→ El estado cambia automáticamente según fecha_trabajo
```

### 2. Crear nueva ficha
```
Usuario hace clic en "Nueva Ficha"
→ Formulario vacío
→ Usuario completa datos
→ Al guardar, se llama insertFicha()
→ Se verifica si la patente ya existe
→ Si existe: agrega nuevo servicio
→ Si NO existe: crea auto + primer servicio
```

### 3. Ver historial de auto
```
Usuario hace clic en "Historial"
→ Se obtienen TODOS los servicios del auto
→ Se muestran ordenados por fecha (más reciente primero)
→ Cada servicio muestra: fecha, km, trabajo realizado, repuestos, etc.
```

---

## 🚨 Errores Comunes y Soluciones

### Error: Foreign Key Constraint (servicios_autos_id_fkey)
**Causa:** Intentar crear un servicio con auto_id inválido o NULL
**Solución:** Verificar que el auto existe antes de crear servicio. En `updateFicha`, ahora se usa `.maybeSingle()` y se crea el primer servicio si no existe.

### Error: Fecha de trabajo no se actualiza
**Causa:** El formulario no enviaba `fecha_trabajo` si estaba vacía
**Solución:** Ahora se envía siempre si tiene valor en `FichaForm.tsx` líneas 223-226

### Error: Doble scroll en formulario
**Causa:** Dialog y formulario ambos tenían overflow
**Solución:** DialogContent tiene `overflow: hidden`, solo el contenido interno tiene scroll

---

## 🔧 Variables de Entorno

### Desarrollo (.env.development)
```
REACT_APP_SUPABASE_URL=https://tu-proyecto-dev.supabase.co
REACT_APP_SUPABASE_ANON_KEY=tu-clave-dev
NODE_ENV=development
```

### Producción (.env.production)
```
REACT_APP_SUPABASE_URL=https://srghegdmgvtkijjydgwm.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<clave-producción>
NODE_ENV=production
```

---

## 📦 Scripts NPM

```bash
npm start              # Inicia dev server
npm run start:dev      # Cambia a .env.development y arranca
npm run start:prod     # Cambia a .env.production y arranca
npm run build          # Build para producción
npm run env:dev        # Solo cambia a dev (sin arrancar)
npm run env:prod       # Solo cambia a prod (sin arrancar)
```

---

## 🎯 Características Destacadas

1. **Validación de patentes**: Soporta formatos argentinos (ABC123, AB123CD) y chilenos (ABCD12)
2. **Detección de duplicados**: No permite servicios duplicados para el mismo auto
3. **Cálculo automático**: `proximo_service` se calcula automáticamente cuando `es_service = true`
4. **WhatsApp integration**: Genera links para enviar recordatorios vía WhatsApp Web
5. **PDF generation**: Genera PDFs profesionales de fichas individuales o historial completo
6. **Scroll con teclado**: Flechas arriba/abajo para navegar formulario
7. **Tema persistente**: Dark/Light mode guardado en localStorage

---

## 🐛 Debugging Tips

### Ver logs importantes en consola:
```javascript
// Formulario
🔍 [FORM] Enviando ficha para guardar
🔍 [FORM] Fecha trabajo enviado

// Supabase
🔍 [SUPABASE] Actualizando último servicio
🔍 [SUPABASE] Actualizando fecha_trabajo a: ...
✅ [SUPABASE] Último servicio actualizado
🆕 [SUPABASE] No hay servicios, creando el primero
```

### Verificar en Supabase:
```sql
-- Ver autos sin servicios
SELECT a.id, a.patente, COUNT(s.id) as servicios_count
FROM autos a
LEFT JOIN servicios s ON a.id = s.auto_id
GROUP BY a.id, a.patente
HAVING COUNT(s.id) = 0;

-- Ver último servicio por auto
SELECT a.patente, s.fecha_trabajo, s.trabajo_realizado
FROM autos a
LEFT JOIN servicios s ON a.id = s.auto_id
WHERE s.id IN (
  SELECT MAX(id) FROM servicios GROUP BY auto_id
);
```

---

## 📝 Notas para Claude

- **NUNCA** crear servicios nuevos al editar una ficha, solo actualizar el último
- **SIEMPRE** verificar si existe un servicio antes de crear uno
- **RECORDAR** que el estado se determina por `fecha_trabajo`, no por un campo separado
- **IMPORTANTE** mantener la separación entre datos del auto y datos del servicio
- El formulario envía TODOS los campos que tienen valor, no solo los modificados
- La fecha_trabajo es el campo MÁS CRÍTICO del sistema

---

## 🎨 Convenciones de Código

- **Logs con emojis**: Facilita debugging (🔍, ✅, ❌, 🆕, 🔧, etc.)
- **Nombres en español**: Base de datos y variables de negocio en español
- **TypeScript strict**: Tipos definidos para todo
- **Material-UI components**: Usar siempre componentes de MUI
- **Responsive design**: Mobile-first, funciona en todos los dispositivos

---

## 🔄 Última Actualización

**Fecha:** 2026-01-04
**Cambios recientes:**
- Arreglado: fecha_trabajo ahora se actualiza correctamente
- Arreglado: Error de foreign key al editar autos sin servicios
- Mejorado: UI del formulario con botones fijos y scroll solo en contenido
- Mejorado: Modal no se cierra con click afuera (protege datos del usuario)

---

## 💡 Para Claude: Cómo usar este archivo

1. Lee este archivo COMPLETO al inicio de la conversación
2. Usa la sección "Arquitectura del Sistema" para entender el modelo de datos
3. Consulta "Funcionalidad Crítica" antes de modificar `updateFicha` o `insertFicha`
4. Revisa "Errores Comunes" si el usuario reporta un problema
5. Usa los "Debugging Tips" para ayudar al usuario a diagnosticar problemas
6. Respeta las "Convenciones de Código" al escribir nuevo código

**¡Este archivo es tu mapa del proyecto! Úsalo sabiamente.**
