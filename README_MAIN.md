# 🌐 Monitoreo IoT con Visualización 3D

Aplicación completa de monitoreo de sensores con nube de puntos 3D, gráficos de historial en tiempo real y arquitectura serverless en AWS.

---

## ✨ Características

- 📊 **Dashboard en Tiempo Real**: Visualización de datos de sensores con WebSocket
- 🎯 **Nube de Puntos 3D**: Visualización interactiva con Potree (Lidar)
- 📈 **Gráficos Históricos**: Análisis temporal con Recharts
- ☁️ **AWS DynamoDB**: Base de datos NoSQL escalable
- 🌍 **CloudFront CDN**: Distribución global de archivos
- 🚀 **GitHub Actions CI/CD**: Deploy automático

---

## 🛠️ Stack Técnico

### Frontend
- **React 18** con TypeScript
- **Vite** (bundler ultra rápido)
- **Tailwind CSS** para estilos
- **Three.js** + **Potree** para visualización 3D
- **Recharts** para gráficos

### Backend
- **Express** con TypeScript
- **WebSocket** para datos en tiempo real
- **AWS SDK** para DynamoDB
- **Node.js 18+**

### Cloud
- **AWS S3**: Almacenamiento de nubes de puntos
- **AWS CloudFront**: CDN global
- **AWS DynamoDB**: Base de datos NoSQL
- **AWS IAM**: Seguridad y permisos

---

## 📋 Requisitos

- Node.js 18+
- npm o yarn
- Cuenta AWS (con IAM user para CI/CD)
- Archivo de nube de puntos (.laz o .las)

---

## 🚀 Inicio Rápido

### 1. Clonar y configurar

```bash
git clone <repositorio>
cd Reto_comu_pagina_nueva

# Instalar dependencias (frontend + backend)
npm run install:all
```

### 2. Crear archivos de entorno

Copia `.env.example` a `.env`:

```bash
# Desarrollo (local)
cp .env.example frontend/.env

# Producción (con CloudFront)
cp .env.example frontend/.env.production
```

**Edita `frontend/.env`:**
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
VITE_USE_CLOUDFRONT=false
```

**Edita `frontend/.env.production`:**
```env
VITE_CLOUDFRONT_URL=https://dXXXXXX.cloudfront.net
VITE_USE_CLOUDFRONT=true
```

**Edita `backend/.env`:**
```env
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
DYNAMODB_TABLE=sensor-data
PORT=3000
```

### 3. Ejecutar en desarrollo

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend (en otra terminal)
npm run dev:frontend

# Acceder a http://localhost:5173
```

### 4. Build para producción

```bash
npm run build
```

---

## 🌐 Configurar AWS S3 + CloudFront

Sigue la guía completa: **[AWS_S3_CLOUDFRONT_COMPLETE.md](./AWS_S3_CLOUDFRONT_COMPLETE.md)**

Pasos resumidos:

```bash
# 1. Crear bucket S3
aws s3 mb s3://mi-nube-puntos --region us-east-1

# 2. Subir nube de puntos
npm run deploy:s3:file -- "tu_archivo.laz"

# 3. Invalidar caché CloudFront
npm run invalidate:cf

# 4. Deploy completo (build + S3 + invalidate)
npm run deploy:full
```

---

## 📁 Estructura del Proyecto

```
.
├── frontend/                          # Aplicación React + Vite
│   ├── src/
│   │   ├── components/               # Componentes React
│   │   │   ├── Dashboard.tsx        # Página principal
│   │   │   ├── PotreeViewer.tsx     # Visualizador 3D
│   │   │   ├── HistoryChart.tsx     # Gráficos históricos
│   │   │   ├── RealTimeCards.tsx    # Cards de datos
│   │   │   └── SensorModal.tsx      # Modal de sensores
│   │   ├── config/
│   │   │   └── cloudfront.ts        # Config CloudFront/S3
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts      # Hook WebSocket
│   │   └── main.tsx
│   ├── .env                          # Vars locales
│   └── .env.production              # Vars producción
│
├── backend/                           # Express + TypeScript
│   ├── src/
│   │   ├── server.ts               # Servidor principal
│   │   ├── routes/
│   │   │   └── sensors.ts          # Rutas de sensores
│   │   ├── services/
│   │   │   └── dynamodb.ts         # Operaciones DynamoDB
│   │   ├── websocket/
│   │   │   └── wsServer.ts         # Servidor WebSocket
│   │   └── types/
│   │       └── index.ts            # Tipos TypeScript
│   ├── .env                         # Variables AWS
│   └── package.json
│
├── scripts/                           # Scripts de deploy
│   ├── deploy-to-s3.js             # Upload a S3
│   └── invalidate-cloudfront.js    # Invalidar caché
│
├── .github/
│   └── workflows/
│       └── deploy-pointcloud.yml   # GitHub Actions
│
├── nginx/
│   └── salon.conf                  # Configuración Nginx
│
├── AWS_S3_CLOUDFRONT_COMPLETE.md   # Guía AWS detallada
├── DYNAMODB_SCHEMA.md              # Schema DynamoDB
├── POTREE_SETUP.md                 # Setup Potree
└── package.json                    # Scripts root
```

