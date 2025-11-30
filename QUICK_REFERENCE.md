#!/usr/bin/env pwsh
# ============================================================================
# QUICK REFERENCE - Comandos Rápidos
# ============================================================================
# Guía rápida de los comandos más usados en el proyecto
# ============================================================================

# ───────────────────────────────────────────────────────────────────────────
# 🚀 INICIO RÁPIDO
# ───────────────────────────────────────────────────────────────────────────

# Instalar todo
npm run install:all

# Ejecutar en desarrollo (Backend + Frontend)
npm run dev

# Build para producción
npm run build

# Preview de build
npm run preview

# ───────────────────────────────────────────────────────────────────────────
# 🔌 DESARROLLO INDIVIDUAL
# ───────────────────────────────────────────────────────────────────────────

# Solo backend en Terminal 1
npm run dev:backend

# Solo frontend en Terminal 2
npm run dev:frontend

# Build solo backend
npm run build:backend

# Build solo frontend
npm run build:frontend

# ───────────────────────────────────────────────────────────────────────────
# ☁️ AWS S3 + CLOUDFRONT
# ───────────────────────────────────────────────────────────────────────────

# Configurar variables (solo una vez)
$env:AWS_ACCESS_KEY_ID = "tu_access_key"
$env:AWS_SECRET_ACCESS_KEY = "tu_secret_key"
$env:AWS_S3_BUCKET = "mi-nube-puntos"
$env:AWS_CLOUDFRONT_DISTRIBUTION_ID = "E1234567890ABC"

# Subir archivo a S3
npm run deploy:s3:file -- "C:\ruta\a\cloud.laz"

# Invalidar caché CloudFront
npm run invalidate:cf

# Deploy completo (build + S3 + invalidate)
npm run deploy:full

# ───────────────────────────────────────────────────────────────────────────
# 📦 AWS CLI - Comandos S3
# ───────────────────────────────────────────────────────────────────────────

# Crear bucket
aws s3 mb s3://mi-nube-puntos --region us-east-1

# Subir archivo
aws s3 cp cloud.laz s3://mi-nube-puntos/pointclouds/cloud.laz

# Listar contenido
aws s3 ls s3://mi-nube-puntos/pointclouds/

# Sincronizar directorio
aws s3 sync ./pointclouds s3://mi-nube-puntos/pointclouds/

# Eliminar archivo
aws s3 rm s3://mi-nube-puntos/pointclouds/cloud.laz

# ───────────────────────────────────────────────────────────────────────────
# 🌍 AWS CLI - CloudFront
# ───────────────────────────────────────────────────────────────────────────

# Ver distribuciones
aws cloudfront list-distributions

# Crear invalidación
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"

# Ver invalidaciones
aws cloudfront list-invalidations --distribution-id E1234567890ABC

# Ver estado de invalidación
aws cloudfront get-invalidation --distribution-id E1234567890ABC --id I1234567890ABC

# ───────────────────────────────────────────────────────────────────────────
# 🔑 AWS CLI - IAM
# ───────────────────────────────────────────────────────────────────────────

# Obtener identidad actual
aws sts get-caller-identity

# Listar usuarios IAM
aws iam list-users

# Ver políticas de usuario
aws iam list-user-policies --user-name github-actions-user

# ───────────────────────────────────────────────────────────────────────────
# 📊 AWS CLI - DynamoDB
# ───────────────────────────────────────────────────────────────────────────

# Listar tablas
aws dynamodb list-tables

# Describir tabla
aws dynamodb describe-table --table-name sensor-data

# Escanear tabla (10 items)
aws dynamodb scan --table-name sensor-data --limit 10

# Query por sensorId
aws dynamodb query --table-name sensor-data --key-condition-expression "sensorId = :id" --expression-attribute-values "{\":id\":{\"S\":\"sensor-001\"}}"

# ───────────────────────────────────────────────────────────────────────────
# 🧪 TESTING Y VERIFICACIÓN
# ───────────────────────────────────────────────────────────────────────────

# Probar S3 directo
curl.exe -I https://mi-nube-puntos.s3.us-east-1.amazonaws.com/pointclouds/cloud.laz

# Probar CloudFront
curl.exe -I https://d1234567890abc.cloudfront.net/pointclouds/cloud.laz

# Probar backend
curl.exe http://localhost:3000/api/sensors

# Probar WebSocket
# En browser console:
# let ws = new WebSocket('ws://localhost:3000'); ws.addEventListener('message', e => console.log(e.data));

# ───────────────────────────────────────────────────────────────────────────
# 🔧 GIT COMANDOS
# ───────────────────────────────────────────────────────────────────────────

# Verificar estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "Descripción de cambios"

# Push a main
git push origin main

