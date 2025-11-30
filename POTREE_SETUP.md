# Guía de Integración: DynamoDB + Potree Point Cloud

## 1. ESTRUCTURA DE DATOS EN DYNAMODB

Tu tabla `sensor-data` debe tener la siguiente estructura:

### Partition Key (PK)
- **sensorId** (String) - Identificador único del sensor
  - Ejemplos: "sensor-01", "sensor-02", "sensor-03"

### Sort Key (SK)
- **timestamp** (Number) - Marca de tiempo en milisegundos
  - Ejemplos: 1701283200000

### Atributos Requeridos

```json
{
  "sensorId": "sensor-01",
  "timestamp": 1701283200000,
  "receivedAt": "2025-11-29T10:30:00Z",
  "temperature": 22.5,
  "humidity": 65.3,
  "location": {
    "x": 100.5,
    "y": 200.3,
    "z": 50.8
  }
}
```

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| sensorId | String | ID único del sensor | "sensor-01" |
| timestamp | Number | Marca de tiempo (ms) | 1701283200000 |
| receivedAt | String | Fecha ISO 8601 | "2025-11-29T10:30:00Z" |
| temperature | Number | Temperatura en °C | 22.5 |
| humidity | Number | Humedad en % | 65.3 |
| location.x | Number | Coordenada X de Potree | 100.5 |
| location.y | Number | Coordenada Y de Potree | 200.3 |
| location.z | Number | Coordenada Z de Potree | 50.8 |

---

## 2. ARCHIVOS DE POTREE NECESARIOS

Potree requiere los siguientes archivos para funcionar:

### Opción A: Usar desde CDN (Más fácil)

```html
<script src="https://cdn.jsdelivr.net/npm/potree@1.8/build/potree.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/potree@1.8/build/potree.css">
```

### Opción B: Descargar archivos locales

1. Descarga los archivos de: https://github.com/potree/potree/releases/tag/1.8

2. Estructura de carpetas:
```
frontend/public/potree/
  ├── build/
  │   ├── potree.js
  │   ├── potree.css
  │   └── potree.min.js
  ├── libs/
  │   ├── three.js
  │   ├── three.min.js
  │   └── ...other libraries
```

---

## 3. FORMATOS DE NUBE DE PUNTOS SOPORTADOS

### Formato LAZ (Recomendado)
- Archivo comprimido
- Mejor compresión
- Extensión: `.laz`

### Formato LAS
- Formato estándar para lidar
- Sin compresión
- Extensión: `.las`

### Ubicación del archivo
```
frontend/public/pointclouds/
  └── tu_nube_de_puntos.laz
```

---

## 4. IMPLEMENTACIÓN EN EL COMPONENTE POTREEVIEWER

El archivo `PotreeViewer.tsx` ya está configurado para:

1. **Cargar las librerías de Potree y Three.js desde CDN**
```typescript
const scripts = [
  'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.min.js',
  'https://cdn.jsdelivr.net/npm/potree@1.8/build/potree.js'
];
```

2. **Crear una escena 3D**
```typescript
const scene = new (window as any).THREE.Scene();
```

3. **Renderizar sensores como puntos**
```typescript
const geometry = new (window as any).THREE.BufferGeometry();
geometry.setAttribute('position', 
  new (window as any).THREE.BufferAttribute(positions, 3)
);
```

4. **Detectar clics en puntos** (Raycasting)
```typescript
const intersects = raycaster.intersectObject(points);
if (intersects.length > 0) {
  const point = intersects[0].point;
  // Accionar modal con datos del sensor
}
```

---

## 5. INTEGRACIÓN PASO A PASO

### Paso 1: Preparar tu archivo de nube de puntos

1. Si tienes archivos LAS/LAZ, guárdalos en `frontend/public/pointclouds/`
2. Si no tienes, puedes generar uno con Python:

```python
# Ejemplo con las coordenadas de tus sensores
import numpy as np
from laspy.file import File

# Crear puntos desde tus sensores en DynamoDB
points_x = [100.5, 150.2, 200.1, 250.3]  # X del sensor
points_y = [200.3, 220.1, 240.5, 260.2]  # Y del sensor
points_z = [50.8, 55.2, 48.1, 52.5]      # Z del sensor

# Crear archivo LAS
outfile = File("sensores.las", mode="w", header=File("plantilla.las").header)
outfile.X = points_x
outfile.Y = points_y
outfile.Z = points_z
outfile.close()
```

