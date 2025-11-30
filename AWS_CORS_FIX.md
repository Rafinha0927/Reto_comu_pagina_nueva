# Solución CORS para CloudFront y S3

## Problema
CloudFront está bloqueando las peticiones CORS para las librerías JavaScript desde S3.

## Solución 1: Configurar CORS en S3 (RECOMENDADO)

### Paso 1: Ir a AWS S3 Console
1. Abre: https://console.aws.amazon.com/s3/
2. Selecciona el bucket: `reto-comu-pointcloud`
3. Ve a la pestaña "Permissions"
4. Busca "CORS" y haz clic en "Edit"

### Paso 2: Agregar configuración CORS
Reemplaza con esto:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": [
            "Content-Range",
            "Content-Type",
            "Date",
            "ETag",
            "x-amz-meta-*"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

5. Haz clic en "Save"

## Solución 2: Configurar CloudFront para pasar headers CORS

### Paso 1: Ir a CloudFront Console
1. Abre: https://console.aws.amazon.com/cloudfront/
2. Selecciona tu distribución: `d2h8nqd60uagyp`
3. Haz clic en "Distribution Settings"

### Paso 2: Editar comportamiento
1. Ve a la pestaña "Behaviors"
2. Selecciona el comportamiento predeterminado (la ruta raíz `/`)
3. Haz clic en "Edit"

### Paso 3: Configurar headers de respuesta
1. Busca "Response headers policy"
2. Haz clic en "Create response headers policy" o selecciona una existente
3. Agrega estos headers de respuesta:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: *
Access-Control-Max-Age: 3000
```

4. Haz clic en "Save"

## Solución 3: Proxy Local (Alternativa rápida)

Si no puedes modificar AWS, usa un proxy local para servir las librerías:

```bash
# En terminal, en la carpeta del proyecto
npm install http-proxy-middleware express cors
```

Crea `proxy-server.js`:

```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

app.use(cors());

app.use('/s3-proxy', createProxyMiddleware({
  target: 'https://d2h8nqd60uagyp.cloudfront.net',
  changeOrigin: true,
  onProxyRes: (proxyRes) => {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS';
  }
}));

app.listen(3001, () => console.log('Proxy en http://localhost:3001'));
```

Luego ejecuta:
```bash
node proxy-server.js
```

Y actualiza las URLs en PotreeViewer.tsx de:
- `https://d2h8nqd60uagyp.cloudfront.net/...` 
a:
- `http://localhost:3001/s3-proxy/...`

## Verificación

Después de aplicar la solución, recarga la página y verifica en DevTools:
- Consola: Los scripts deberían cargar sin errores CORS
- Network: Los archivos JavaScript deberían tener status 200

Si ves "Access-Control-Allow-Origin" en los headers de respuesta, ¡está funcionando!
