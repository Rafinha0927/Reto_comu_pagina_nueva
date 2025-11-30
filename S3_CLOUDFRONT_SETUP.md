# 🚀 Configuración de Nube de Puntos con S3 + CloudFront

## PASO 1: Crear cuenta AWS y configurar S3

### 1.1 - Crear bucket S3

```bash
# Con AWS CLI
aws s3 mb s3://mi-nube-puntos --region us-east-1
```

O en AWS Console:
1. Ve a: https://s3.console.aws.amazon.com/
2. Click "Create bucket"
3. Nombre: `mi-nube-puntos` (debe ser único globalmente)
4. Region: `us-east-1`
5. Click "Create"

### 1.2 - Subir archivo a S3

```bash
# Con AWS CLI
aws s3 cp cloud.laz s3://mi-nube-puntos/pointclouds/cloud.laz

# O desde AWS Console:
# 1. Abre el bucket
# 2. Click "Upload"
# 3. Selecciona tu archivo
# 4. Click "Upload"
```

---

## PASO 2: Configurar permisos de S3

### 2.1 - Crear política de acceso público

En AWS Console:

1. Ve a: S3 > tu-bucket > Permissions
2. Haz scroll hasta "Bucket policy"
3. Click "Edit"
4. Pega esta política:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::mi-nube-puntos/*"
    }
  ]
}
```

5. Click "Save changes"

### 2.2 - Desactivar "Block Public Access" (si es necesario)

1. Ve a: S3 > tu-bucket > Permissions
2. Scroll hasta "Block public access"
3. Click "Edit"
4. Desactiva las 4 opciones si quieres acceso público
5. Click "Save"

---

## PASO 3: Crear distribución CloudFront

### 3.1 - Crear distribución

En AWS Console:

1. Ve a: CloudFront > Distributions
2. Click "Create distribution"
3. **Origin domain**: Selecciona tu bucket S3
4. **Viewer protocol policy**: "Redirect HTTP to HTTPS"
5. **Allowed HTTP methods**: GET, HEAD, OPTIONS
6. **Cache policy**: "Managed-CachingOptimized"
7. **Origin access**: "Origin access control settings (recommended)"
8. Click "Create"

### 3.2 - Copiar el Domain Name de CloudFront

En CloudFront > Distributions > tu-distribución:
- Domain name: `d123456abc.cloudfront.net` ← Copia esto

---

## PASO 4: Configurar en la aplicación

### 4.1 - Crear archivo .env.production

En `frontend/`, crea `.env.production`:

```env
VITE_CLOUDFRONT_URL=https://d123456abc.cloudfront.net
VITE_POINTCLOUD_PATH=/pointclouds/cloud.laz
VITE_USE_CLOUDFRONT=true
```

Reemplaza `d123456abc.cloudfront.net` con tu domain name real.

### 4.2 - Crear archivo de configuración

Crea `frontend/src/config/cloudfront.ts`:

```typescript
/**
 * Configuración de CloudFront para nube de puntos
 */

export const cloudFrontConfig = {
  // URL base de CloudFront
  baseUrl: import.meta.env.VITE_CLOUDFRONT_URL || 'https://d123456abc.cloudfront.net',
  
  // Rutas de archivos
  paths: {
    cloud: import.meta.env.VITE_POINTCLOUD_PATH || '/pointclouds/cloud.laz',
    backup: [
      '/pointclouds/cloud.laz',
      '/pointclouds/cloud.las',
      '/pointclouds/sensores.laz',
    ],
  },

  // Habilitar CloudFront
  enabled: import.meta.env.VITE_USE_CLOUDFRONT === 'true',

  // Configuración de caché
  cache: {
    maxAge: 86400 * 30, // 30 días en segundos
    headers: {
      'Cache-Control': 'public, max-age=2592000',
    },
  },

  // Reintentos
  retries: 3,
  retryDelay: 1000, // ms
}

/**
 * Construye URL completa para CloudFront
 */
export const getCloudFrontUrl = (path: string): string => {
  if (!cloudFrontConfig.enabled) {
    return path // Usar local
  }
  return `${cloudFrontConfig.baseUrl}${path}`
}

