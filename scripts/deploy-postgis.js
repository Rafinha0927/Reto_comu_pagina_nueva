#!/usr/bin/env node
/**
 * Script para subir datos PostGIS/espaciales a S3
 * 
 * Uso:
 *   node scripts/deploy-postgis.js archivo.json
 *   node scripts/deploy-postgis.js archivo.sql
 * 
 * Variables de entorno requeridas:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_S3_BUCKET (default: reto-comu-pointcloud)
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
const FILE_PATH = process.argv[2] || './data.json'
const S3_KEY = `postgis/${path.basename(FILE_PATH)}`

/**
 * Valida que el archivo existe
 */
function validateFile() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`❌ Error: Archivo no encontrado: ${FILE_PATH}`)
    console.error(`Uso: node deploy-postgis.js <archivo.json|archivo.sql>`)
    process.exit(1)
  }

  const ext = path.extname(FILE_PATH).toLowerCase()
  if (!['.json', '.sql', '.geojson', '.csv'].includes(ext)) {
    console.warn(`⚠️  Advertencia: Extensión no común para PostGIS: ${ext}`)
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
 * Sube archivo PostGIS a S3
 */
async function uploadPostGIS() {
  validateCredentials()
  validateFile()

  const fileSize = fs.statSync(FILE_PATH).size
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2)
  const fileType = path.extname(FILE_PATH).toLowerCase()

  console.log('\n📤 Subiendo datos PostGIS a S3...')
  console.log(`📂 Archivo: ${FILE_PATH}`)
  console.log(`📊 Tamaño: ${fileSizeMB}MB`)
  console.log(`🗂️  Tipo: ${fileType}`)
  console.log(`🎯 Destino: s3://${BUCKET}/${S3_KEY}`)
  console.log(`🌍 Región: ${process.env.AWS_REGION || 'us-east-1'}`)
  console.log('---\n')

  const fileContent = fs.readFileSync(FILE_PATH)

  // Detectar Content-Type según extensión
  let contentType = 'application/octet-stream'
  if (fileType === '.json' || fileType === '.geojson') {
    contentType = 'application/json'
  } else if (fileType === '.sql') {
    contentType = 'application/sql'
  } else if (fileType === '.csv') {
    contentType = 'text/csv'
  }

  try {
    const params = {
      Bucket: BUCKET,
      Key: S3_KEY,
      Body: fileContent,
      ContentType: contentType,
      Metadata: {
        'uploaded-at': new Date().toISOString(),
        'file-size': fileSizeMB,
        'file-type': fileType,
        'original-name': path.basename(FILE_PATH),
        'data-type': 'postgis',
      },
      // Caché de 24 horas para datos
      CacheControl: 'max-age=86400, public',
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

    console.log('\n\n✅ Upload de PostGIS completado!\n')
    console.log('📍 Información de S3:')
    console.log(`   URL: ${result.Location}`)
    console.log(`   Etag: ${result.ETag}`)
    console.log(`   Tamaño: ${fileSizeMB}MB`)
    console.log(`   Tipo: ${fileType}`)

    console.log('\n🔗 URLs de acceso:')
    console.log(`   S3 (directo): ${result.Location}`)
    
    if (process.env.AWS_CLOUDFRONT_URL || process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID) {
      const cfUrl = `${process.env.AWS_CLOUDFRONT_URL || 'https://d2h8nqd60uagyp.cloudfront.net'}/${S3_KEY}`
      console.log(`   CloudFront: ${cfUrl}`)
    } else {
      console.log('   ⚠️  CloudFront URL no configurada')
    }

    console.log('\n💡 Próximos pasos:')
    console.log('   1. Invalidar caché CloudFront: npm run invalidate:cf')
    console.log('   2. Acceder a datos: fetch("' + (process.env.AWS_CLOUDFRONT_URL || 'https://d2h8nqd60uagyp.cloudfront.net') + '/' + S3_KEY + '")')
    console.log('   3. Usar en aplicación: getPostGISUrl("' + path.basename(FILE_PATH) + '")\n')

  } catch (err) {
    console.error('\n❌ Error al subir archivo:')
    console.error(err.message || err)
    process.exit(1)
  }
}

// Ejecutar
uploadPostGIS()
