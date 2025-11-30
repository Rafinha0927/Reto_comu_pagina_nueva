#!/usr/bin/env node
/**
 * Script para invalidar caché de CloudFront después de actualizar S3
 * 
 * Uso:
 *   node scripts/invalidate-cloudfront.js
 * 
 * Variables de entorno requeridas:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_CLOUDFRONT_DISTRIBUTION_ID
 *   AWS_REGION (default: us-east-1)
 */

const AWS = require('aws-sdk')

// Configurar AWS
const cloudfront = new AWS.CloudFront({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
})

const DISTRIBUTION_ID = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID

/**
 * Valida credenciales y configuración
 */
function validateConfig() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ Error: Credenciales AWS no configuradas')
    console.error('Variables requeridas:')
    console.error('  export AWS_ACCESS_KEY_ID=tu_key')
    console.error('  export AWS_SECRET_ACCESS_KEY=tu_secret')
    process.exit(1)
  }

  if (!DISTRIBUTION_ID) {
    console.error('❌ Error: ID de CloudFront Distribution no configurado')
    console.error('Variable requerida:')
    console.error('  export AWS_CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC')
    console.error('\nPuedes obtener el ID en AWS CloudFront Console')
    process.exit(1)
  }
}

/**
 * Crea invalidación en CloudFront
 */
async function invalidateCache() {
  validateConfig()

  console.log('\n🔄 Invalidando caché de CloudFront...')
  console.log(`📍 Distribution ID: ${DISTRIBUTION_ID}`)
  console.log(`🌍 Región: ${process.env.AWS_REGION || 'us-east-1'}`)
  console.log('---\n')

  try {
    const params = {
      DistributionId: DISTRIBUTION_ID,
      InvalidationBatch: {
        Paths: {
          Quantity: 1,
          Items: ['/*'], // Invalida todo el contenido
        },
        CallerReference: Date.now().toString(),
      },
    }

    const result = await cloudfront.createInvalidation(params).promise()

    const invalidationId = result.Invalidation.Id
    const status = result.Invalidation.Status
    const createTime = result.Invalidation.CreateTime

    console.log('✅ Invalidación creada exitosamente!\n')
    console.log('📊 Información:')
    console.log(`   ID: ${invalidationId}`)
    console.log(`   Estado: ${status}`)
    console.log(`   Creado: ${new Date(createTime).toLocaleString()}`)
    console.log(`   Paths: /*\n`)

    // Esperar a que se complete
    console.log('⏳ Esperando a que se complete la invalidación...')
    console.log('   (normalmente toma 2-5 minutos)\n')

    // Monitorear estado
    let completed = false
    let attempts = 0
    const maxAttempts = 60 // 5 minutos con checks cada 5 segundos

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000))

      try {
        const invalidation = await cloudfront
          .getInvalidation({
            DistributionId: DISTRIBUTION_ID,
            Id: invalidationId,
          })
          .promise()

        const currentStatus = invalidation.Invalidation.Status
        process.stdout.write(`\r⏳ Estado: ${currentStatus}`)

        if (currentStatus === 'Completed') {
          completed = true
          console.log('\n\n✅ Caché invalidado completamente!\n')
          console.log('💡 El contenido nuevo estará disponible en:')
          console.log(`   https://d${DISTRIBUTION_ID}.cloudfront.net/\n`)
        }
      } catch (err) {
        if (err.code !== 'Throttling') {
          throw err
        }
        // Reintentar si está throttled
      }

      attempts++
    }

    if (!completed) {
      console.log('\n⚠️  Timeout esperando invalidación')
      console.log('La invalidación continúa en AWS. Estado:')
      console.log(`https://console.aws.amazon.com/cloudfront/\n`)
    }
  } catch (err) {
    console.error('\n❌ Error al invalidar caché:')
    console.error(err.message || err)
    process.exit(1)
  }
}

// Ejecutar
invalidateCache()
