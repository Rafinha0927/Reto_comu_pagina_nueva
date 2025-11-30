# ✅ Checklist de Deploy

Sigue esta checklist paso a paso para asegurar que todo esté listo antes de deploy.

---

## 📋 Pre-Deploy

### 1. Código
- [ ] No hay errores TypeScript: `npm run build` sin errores
- [ ] Todos los archivos `.env` están creados
- [ ] No hay archivos temporales o de debug
- [ ] Git está limpio: `git status` sin cambios no tracked

### 2. Dependencias
- [ ] Todas las dependencias instaladas: `npm run install:all` completó sin errores
- [ ] No hay vulnerabilidades críticas: `npm audit`
- [ ] Node.js versión correcta (18+): `node --version`

### 3. Backend
- [ ] Backend builds sin errores: `npm run build:backend`
- [ ] Variables AWS configuradas en `backend/.env`
- [ ] DynamoDB tabla existe en AWS
- [ ] IAM user tiene permisos para DynamoDB

### 4. Frontend
- [ ] Frontend builds sin errores: `npm run build:frontend`
- [ ] `.env.production` tiene VITE_CLOUDFRONT_URL correcto
- [ ] Componentes 3D (PotreeViewer) son accesibles
- [ ] No hay warnings en console

### 5. AWS
- [ ] S3 bucket creado y configurado
- [ ] Archivo de nube de puntos subido a S3
- [ ] CloudFront distribution creado
- [ ] Domain Name de CloudFront copiado
- [ ] IAM user creado con permisos limitados

### 6. GitHub
- [ ] Credenciales AWS en GitHub Secrets
- [ ] GitHub Actions workflow configurado
- [ ] Workflow puede ejecutarse sin errores

---

## 🧪 Testing Local

### Backend
```bash
# [ ] Backend inicia sin errores
npm run dev:backend

# [ ] API responde
curl http://localhost:3000/api/sensors

# [ ] WebSocket conecta
# En browser console:
# let ws = new WebSocket('ws://localhost:3000'); console.log(ws.readyState)
```

### Frontend
```bash
# [ ] Frontend inicia sin errores
npm run dev:frontend

# [ ] Página carga en http://localhost:5173
# [ ] Sin errores en DevTools (F12)
# [ ] Gráficos y tablas se renderizan
# [ ] Datos en tiempo real llegan
```

### Integración
- [ ] Frontend conecta con backend: Revisa Network en DevTools
- [ ] WebSocket conecta: `ws://localhost:3000` en DevTools
- [ ] Datos de sensores se muestran en tiempo real

---

## 🌍 Testing con CloudFront

```bash
# [ ] Build frontend
npm run build:frontend

# [ ] Preview muestra todo correctamente
npm run preview
# Acceder a http://localhost:4173

# [ ] Nube de puntos carga desde CloudFront
# En DevTools > Network, buscar archivos .laz
# Debe mostrar respuesta 200 OK y header X-Cache

# [ ] Sin errores CORS en console
```

---

## 📦 Deploy S3

```bash
# [ ] Variables AWS configuradas
$env:AWS_ACCESS_KEY_ID = "tu_key"
$env:AWS_SECRET_ACCESS_KEY = "tu_secret"
$env:AWS_S3_BUCKET = "mi-nube-puntos"

# [ ] Archivo de nube existe
ls "C:\ruta\a\cloud.laz"

# [ ] Script de upload funciona
npm run deploy:s3:file -- "cloud.laz"

# [ ] Archivo aparece en S3
aws s3 ls s3://mi-nube-puntos/pointclouds/
```

---

## 🔄 Invalidar CloudFront

```bash
# [ ] Distribución ID es correcto
$env:AWS_CLOUDFRONT_DISTRIBUTION_ID = "E1234567890ABC"

# [ ] Script de invalidación funciona
npm run invalidate:cf

# [ ] Caché está siendo invalidado
aws cloudfront list-invalidations --distribution-id E1234567890ABC
```

---

## 🚀 Deploy Completo