# Ver historial
git log --oneline

# Ver ramas
git branch -a

# ───────────────────────────────────────────────────────────────────────────
# 🐛 DEBUGGING
# ───────────────────────────────────────────────────────────────────────────

# Limpiar caché npm
npm cache clean --force

# Limpiar node_modules y reinstalar
rm -r node_modules package-lock.json
npm install

# Limpiar build
rm -r dist

# Ver logs del backend
npm run dev:backend 2>&1 | Tee-Object -FilePath backend.log

# Ver logs del frontend
npm run dev:frontend 2>&1 | Tee-Object -FilePath frontend.log

# ───────────────────────────────────────────────────────────────────────────
# 📝 EDITAR ARCHIVOS IMPORTANTES
# ───────────────────────────────────────────────────────────────────────────

# Variables de entorno frontend
code frontend/.env
code frontend/.env.production

# Variables de entorno backend
code backend/.env

# Configuración CloudFront
code frontend/src/config/cloudfront.ts

# Componente 3D
code frontend/src/components/PotreeViewer.tsx

# Backend DynamoDB
code backend/src/services/dynamodb.ts

# ───────────────────────────────────────────────────────────────────────────
# 📚 VER DOCUMENTACIÓN
# ───────────────────────────────────────────────────────────────────────────

# Guía AWS completa
code AWS_S3_CLOUDFRONT_COMPLETE.md

# Schema DynamoDB
code DYNAMODB_SCHEMA.md

# Setup Potree
code POTREE_SETUP.md

# README principal
code README_MAIN.md

# ───────────────────────────────────────────────────────────────────────────
# ⚡ ATAJOS ÚTILES
# ───────────────────────────────────────────────────────────────────────────

# Abrir en browser
start http://localhost:5173

# Abrir AWS Console
start https://console.aws.amazon.com/

# Abrir GitHub Repository
start https://github.com/tu-usuario/tu-repo

# Listar puertos en uso
netstat -ano | findstr :3000

# Matar proceso en puerto 3000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force

# ───────────────────────────────────────────────────────────────────────────
# 💡 TRUCOS
# ───────────────────────────────────────────────────────────────────────────

# Combinar múltiples comandos AWS S3
aws s3 sync ./pointclouds s3://mi-nube-puntos/pointclouds/ --delete && `
  aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"

# Ver tamaño de archivos en S3
aws s3 ls s3://mi-nube-puntos/pointclouds/ --recursive --summarize

# Descargar archivo de S3
aws s3 cp s3://mi-nube-puntos/pointclouds/cloud.laz .

# Cambiar tier de almacenamiento S3 (si no lo usas frecuentemente)
aws s3api put-object-tagging --bucket mi-nube-puntos --key pointclouds/cloud.laz --tagging 'TagSet=[{Key=StorageClass,Value=GLACIER}]'

# ───────────────────────────────────────────────────────────────────────────
# ✅ CHECKLIST PRE-DEPLOY
# ───────────────────────────────────────────────────────────────────────────

# 1. Verificar que no hay errores
npm run build

# 2. Verificar credenciales AWS
aws sts get-caller-identity

# 3. Verificar bucket S3
aws s3 ls

# 4. Verificar distribución CloudFront
aws cloudfront list-distributions

# 5. Build frontend
npm run build:frontend

# 6. Subir a S3
npm run deploy:s3:file -- "tu_archivo.laz"

# 7. Invalidar CloudFront
npm run invalidate:cf

# 8. Verificar en browser
start https://d1234567890abc.cloudfront.net/

# ───────────────────────────────────────────────────────────────────────────
# 🆘 TROUBLESHOOTING RÁPIDO
# ───────────────────────────────────────────────────────────────────────────

# Si algo no funciona:

# 1. Limpiar todo
rm -r node_modules dist .next out
npm cache clean --force

# 2. Reinstalar
npm run install:all

# 3. Verificar env
type .env
type backend/.env
type frontend/.env.production

# 4. Verificar AWS
aws sts get-caller-identity
aws s3 ls
aws cloudfront list-distributions

# 5. Pruebas de conectividad
curl.exe http://localhost:3000/api/sensors
curl.exe -I https://mi-nube-puntos.s3.us-east-1.amazonaws.com/pointclouds/cloud.laz

# 6. Ver logs
Get-Content backend.log -Tail 50
Get-Content frontend.log -Tail 50

# ═════════════════════════════════════════════════════════════════════════
# Más ayuda:
# - AWS_S3_CLOUDFRONT_COMPLETE.md
# - DYNAMODB_SCHEMA.md
# - POTREE_SETUP.md
# - README_MAIN.md
# ═════════════════════════════════════════════════════════════════════════
