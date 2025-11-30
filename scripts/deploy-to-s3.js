#!/usr/bin/env node
/**
 * Script para subir nube de puntos a S3
 * 
 * Uso:
 *   node scripts/deploy-to-s3.js archivo.laz
 * 
 * Variables de entorno requeridas:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION (default: us-east-1)
 *   AWS_S3_BUCKET (default: mi-nube-puntos)
 */

const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')

// Configurar AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
})

const BUCKET = process.env.AWS_S3_BUCKET || 'reto-comu-pointcloud'
const FILE_PATH = process.argv[2] || './cloud.laz'
// Detectar tipo de archivo para colocar en carpeta correcta
const isPostGIS = FILE_PATH.includes('postgis') || FILE_PATH.endsWith('.sql') || FILE_PATH.endsWith('.json')
const isAsset = FILE_PATH.includes('asset') || FILE_PATH.endsWith('.png') || FILE_PATH.endsWith('.jpg')
const isModel = FILE_PATH.includes('model') || FILE_PATH.endsWith('.gltf') || FILE_PATH.endsWith('.glb')

let S3_KEY = ''
if (isPostGIS) {
  S3_KEY = `postgis/${path.basename(FILE_PATH)}`
} else if (isAsset) {
  S3_KEY = `assets/${path.basename(FILE_PATH)}`
} else if (isModel) {
  S3_KEY = `models/${path.basename(FILE_PATH)}`
} else {
  S3_KEY = `${path.basename(FILE_PATH)}` // Potree files en raíz
}

/**
 * Valida que el archivo existe
 */
function validateFile() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`❌ Error: Archivo no encontrado: ${FILE_PATH}`)
    console.error(`Uso: node deploy-to-s3.js <ruta-archivo.laz>`)
    process.exit(1)
  }

  if (!FILE_PATH.endsWith('.laz') && !FILE_PATH.endsWith('.las')) {
    console.error('⚠️  Advertencia: Archivo no es .laz o .las')
  }
}

/**
 * Valida credenciales AWS
 */
function validateCredentials() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ Error: Credenciales AWS no configuradas')
    console.error('Variables requeridas:')
    console.error('  export AWS_ACCESS_KEY_ID=tu_key')
    console.error('  export AWS_SECRET_ACCESS_KEY=tu_secret')
    process.exit(1)
  }
}

/**
 * Sube archivo a S3
 */
async function uploadToS3() {
  validateCredentials()
  validateFile()

  const fileSize = fs.statSync(FILE_PATH).size
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2)

  console.log('\n📤 Iniciando upload a S3...')
  console.log(`📂 Archivo: ${FILE_PATH}`)
  console.log(`📊 Tamaño: ${fileSizeMB}MB`)
  console.log(`🎯 Destino: s3://${BUCKET}/${S3_KEY}`)
  console.log(`🌍 Región: ${process.env.AWS_REGION || 'us-east-1'}`)
  console.log('---\n')

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
        'original-name': path.basename(FILE_PATH),
      },
      // Metadata para CloudFront
      CacheControl: 'max-age=2592000, public', // 30 días
    }

    // Crear objeto upload
    const upload = s3.upload(params)

    // Monitorear progreso
    let lastProgress = 0
    upload.on('httpUploadProgress', (progress) => {
      const percent = Math.round((progress.loaded / progress.total) * 100)
      
      // Solo mostrar cada 10%
      if (percent % 10 === 0 && percent !== lastProgress) {
        const bar = '█'.repeat(percent / 5) + '░'.repeat(20 - percent / 5)
        process.stdout.write(`\r⏳ Subiendo... [${bar}] ${percent}%`)
        lastProgress = percent
      }
    })

    // Esperar a que complete
    const result = await upload.promise()

    console.log('\n\n✅ Upload completado exitosamente!\n')
    console.log('📍 Información de S3:')
    console.log(`   URL: ${result.Location}`)
    console.log(`   Etag: ${result.ETag}`)
    console.log(`   Tamaño: ${fileSizeMB}MB`)

    console.log('\n🔗 URLs de acceso:')
    console.log(`   S3 (directo): ${result.Location}`)
    
    if (process.env.AWS_CLOUDFRONT_URL) {
      const cfUrl = `${process.env.AWS_CLOUDFRONT_URL}/${S3_KEY}`
      console.log(`   CloudFront: ${cfUrl}`)
    } else {
      console.log('   ⚠️  CloudFront URL no configurada')
      console.log('   export AWS_CLOUDFRONT_URL=https://dXXXXXX.cloudfront.net')
    }

    console.log('\n💡 Próximos pasos:')
    console.log('   1. Invalidar caché CloudFront: npm run invalidate-cf')
    console.log('   2. Actualizar .env con la URL de CloudFront')
    console.log('   3. Hacer commit y push')
    console.log('   4. GitHub Actions se encargará del deploy\n')

  } catch (err) {
    console.error('\n❌ Error al subir archivo:')
    console.error(err.message || err)
    process.exit(1)
  }
}

// Ejecutar
uploadToS3()
