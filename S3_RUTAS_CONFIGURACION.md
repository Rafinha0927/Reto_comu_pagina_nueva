# 🗺️ Configuración de Rutas - S3 + CloudFront

**Bucket**: `reto-comu-pointcloud`  
**CloudFront**: `https://d2h8nqd60uagyp.cloudfront.net`  
**Fecha de actualización**: Noviembre 2025

---

## 📁 Estructura del Bucket S3

```
reto-comu-pointcloud/
├── /                           # Raíz - Archivos Potree
│   ├── cloud.las
│   ├── cloud.laz
│   ├── metadata.json
│   └── [otros archivos Potree]
│
├── /postgis/                   # Datos espaciales y GeoJSON
│   ├── boundaries.geojson
│   ├── points.json
│   ├── data.sql
│   └── [datos PostGIS]
│
├── /pointclouds/               # Alternativa para nubes de puntos
│   ├── cloud.laz
│   ├── cloud.las
│   └── [nubes adicionales]
│
├── /data/                      # Datos generales
│   ├── sensors.json
│   ├── config.json
│   └── [datos]
│
├── /potree/                    # Archivos específicos Potree
│   └── [estructura Potree]
│
├── /assets/                    # Recursos estáticos
│   ├── icons/
│   ├── textures/
│   └── [assets]
│
└── /models/                    # Modelos 3D
    ├── building.gltf
    ├── terrain.glb
    └── [modelos 3D]
```

---

## 🔗 URLs CloudFront

### Archivos Potree (Raíz)
```
https://d2h8nqd60uagyp.cloudfront.net/cloud.las
https://d2h8nqd60uagyp.cloudfront.net/cloud.laz
https://d2h8nqd60uagyp.cloudfront.net/metadata.json
```

### Datos PostGIS
```
https://d2h8nqd60uagyp.cloudfront.net/postgis/boundaries.geojson
https://d2h8nqd60uagyp.cloudfront.net/postgis/points.json
https://d2h8nqd60uagyp.cloudfront.net/postgis/data.sql
```

### Assets
```
https://d2h8nqd60uagyp.cloudfront.net/assets/icons/marker.png
https://d2h8nqd60uagyp.cloudfront.net/assets/textures/ground.jpg
```

### Modelos 3D
```
https://d2h8nqd60uagyp.cloudfront.net/models/building.gltf
https://d2h8nqd60uagyp.cloudfront.net/models/terrain.glb
```

---

## 📝 Uso en Código

### Cargar Potree
```typescript
import { getPointCloudUrls } from '@/config/cloudfront'

const urls = getPointCloudUrls()
// Retorna: ['https://d2h8nqd60uagyp.cloudfront.net/', ...]
```

### Cargar datos PostGIS
```typescript
import { getPostGISUrl } from '@/config/cloudfront'

const geoJsonUrl = getPostGISUrl('boundaries.geojson')
// Retorna: 'https://d2h8nqd60uagyp.cloudfront.net/postgis/boundaries.geojson'

const response = await fetch(geoJsonUrl)
const data = await response.json()
```

### Cargar Assets
```typescript
import { getAssetUrl } from '@/config/cloudfront'

const iconUrl = getAssetUrl('icons/marker.png')
// Retorna: 'https://d2h8nqd60uagyp.cloudfront.net/assets/icons/marker.png'
```

### Cargar Modelos 3D
```typescript
import { getModelUrl } from '@/config/cloudfront'

const modelUrl = getModelUrl('building.gltf')
// Retorna: 'https://d2h8nqd60uagyp.cloudfront.net/models/building.gltf'
```

---

## 📤 Subir Archivos

### Potree (raíz)
```bash
npm run deploy:s3:file -- "cloud.laz"
npm run deploy:s3:file -- "metadata.json"
```

### PostGIS
```bash
npm run deploy:postgis:file -- "boundaries.geojson"
npm run deploy:postgis:file -- "points.json"
npm run deploy:postgis:file -- "data.sql"
```

### Archivos específicos
```bash
# Detecta automáticamente según tipo de archivo
npm run deploy:s3:file -- "icon.png"      # → /assets/
npm run deploy:s3:file -- "building.gltf" # → /models/
npm run deploy:s3:file -- "data.json"     # → /postgis/ o /data/
```

### Deploy completo
```bash
npm run deploy:full              # Build + S3 + CloudFront
npm run deploy:full:postgis      # Build + S3 + PostGIS + CloudFront
```

---

## 🔄 Invalidar CloudFront

```bash
npm run invalidate:cf
```

Esto invalida todo el caché y fuerza refresco global.

---

## 🛠️ Variables de Entorno

### Desarrollo (.env)
```env
VITE_CLOUDFRONT_URL=https://d2h8nqd60uagyp.cloudfront.net
VITE_USE_CLOUDFRONT=false
VITE_S3_BUCKET=reto-comu-pointcloud
```

### Producción (.env.production)
```env
VITE_CLOUDFRONT_URL=https://d2h8nqd60uagyp.cloudfront.net
VITE_USE_CLOUDFRONT=true
VITE_S3_BUCKET=reto-comu-pointcloud
```

---

## 🔐 GitHub Secrets (para CI/CD)

```
AWS_ACCESS_KEY_ID = [tu_access_key]
AWS_SECRET_ACCESS_KEY = [tu_secret_key]
AWS_S3_BUCKET = reto-comu-pointcloud
AWS_CLOUDFRONT_DISTRIBUTION_ID = [id de tu distribución]
AWS_REGION = us-east-1
AWS_CLOUDFRONT_URL = https://d2h8nqd60uagyp.cloudfront.net
```

---

## 📊 Caché y Performance

### TTL por tipo de archivo

| Tipo | TTL | Ruta |
|------|-----|------|
| Potree (nube) | 30 días | `/` |
| PostGIS datos | 24 horas | `/postgis/` |
| Assets estáticos | 1 año | `/assets/` |
| Modelos 3D | 30 días | `/models/` |

---

## ✅ Checklist de Rutas

- [x] Bucket S3: `reto-comu-pointcloud`
- [x] CloudFront: `d2h8nqd60uagyp.cloudfront.net`
- [x] Estructura carpetas creada
- [x] Scripts deploy actualizados
- [x] Funciones TypeScript actualizadas
- [x] Variables de entorno configuradas
- [x] URLs de ejemplo documentadas

---

## 🚀 Primeros Pasos

1. **Subir archivo Potree**
   ```bash
   npm run deploy:s3:file -- "tu-archivo.laz"
   ```

2. **Subir datos PostGIS**
   ```bash
   npm run deploy:postgis:file -- "datos.geojson"
   ```

3. **Invalidar caché**
   ```bash
   npm run invalidate:cf
   ```

4. **Verificar en navegador**
   ```
   https://d2h8nqd60uagyp.cloudfront.net/
   https://d2h8nqd60uagyp.cloudfront.net/postgis/
   ```

---

**Última actualización**: Noviembre 2025  
**Status**: ✅ Configuración completa  
**Bucket**: reto-comu-pointcloud  
**CDN**: CloudFront distribuido globalmente