### Paso 2: Configurar el backend

El archivo `backend/src/services/dynamodb.ts` ya incluye:
- Función para obtener últimas lecturas: `getLatestReadings()`
- Función para obtener histórico: `getReadingsBySensor(sensorId)`
- Función para guardar nuevas lecturas: `saveReading(data)`

### Paso 3: Exponer datos en la API

En `backend/src/routes/sensors.ts`, ya hay rutas:

```typescript
// Obtener última lectura de todos los sensores
GET /api/sensors/latest

// Obtener histórico de un sensor
GET /api/sensors/:sensorId/history

// Obtener histórico con filtro de fechas
GET /api/sensors/:sensorId/history?startTime=1701283200000&endTime=1701369600000
```

### Paso 4: Conectar el frontend con WebSocket

El archivo `frontend/src/hooks/usewebsocket.ts` ya:
- Conecta con `ws://localhost:3000/api/sensors`
- Recibe actualizaciones en tiempo real
- Actualiza el estado con nuevos datos

### Paso 5: Mostrar datos en PotreeViewer

El componente `PotreeViewer.tsx` ya:
- Renderiza puntos de sensores
- Detecta clics en puntos
- Emite evento `onSensorClick` con ID del sensor
- El componente `Dashboard.tsx` abre `SensorModal` con los datos

---

## 6. CÓMO CARGAR UNA NUBE DE PUNTOS EXISTENTE

### En PotreeViewer.tsx, añade después de crear la escena:

```typescript
// Cargar nube de puntos desde archivo
const viewer = new (window as any).Potree.Viewer(canvas);
viewer.scene.addPointCloud(
  await (window as any).Potree.POCLoader.load(
    '/pointclouds/tu_nube.laz'
  )
);
```

### O carga puntos individuales desde DynamoDB:

```typescript
// Los sensores ya se cargan como puntos desde latestData
// con sus coordenadas en location.x, location.y, location.z
```

---

## 7. FLUJO COMPLETO DE DATOS

```
DynamoDB (sensor-data table)
    ↓
Backend /api/sensors/latest
    ↓
WebSocket ws://localhost:3000/api/sensors
    ↓
Frontend usewebsocket hook
    ↓
PotreeViewer.tsx (renderiza puntos)
    ↓
Click en punto → onSensorClick
    ↓
Dashboard.tsx (selecciona sensor)
    ↓
SensorModal.tsx (muestra datos)
```

---

## 8. VARIABLES DE ENTORNO NECESARIAS

### .env (Backend)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA4FLTFK3QCHJ3DLHD
AWS_SECRET_ACCESS_KEY=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
DYNAMODB_TABLE=sensor-data
PORT=3000
```

---

## 9. CHECKLIST DE IMPLEMENTACIÓN

- [ ] Verificar estructura de tabla en DynamoDB
- [ ] Confirmar que todos los sensores tienen `sensorId` y `timestamp`
- [ ] Asegurar que cada sensor tiene `location` con `x`, `y`, `z`
- [ ] Copiar archivo `.env` con credenciales AWS
- [ ] Descargar o preparar archivo de nube de puntos
- [ ] Guardar en `frontend/public/pointclouds/`
- [ ] Ejecutar `npm run dev` en backend
- [ ] Ejecutar `npm run dev` en frontend
- [ ] Verificar WebSocket en DevTools (Console)
- [ ] Hacer clic en puntos para verificar interactividad

---

## 10. TROUBLESHOOTING

### Problema: Los puntos no se renderizan
- [ ] Verificar que `latestData` contiene datos
- [ ] Verificar que cada sensor tiene `location.x`, `location.y`, `location.z`
- [ ] Abrir DevTools > Console para ver errores

### Problema: WebSocket no conecta
- [ ] Verificar que backend corre en `localhost:3000`
- [ ] Revisar proxy en `vite.config.ts`
- [ ] Buscar errores en DevTools > Network > WS

### Problema: Nube de puntos no carga
- [ ] Verificar formato de archivo (.laz o .las)
- [ ] Confirmar ruta correcta en `public/pointclouds/`
- [ ] Revisar permisos de archivo

---

## 11. RECURSOS ÚTILES

- Documentación Potree: https://potree.org/
- Three.js Docs: https://threejs.org/docs/
- AWS DynamoDB: https://docs.aws.amazon.com/dynamodb/
- Formato LAZ/LAS: https://www.asprs.org/divisions/lidar/las-specifications

