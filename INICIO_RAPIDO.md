# 🎯 Guía de Inicio en 5 Minutos

Instrucciones rápidas y sencillas para poner todo funcionando.

---

## Paso 1️⃣: Clonar y descargar dependencias

```bash
git clone <tu-repo>
cd Reto_comu_pagina_nueva

# Instalar todos los paquetes
npm run install:all
```

**Tiempo esperado**: 3-5 minutos

---

## Paso 2️⃣: Configurar archivos .env

### Para el Frontend

Crea `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_USE_CLOUDFRONT=false
```

### Para el Backend

Copia tu archivo `backend/.env` (ya debería estar creado con tus credenciales AWS)

```env
AWS_ACCESS_KEY_ID=tu_clave
AWS_SECRET_ACCESS_KEY=tu_secret
AWS_REGION=us-east-1
DYNAMODB_TABLE=sensor-data
PORT=3000
```

---

## Paso 3️⃣: Ejecutar en desarrollo

**Abre 2 terminales:**

### Terminal 1 - Backend
```bash
npm run dev:backend
```

Verás:
```
✅ Backend running on http://localhost:3000
✅ WebSocket ready on ws://localhost:3000
```

### Terminal 2 - Frontend
```bash
npm run dev:frontend
```

Verás:
```
✅ Frontend running on http://localhost:5173
```

---

## Paso 4️⃣: Acceder a la aplicación

Abre tu navegador en:

👉 **http://localhost:5173**

---

## Paso 5️⃣: Probar CloudFront (Opcional pero recomendado)

### Subir tu nube de puntos a AWS S3

```bash
# Configura variables (PowerShell o bash)
$env:AWS_ACCESS_KEY_ID = "tu_access_key"
$env:AWS_SECRET_ACCESS_KEY = "tu_secret_key"
$env:AWS_S3_BUCKET = "mi-nube-puntos"

# Sube tu archivo
npm run deploy:s3:file -- "C:\ruta\a\tu_archivo.laz"
```

### Crear distribución CloudFront

1. Ve a https://console.aws.amazon.com/cloudfront/
2. Click "Create distribution"
3. Origin Domain: `mi-nube-puntos.s3.us-east-1.amazonaws.com`
4. Viewer Protocol Policy: `Redirect HTTP to HTTPS`
5. Click "Create"

Copia el **Domain Name** (ej: `d123abc456.cloudfront.net`)

### Actualizar .env.production

```env
VITE_CLOUDFRONT_URL=https://d123abc456.cloudfront.net
VITE_USE_CLOUDFRONT=true
```

### Testear

```bash
# Build
npm run build:frontend

# Preview
npm run preview

# Acceder a http://localhost:4173
# La nube de puntos cargará desde CloudFront 🎉
```

---

## ❌ Problemas comunes

### "Error: Cannot find module"
```bash
npm run install:all
```

### "WebSocket connection refused"
- Verifica que el backend está corriendo
- Puerto 3000 debe estar libre
- `npm run dev:backend` en la primera terminal

### "Nube de puntos no carga"
- Verifica que el archivo existe: `aws s3 ls s3://mi-nube-puntos/`
- Si usas CloudFront, invalida caché: `npm run invalidate:cf`
- Abre DevTools (F12) y revisa la pestaña Network

### "Credenciales AWS no configuradas"
Asegúrate de tener estas variables en `backend/.env`:
```env
AWS_ACCESS_KEY_ID=tu_clave
AWS_SECRET_ACCESS_KEY=tu_secret
```

---

## 📚 Documentación Completa

Una vez que tengas todo funcionando, lee:

- **AWS_S3_CLOUDFRONT_COMPLETE.md**: Guía detallada de AWS
- **DYNAMODB_SCHEMA.md**: Estructura de la base de datos
- **POTREE_SETUP.md**: Configuración de visualización 3D
- **README_MAIN.md**: Descripción general del proyecto
- **QUICK_REFERENCE.md**: Comandos rápidos

---

## 🚀 Deploy a Producción

Cuando estés listo para deploy:

```bash
# 1. Build
npm run build

# 2. Subir a S3
npm run deploy:s3:file -- "archivo.laz"

# 3. Invalidar CloudFront
npm run invalidate:cf

# O todo junto:
npm run deploy:full
```

---

## 🎉 ¡Listo!

Tu aplicación ahora:
- ✅ Visualiza sensores en tiempo real
- ✅ Muestra nube de puntos 3D
- ✅ Carga históricos desde DynamoDB
- ✅ Distribuye contenido vía CloudFront CDN

---

## ❓ Preguntas

Si algo no funciona:

1. Revisa los logs en la terminal
2. Abre DevTools (F12) en el navegador
3. Lee la documentación en archivos `.md`
4. Verifica que los archivos `.env` están correctos

---

**¡Bienvenido! 🚀**