```bash
# [ ] Todo lo anterior funcionó
npm run deploy:full

# Esto ejecuta:
# 1. npm run build
# 2. npm run deploy:s3
# 3. npm run invalidate:cf
```

---

## ✨ Post-Deploy

### Verificación
- [ ] Aplicación accesible desde CloudFront: `https://d123abc.cloudfront.net`
- [ ] Nube de puntos carga: Abre DevTools > Network
- [ ] Datos en tiempo real fluyen
- [ ] No hay errores en console
- [ ] Performance es bueno (< 3 segundos carga)

### Monitoreo
- [ ] CloudFront metrics en AWS Console se ven
- [ ] Requests se muestran en CloudFront logs
- [ ] Caché hit rate > 80%
- [ ] Errores 4xx o 5xx son mínimos

### Seguridad
- [ ] HTTPS configurado (no HTTP)
- [ ] CORS headers correctos
- [ ] Credenciales no expuestas en código
- [ ] GitHub Secrets están privatizados

---

## 🐛 Rollback (Si algo falla)

```bash
# [ ] Versión anterior de nube está en S3 o local
# [ ] Git history está completo: git log

# Revertir cambios
git revert HEAD

# Reupload versión anterior
npm run deploy:s3:file -- "cloud_anterior.laz"

# Invalidar de nuevo
npm run invalidate:cf
```

---

## 📊 Performance Checklist

- [ ] Tamaño frontend build: < 1MB (sin nube)
- [ ] Tamaño backend: < 10MB
- [ ] CloudFront latency: < 200ms
- [ ] Database queries: < 100ms
- [ ] WebSocket lag: < 500ms

---

## 🔐 Security Checklist

- [ ] No hay API keys en código
- [ ] No hay secretos en GitHub (excepto Secrets)
- [ ] IAM user tiene permisos mínimos
- [ ] S3 bucket tiene acceso público solo a `/pointclouds`
- [ ] DynamoDB tiene encryption habilitado
- [ ] CloudFront tiene HTTPS forzado

---

## 📝 Documentación

- [ ] README actualizado con instrucciones
- [ ] `.env.example` existe y es correcto
- [ ] AWS_S3_CLOUDFRONT_COMPLETE.md está actualizado
- [ ] DYNAMODB_SCHEMA.md documenta estructura
- [ ] Código tiene comentarios en español

---

## 🎯 Entrega Final

- [ ] Todo funciona en desarrollo
- [ ] Todo funciona en producción
- [ ] Tests pasan sin errores
- [ ] Documentation está completa
- [ ] Git commits están limpios
- [ ] Repository tiene descripción

---

## 📞 Validación Final

Antes de dar por finalizado:

1. **Test URL pública**
   ```bash
   curl.exe -I https://d123abc.cloudfront.net/
   # Debe devolver 200 OK
   ```

2. **Test desde navegador**
   - [ ] Página carga sin errores
   - [ ] DevTools no muestra errores
   - [ ] Datos se cargan en tiempo real
   - [ ] Nube de puntos se visualiza

3. **Test desde móvil (opcional)**
   - [ ] Interfaz responsive funciona
   - [ ] Touch events funcionan
   - [ ] Performance aceptable en 4G

4. **Notificar**
   - [ ] Stakeholders informados del deploy
   - [ ] URL publica compartida
   - [ ] Instrucciones de acceso dadas

---

## 🎉 Checklist Completo

Si todas las casillas están marcadas ✅:

```
┌─────────────────────────────────────────┐
│   🚀 LISTO PARA PRODUCCIÓN 🚀           │
│                                         │
│   Aplicación deployment completado      │
│   CloudFront CDN configurado            │
│   DynamoDB base de datos sincronizada   │
│   GitHub Actions en funcionamiento      │
│                                         │
│   ✨ ¡Felicidades! ✨                   │
└─────────────────────────────────────────┘
```

---

## 📋 Notas Adicionales

```
Fecha de Deploy: _______________
Versión: _______________
Responsable: _______________
Problemas encontrados: _______________
Soluciones aplicadas: _______________
Performance observado: _______________
Siguiente revisión: _______________
```

---

**Mantén este checklist para cada deploy futuro** 📌

