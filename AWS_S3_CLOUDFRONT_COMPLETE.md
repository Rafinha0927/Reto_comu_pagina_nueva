# 🚀 AWS S3 + CloudFront: Guía Completa

Configuración paso a paso para subir tu nube de puntos a AWS y distribuirla globalmente con CloudFront CDN.

---

## 📋 Índice

1. [Requisitos](#requisitos)
2. [Paso 1: Configurar AWS CLI](#paso-1-configurar-aws-cli)
3. [Paso 2: Crear S3 Bucket](#paso-2-crear-s3-bucket)
4. [Paso 3: Subir archivo a S3](#paso-3-subir-archivo-a-s3)
5. [Paso 4: Crear CloudFront Distribution](#paso-4-crear-cloudfront-distribution)
6. [Paso 5: Crear IAM User](#paso-5-crear-iam-user)
7. [Paso 6: Configurar GitHub Secrets](#paso-6-configurar-github-secrets)
8. [Paso 7: Variables de entorno](#paso-7-variables-de-entorno)
9. [Paso 8: Usar los scripts npm](#paso-8-usar-los-scripts-npm)
10. [Paso 9: Pruebas](#paso-9-pruebas)

---

## Requisitos

- ✅ Cuenta AWS activa con tarjeta de crédito
- ✅ AWS CLI instalado (`pip install awscli` o `choco install awscli`)
- ✅ Node.js con npm instalado
- ✅ Credenciales AWS (Access Key ID + Secret Access Key)
- ✅ Archivo de nube de puntos (.laz o .las)

---

## Paso 1: Configurar AWS CLI

### Opción A: Variables de Entorno (Recomendado)

```powershell
# Windows PowerShell
$env:AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
$env:AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
$env:AWS_REGION = "us-east-1"

# Verificar
aws sts get-caller-identity
# Debe mostrar tu usuario AWS
```

### Opción B: Archivo de Configuración

```bash
# Crear ~/.aws/credentials (en home directory)
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[default]
region = us-east-1
output = json
```

---

## Paso 2: Crear S3 Bucket

### Opción A: AWS Console (Visual)

1. Abre https://s3.console.aws.amazon.com/
2. Click **"Create bucket"**
3. **Bucket name**: `mi-nube-puntos` (debe ser único globalmente)
4. **AWS Region**: `us-east-1`
5. **Block all public access**: ⭕ Deja sin marcar
6. Click **"Create bucket"**

### Opción B: AWS CLI

```powershell
# Crear bucket
aws s3 mb s3://mi-nube-puntos --region us-east-1

# Listar buckets
aws s3 ls

# Confirmar creación
# tu-nube-puntos
```

### Configurar Política Pública

1. En AWS Console → S3 → tu bucket
2. Click en **"Permissions"**
3. Scroll a **"Bucket policy"** → Click **"Edit"**
4. Pega esta política:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mi-nube-puntos/*"
    }
  ]
}
```

5. Click **"Save changes"**

---

## Paso 3: Subir archivo a S3

### Usando el script npm incluido

```powershell
# Configurar variables de entorno primero
$env:AWS_ACCESS_KEY_ID = "tu_access_key"
$env:AWS_SECRET_ACCESS_KEY = "tu_secret_key"
$env:AWS_S3_BUCKET = "mi-nube-puntos"

# Subir archivo
npm run deploy:s3 "C:\ruta\a\cloud.laz"

# O especificar en línea
node scripts/deploy-to-s3.js "cloud.laz"
```

### Con AWS CLI

```powershell
# Subir un archivo
aws s3 cp cloud.laz s3://mi-nube-puntos/pointclouds/cloud.laz

# Subir todo un directorio
aws s3 sync ./pointclouds s3://mi-nube-puntos/pointclouds/

# Verificar
aws s3 ls s3://mi-nube-puntos/pointclouds/
```

### Verificación

```powershell
# Probar acceso público
curl.exe -I https://mi-nube-puntos.s3.us-east-1.amazonaws.com/pointclouds/cloud.laz
# Debe devolver: HTTP/1.1 200 OK
```

---

## Paso 4: Crear CloudFront Distribution

### En AWS Console

1. Ve a https://console.aws.amazon.com/cloudfront/
2. Click **"Create distribution"**
3. **Origin settings**:
   - Origin Domain: `mi-nube-puntos.s3.us-east-1.amazonaws.com`
   - Protocol: `HTTPS only`
   - Origin Access: `Legacy access identities` (simplicidad)

4. **Default cache behavior**:
   - Viewer Protocol Policy: `Redirect HTTP to HTTPS`
   - Allowed HTTP Methods: `GET, HEAD, OPTIONS`
   - Cache Policy: `Managed-CachingOptimized`

5. **Settings**:
   - Default Root Object: (dejar vacío)
   - Compress objects automatically: ✅

6. Click **"Create distribution"**

### Copiar Domain Name

En CloudFront Console → Distributions → Tu distribución:
- **Domain Name**: `d1234567890abc.cloudfront.net` ← **Copia esto**

Prueba:
```powershell
curl.exe -I https://d1234567890abc.cloudfront.net/pointclouds/cloud.laz
# Debe devolver: HTTP/1.1 200 OK o 403 (válido con CORS)
```

---

## Paso 5: Crear IAM User

### Crear usuario

1. Ve a https://console.aws.amazon.com/iam/
2. **Users** → **Create user**
3. **User name**: `github-actions-user`
4. Click **Next**

### Agregar permisos

1. **Attach policies directly** → Click en **"Create policy"**
2. Tab **JSON** y pega:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::mi-nube-puntos",
        "arn:aws:s3:::mi-nube-puntos/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "arn:aws:cloudfront::123456789012:distribution/E1234567890ABC"
    }
  ]
}
```

3. Click **Next** → **Create policy**
4. Vuelve al usuario, busca la política y asígnala

### Generar credenciales

1. Click en el usuario
2. **Security credentials** → **Create access key**
3. Selecciona **"Command Line Interface (CLI)"**
4. Copia:
   - Access Key ID
   - Secret Access Key

---

## Paso 6: Configurar GitHub Secrets

### En GitHub

1. Abre tu repositorio en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** para cada variable:

```
AWS_ACCESS_KEY_ID = (del IAM user)
AWS_SECRET_ACCESS_KEY = (del IAM user)
AWS_S3_BUCKET = mi-nube-puntos
AWS_CLOUDFRONT_DISTRIBUTION_ID = E1234567890ABC
AWS_REGION = us-east-1
```

---

## Paso 7: Variables de Entorno

### Crear `.env.production` en raíz

```env
VITE_CLOUDFRONT_URL=https://d1234567890abc.cloudfront.net
VITE_USE_CLOUDFRONT=true
VITE_POINTCLOUD_PATH=/pointclouds
VITE_POINTCLOUD_FILENAME=cloud.laz
```

### Crear `.env` para desarrollo

```env
VITE_USE_CLOUDFRONT=false
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## Paso 8: Usar los Scripts npm

### Verificar scripts disponibles

```powershell
npm run
# Debe mostrar:
# deploy:s3
# deploy:s3:file
# invalidate:cf
# deploy:full
```

### Subir nube de puntos

```powershell
# Opción 1: Ubicación default
npm run deploy:s3

# Opción 2: Especificar archivo
npm run deploy:s3:file -- "C:\Users\usuario\Desktop\cloud.laz"

# Opción 3: Script directo
node scripts/deploy-to-s3.js "cloud.laz"
```

### Invalidar caché CloudFront

```powershell
# Forzar refresco de caché
npm run invalidate:cf

# Esto es útil después de actualizar archivos en S3
```

### Deploy completo

```powershell
# Build + Upload S3 + Invalidate CloudFront
npm run deploy:full
```

---

## Paso 9: Pruebas

### Test Local (Desarrollo)

```powershell
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend

# Debe cargar desde localhost
# VITE_USE_CLOUDFRONT=false en .env
```

### Test CloudFront (Producción)

```powershell
# Build
npm run build:frontend

# Preview
npm run preview

# Acceder a http://localhost:4173
# VITE_USE_CLOUDFRONT=true en .env.production
```

### Verificar URLs

```powershell
# Test S3 directo
curl.exe -I https://mi-nube-puntos.s3.us-east-1.amazonaws.com/pointclouds/cloud.laz

# Test CloudFront
curl.exe -I https://d1234567890abc.cloudfront.net/pointclouds/cloud.laz

# Test con servidor local
curl.exe -I http://localhost:5173/pointclouds/cloud.laz

# Todos deben devolver 200 OK
```

### Monitorear progreso

```powershell
# Ver progreso de invalidación
aws cloudfront list-invalidations --distribution-id E1234567890ABC

# Ver distribuciones
aws cloudfront list-distributions | Select-Object -ExpandProperty 'DistributionList.Items' | Format-Table DomainName, Id
```

---

## 🔧 Troubleshooting

### Error: "Access Denied"

```powershell
# Verificar credenciales
aws sts get-caller-identity

# Verificar política de bucket
aws s3api get-bucket-policy --bucket mi-nube-puntos

# Verificar permisos IAM
aws iam get-user-policy --user-name github-actions-user --policy-name S3CloudFrontPolicy
```

### Error: "InvalidArgument - Invalid CORS header"

- Es normal con CORS
- Verifica que el archivo existe en S3: `aws s3 ls s3://mi-nube-puntos/pointclouds/`

### CloudFront devuelve 403

- Es normal (CORS bloqueado)
- Verifica en DevTools: `X-Cache: Hit from cloudfront`

### Archivo no encontrado en CloudFront

```powershell
# Invalidar caché
npm run invalidate:cf

# O manual
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"

# Esperar 2-5 minutos para que se aplique
```

---

## 📊 Checklist Final

- [ ] AWS CLI instalado y configurado
- [ ] S3 bucket creado
- [ ] Archivo subido a S3
- [ ] Política pública configurada en S3
- [ ] CloudFront distribution creado
- [ ] IAM user creado
- [ ] GitHub Secrets configurados
- [ ] `.env.production` creado
- [ ] Scripts npm funcionan
- [ ] Prueba local exitosa (VITE_USE_CLOUDFRONT=false)
- [ ] Prueba CloudFront exitosa (VITE_USE_CLOUDFRONT=true)

---

## 🎯 URLs y Recursos

| Recurso | URL |
|---------|-----|
| AWS S3 Console | https://s3.console.aws.amazon.com/ |
| CloudFront Console | https://console.aws.amazon.com/cloudfront/ |
| IAM Console | https://console.aws.amazon.com/iam/ |
| GitHub Actions | Repositorio → Actions |
| AWS CLI Docs | https://awscli.amazonaws.com/ |

---

## 💰 Costos Estimados

| Servicio | Estimado |
|----------|----------|
| S3 Storage (1GB) | ~$0.023/mes |
| CloudFront (1GB/mes) | ~$0.085/GB = $0.085 |
| **Total** | ~**$0.11/mes** |

---

## 🚀 Próximos Pasos

1. ✅ Setup AWS (S3 + CloudFront)
2. ✅ Configurar GitHub Actions
3. ✅ Hacer push a `main` branch
4. ✅ GitHub Actions automáticamente:
   - Sube a S3
   - Invalida CloudFront
   - Actualiza caché global

5. ✅ Tu aplicación sirve desde CDN global
   - 🌍 Más rápido mundialmente
   - 📈 Escalable a millones de usuarios
   - 💪 Altamente disponible

---

**¿Preguntas?** Revisa los logs en:
- GitHub Actions: Repositorio → Actions
- AWS CloudWatch: Console AWS
- Browser DevTools: F12 → Console