/**
 * Obtiene lista de URLs para intentar cargar
 */
export const getPointCloudUrls = (): string[] => {
  if (cloudFrontConfig.enabled) {
    return [getCloudFrontUrl(cloudFrontConfig.paths.cloud)]
  }
  
  // Fallback a rutas locales
  return cloudFrontConfig.paths.backup.map(path => path)
}

/**
 * Verifica si CloudFront está disponible
 */
export const checkCloudFrontHealth = async (): Promise<boolean> => {
  if (!cloudFrontConfig.enabled) return true

  try {
    const response = await fetch(getCloudFrontUrl('/'), {
      method: 'HEAD',
      mode: 'no-cors',
    })
    return response.status < 400 || response.status === 403 // 403 es OK con CORS
  } catch (err) {
    console.warn('CloudFront no disponible:', err)
    return false
  }
}
```

### 4.3 - Actualizar PotreeViewer

Edita `frontend/src/components/PotreeViewer.tsx` y reemplaza la función `loadPointCloud`:

```typescript
import { getPointCloudUrls, getCloudFrontUrl, checkCloudFrontHealth } from '../config/cloudfront'

// ... código anterior ...

const loadPointCloud = async (scene: any, Potree: any) => {
  try {
    setLoadingCloud(true)

    // Verificar salud de CloudFront
    const cfHealthy = await checkCloudFrontHealth()
    if (!cfHealthy) {
      console.warn('CloudFront no disponible, intentando local')
    }

    // Obtener URLs según configuración
    const cloudPaths = getPointCloudUrls()
    
    console.log('Intentando cargar desde:', cloudPaths)

    let cloudLoaded = false

    for (let attempt = 0; attempt < cloudPaths.length && !cloudLoaded; attempt++) {
      for (const path of cloudPaths) {
        try {
          console.log(`Intento ${attempt + 1}: ${path}`)

          // Verificar si existe con timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

          const response = await fetch(path, {
            method: 'HEAD',
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (response.ok || response.status === 403) {
            console.log(`Cargando nube desde: ${path}`)

            // Cargar con timeout
            const loader = new (window as any).Potree.POCLoader()
            const pointcloud = await new Promise((resolve, reject) => {
              const loadTimeout = setTimeout(
                () => reject(new Error('Timeout al cargar nube')),
                60000 // 60s para carga
              )

              loader.load(
                path,
                (cloud: any) => {
                  clearTimeout(loadTimeout)
                  resolve(cloud)
                },
                (progress: any) => {
                  const percent = (progress.loaded / progress.total) * 100
                  console.log(`Cargando: ${Math.round(percent)}%`)
                },
                (error: any) => {
                  clearTimeout(loadTimeout)
                  reject(error)
                }
              )
            })

            scene.addPointCloud(pointcloud)
            cloudLoaded = true
            setCloudLoaded(true)
            console.log('✅ Nube de puntos cargada exitosamente')
            break
          }
        } catch (err) {
          console.log(`❌ No se pudo cargar desde ${path}: ${err}`)
        }
      }

      // Si no cargó en este intento y hay más intentos
      if (!cloudLoaded && attempt < cloudPaths.length - 1) {
        console.log(`Reintentando en 2 segundos...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    if (!cloudLoaded) {
      console.warn('⚠️ No se encontró archivo de nube de puntos')
      setCloudLoaded(false)
    }
  } catch (err) {
    console.error('Error al cargar nube de puntos:', err)
    setError('Error al cargar nube de puntos')
  } finally {
    setLoadingCloud(false)
  }
}
```

---

## PASO 5: Crear script de deploy a S3

Crea `scripts/deploy-to-s3.js`:

```javascript
#!/usr/bin/env node
/**
 * Script para subir nube de puntos a S3
 * Uso: node deploy-to-s3.js [archivo.laz]
 */

const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
})

const BUCKET = process.env.AWS_S3_BUCKET || 'mi-nube-puntos'
const FILE_PATH = process.argv[2] || './cloud.laz'
const S3_KEY = `pointclouds/${path.basename(FILE_PATH)}`

async function uploadToS3() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`❌ Archivo no encontrado: ${FILE_PATH}`)
    process.exit(1)
  }

  const fileSize = fs.statSync(FILE_PATH).size
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2)

  console.log(`📤 Subiendo: ${FILE_PATH}`)
  console.log(`📊 Tamaño: ${fileSizeMB}MB`)
  console.log(`🎯 Destino S3: s3://${BUCKET}/${S3_KEY}`)

  const fileContent = fs.readFileSync(FILE_PATH)

  try {
    const params = {
      Bucket: BUCKET,
      Key: S3_KEY,
      Body: fileContent,
      ContentType: 'application/octet-stream',
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'file-size': fileSizeMB,
      },
    }

    // Monitorear progreso
    const upload = s3.upload(params)

    upload.on('httpUploadProgress', (progress) => {
      const percent = ((progress.loaded / progress.total) * 100).toFixed(2)
      process.stdout.write(`\r⏳ Subiendo: ${percent}%`)
    })

    const result = await upload.promise()

    console.log('\n✅ Archivo subido exitosamente')
    console.log(`📍 URL S3: ${result.Location}`)
    console.log(`🔗 URL CloudFront: https://d123456abc.cloudfront.net/${S3_KEY}`)

  } catch (err) {
    console.error('\n❌ Error al subir:', err)
    process.exit(1)
  }
}

uploadToS3()
```

Usa desde terminal:
```bash
# Instalar dependencia
npm install aws-sdk

# Subir archivo
export AWS_ACCESS_KEY_ID=tu_key
export AWS_SECRET_ACCESS_KEY=tu_secret
export AWS_S3_BUCKET=mi-nube-puntos
node scripts/deploy-to-s3.js tu_archivo.laz
```

---

## PASO 6: Crear script de invalidación CloudFront

Crea `scripts/invalidate-cloudfront.js`:

```javascript
#!/usr/bin/env node
/**
 * Invalida caché de CloudFront para forzar actualización
 */

const AWS = require('aws-sdk')

const cloudfront = new AWS.CloudFront({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-1',
})

const DISTRIBUTION_ID = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID
const PATHS = ['/pointclouds/*']

async function invalidateCache() {
  if (!DISTRIBUTION_ID) {
    console.error('❌ AWS_CLOUDFRONT_DISTRIBUTION_ID no configurada')
    process.exit(1)
  }

  console.log(`🔄 Invalidando caché de CloudFront...`)
  console.log(`📍 Distribution: ${DISTRIBUTION_ID}`)
  console.log(`🎯 Rutas: ${PATHS.join(', ')}`)

  try {
    const params = {
      DistributionId: DISTRIBUTION_ID,
      InvalidationBatch: {
        Paths: {
          Quantity: PATHS.length,
          Items: PATHS,
        },
        CallerReference: Date.now().toString(),
      },
    }

    const result = await cloudfront.createInvalidation(params).promise()

    console.log(`✅ Invalidación creada: ${result.Invalidation.Id}`)
    console.log(`⏳ Estado: ${result.Invalidation.Status}`)

  } catch (err) {
    console.error('❌ Error:', err)
    process.exit(1)
  }
}

invalidateCache()
```

---

## PASO 7: Crear GitHub Actions para CI/CD

Crea `.github/workflows/deploy-pointcloud.yml`:

```yaml
name: Deploy Point Cloud to S3

on:
  push:
    branches: [main]
    paths:
      - 'pointclouds/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Upload to S3
        run: |
          aws s3 sync pointclouds/ s3://mi-nube-puntos/pointclouds/ \
            --delete \
            --cache-control "max-age=2592000"

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.AWS_CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

      - name: Notify
        run: echo "✅ Nube de puntos actualizada en CloudFront"
```

---

## PASO 8: Variables de entorno

Crea o actualiza `.env.local`:

```env
# Desarrollo (local)
VITE_USE_CLOUDFRONT=false
VITE_CLOUDFRONT_URL=http://localhost:5173

# Producción
VITE_USE_CLOUDFRONT=true
VITE_CLOUDFRONT_URL=https://d123456abc.cloudfront.net
VITE_POINTCLOUD_PATH=/pointclouds/cloud.laz
```

Crea `.env.production`:

```env
VITE_USE_CLOUDFRONT=true
VITE_CLOUDFRONT_URL=https://d123456abc.cloudfront.net
VITE_POINTCLOUD_PATH=/pointclouds/cloud.laz
```

---

## PASO 9: Permisos IAM (Seguridad)

### 9.1 - Crear usuario IAM dedicado

En AWS Console > IAM > Users > Create user:
- Nombre: `pointcloud-uploader`

### 9.2 - Asignar política

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::mi-nube-puntos/pointclouds/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::123456789:distribution/E12345EXAMPLE"
    }
  ]
}
```

### 9.3 - Crear Access Key

1. Ve a Security credentials
2. Click "Create access key"
3. Copia el ID y la secret key
4. Guárdalas en secreto

---

## PASO 10: Build y Deploy

```bash
# Instalar dependencias
npm install

# Build para producción
npm run build

# Subir nube de puntos a S3
export AWS_ACCESS_KEY_ID=tu_access_key
export AWS_SECRET_ACCESS_KEY=tu_secret_key
export AWS_S3_BUCKET=mi-nube-puntos
node scripts/deploy-to-s3.js tu_archivo.laz

# Invalidar caché CloudFront
export AWS_CLOUDFRONT_DISTRIBUTION_ID=E12345EXAMPLE
node scripts/invalidate-cloudfront.js

# Deploy frontend (Vercel, Netlify, etc.)
npm run deploy
```

---

## 📋 Checklist de configuración

- [ ] Crear bucket S3
- [ ] Subir archivo LAZ a S3
- [ ] Configurar permisos de S3
- [ ] Crear distribución CloudFront
- [ ] Copiar Domain Name de CloudFront
- [ ] Crear `.env.production` con URL
- [ ] Crear archivo `frontend/src/config/cloudfront.ts`
- [ ] Actualizar `PotreeViewer.tsx`
- [ ] Crear scripts de deploy
- [ ] Crear usuario IAM con permisos limitados
- [ ] Guardar credenciales en GitHub Secrets
- [ ] Crear GitHub Actions workflow
- [ ] Testear carga de CloudFront en localhost
- [ ] Testear carga en producción

---

## 🔗 Rutas y URLs

```
Local:
- S3 Bucket: No aplicable
- CloudFront: Deshabilitado
- URL: http://localhost:5173/pointclouds/cloud.laz

Producción:
- S3 Bucket: s3://mi-nube-puntos/pointclouds/cloud.laz
- CloudFront: https://d123456abc.cloudfront.net/pointclouds/cloud.laz
- Fallback: https://d123456abc.cloudfront.net/pointclouds/cloud.las
```

---

## 📊 Ventajas S3 + CloudFront

| Característica | Local | S3+CloudFront |
|---|---|---|
| Velocidad | Media | ⚡ Muy rápida (CDN) |
| Escalabilidad | Limitada | ∞ Ilimitada |
| Ancho de banda | Limitado | Abundante |
| Costo | Gratis | ~$0.085/GB |
| Disponibilidad | 99% | 99.99% |
| Caché global | No | ✅ Sí |

---

## 🆘 Troubleshooting

**Error: "Access Denied"**
- Verifica permisos de bucket policy
- Verifica CORS headers

**Error: "CloudFront timeout"**
- Aumenta timeout en PotreeViewer.tsx
- Verifica tamaño de archivo

**Error: "403 Forbidden"**
- Verifica Origin Access Identity (OAI)
- Verifica CORS en CloudFront

---

## 🚀 Siguiente paso

Después de configurar todo esto, tu aplicación:
- ✅ Cargará la nube desde CloudFront (CDN global)
- ✅ Fallback automático a local si CloudFront falla
- ✅ Caché optimizado (30 días)
- ✅ Escalable a miles de usuarios
- ✅ Bajo costo (~$0.10/mes con bajo uso)