---

## 🔧 Scripts Disponibles

```bash
# Instalación
npm run install:all              # Instalar backend + frontend

# Desarrollo
npm run dev                       # Backend + Frontend (concurrent)
npm run dev:backend              # Solo backend
npm run dev:frontend             # Solo frontend

# Build
npm run build                     # Build backend + frontend
npm run build:backend            # Solo backend
npm run build:frontend           # Solo frontend

# Preview
npm run preview                  # Preview frontend build

# Deploy
npm run deploy:s3               # Subir a S3 (default file)
npm run deploy:s3:file -- "file.laz"  # Subir archivo específico
npm run invalidate:cf           # Invalidar caché CloudFront
npm run deploy:full             # Build + S3 + Invalidate
```

---

## 🗄️ Base de Datos (DynamoDB)

### Schema

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `sensorId` (PK) | String | ID único del sensor |
| `timestamp` (SK) | Number | Unix timestamp |
| `temperature` | Number | Temp. en °C |
| `humidity` | Number | Humedad en % |
| `receivedAt` | String | Hora ISO |
| `location` | Object | Coordenadas x, y, z |

### Ejemplo de dato

```json
{
  "sensorId": "sensor-001",
  "timestamp": 1700000000,
  "temperature": 22.5,
  "humidity": 45,
  "receivedAt": "2024-01-20T14:30:00Z",
  "location": {
    "x": 10.5,
    "y": 20.3,
    "z": 5.2
  }
}
```

---

## 🌍 CloudFront URLs

### Desarrollo (Local)
```
Frontend: http://localhost:5173
Backend:  http://localhost:3000
WebSocket: ws://localhost:3000
```

### Producción (AWS)
```
Frontend:  https://d1234567890abc.cloudfront.net/
S3 Nube:   https://d1234567890abc.cloudfront.net/pointclouds/cloud.laz
DynamoDB:  (sin URL pública, acceso vía API)
```

---

## 🚨 Troubleshooting

### Error: "EACCES: permission denied"
```bash
# Dar permisos de ejecución
chmod +x scripts/deploy-to-s3.js
chmod +x scripts/invalidate-cloudfront.js
```

### Error: "Cannot find module 'aws-sdk'"
```bash
npm install aws-sdk --prefix backend
```

### Error: "WebSocket connection refused"
- Verifica que backend está corriendo: `npm run dev:backend`
- Verifica puerto 3000 está libre

### Error: "nube de puntos no carga"
- Verifica archivo en S3: `aws s3 ls s3://mi-nube-puntos/pointclouds/`
- Verifica CloudFront está healthy
- Revisa DevTools → Network → Console

---

## 📚 Documentación Adicional

| Documento | Descripción |
|-----------|-------------|
| [AWS_S3_CLOUDFRONT_COMPLETE.md](./AWS_S3_CLOUDFRONT_COMPLETE.md) | Guía completa AWS S3 + CloudFront |
| [DYNAMODB_SCHEMA.md](./DYNAMODB_SCHEMA.md) | Schema y queries DynamoDB |
| [POTREE_SETUP.md](./POTREE_SETUP.md) | Setup Potree 3D viewer |

---

## 🔐 Seguridad

### Variables secretas

- ✅ Usar `.env.local` para desarrollo (gitignored)
- ✅ Usar GitHub Secrets para CI/CD (no públicos)
- ✅ Usar IAM user limitado (no root account)
- ✅ Rotar credenciales regularmente

### AWS IAM

Política mínima recomendada:

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject",
    "cloudfront:CreateInvalidation"
  ],
  "Resource": [
    "arn:aws:s3:::mi-nube-puntos/pointclouds/*",
    "arn:aws:cloudfront::123456789:distribution/E1234567890"
  ]
}
```

---

## 💰 Costos Estimados (Monthly)

| Servicio | Volumen | Costo |
|----------|---------|-------|
| S3 Storage | 1GB | $0.023 |
| CloudFront | 1GB transfer | $0.085 |
| DynamoDB | 1GB storage | $0.25 |
| **Total** | | **~$0.36** |

*Costos pueden variar según uso real*

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea rama: `git checkout -b feature/nueva-feature`
3. Commit: `git commit -m 'Add nueva-feature'`
4. Push: `git push origin feature/nueva-feature`
5. Pull Request

---

## 📄 Licencia

MIT - Ver LICENSE

---

## 📞 Soporte

Para preguntas o problemas:

1. Revisa la documentación: [AWS_S3_CLOUDFRONT_COMPLETE.md](./AWS_S3_CLOUDFRONT_COMPLETE.md)
2. Verifica logs: `npm run dev` → F12 DevTools
3. GitHub Issues para bugs

---

## 🎯 Roadmap

- [ ] Autenticación con Cognito
- [ ] Mapas interactivos
- [ ] Alertas en tiempo real
- [ ] Export de datos
- [ ] Mobile app
- [ ] Análisis predictivo con ML

---

**¡Gracias por usar este proyecto! ⭐**

