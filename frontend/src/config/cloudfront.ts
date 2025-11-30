/**
 * Configuración de CloudFront para nube de puntos
 * Maneja URLs tanto locales como de CloudFront
 */

export const cloudFrontConfig = {
  // URL base de CloudFront - Bucket: reto-comu-pointcloud
  baseUrl: import.meta.env.VITE_CLOUDFRONT_URL || 'https://d2h8nqd60uagyp.cloudfront.net',
  
  // Bucket S3 real
  bucket: import.meta.env.VITE_S3_BUCKET || 'reto-comu-pointcloud',
  
  // Rutas de archivos (estructura del bucket)
  paths: {
    // Archivos Potree/nube de puntos (raíz del bucket)
    potree: import.meta.env.VITE_POINTCLOUD_PATH || '/',
    
    // Rutas de fallback para intentos
    backup: [
      '/',  // Raíz del bucket
      '/potree/',
      '/pointclouds/',
      '/data/',
    ],
    
    // Archivos PostGIS/datos espaciales
    postgis: '/postgis/',
    
    // Otros recursos
    assets: '/assets/',
    models: '/models/',
  },

  // Habilitar CloudFront (true en producción, false en desarrollo)
  enabled: import.meta.env.VITE_USE_CLOUDFRONT === 'true',

  // Configuración de caché
  cache: {
    maxAge: 86400 * 30, // 30 días en segundos
    headers: {
      'Cache-Control': 'public, max-age=2592000',
    },
  },

  // Configuración de reintentos
  retries: 3,
  retryDelay: 1000, // ms

  // Timeout para carga
  timeout: 60000, // ms (60 segundos)
}

/**
 * Construye URL completa para CloudFront o local
 * @param path - Ruta del archivo (ej: /pointclouds/cloud.laz)
 * @returns URL completa
 */
export const getCloudFrontUrl = (path: string): string => {
  if (!cloudFrontConfig.enabled) {
    return path // Usar local en desarrollo
  }
  return `${cloudFrontConfig.baseUrl}${path}`
}

/**
 * Obtiene lista de URLs para intentar cargar (CloudFront + fallbacks)
 * @returns Array de URLs ordenadas por preferencia
 */
export const getPointCloudUrls = (): string[] => {
  if (cloudFrontConfig.enabled) {
    // En producción, usar CloudFront como primaria + fallbacks
    return [
      getCloudFrontUrl(cloudFrontConfig.paths.potree), // Primaria: raíz del bucket Potree
      ...cloudFrontConfig.paths.backup.map(path => getCloudFrontUrl(path)), // Fallbacks
    ]
  }
  
  // En desarrollo, usar rutas locales
  return cloudFrontConfig.paths.backup
}

/**
 * Obtiene URL de archivo PostGIS/datos espaciales
 * @param filename - Nombre del archivo
 * @returns URL completa del archivo
 */
export const getPostGISUrl = (filename: string): string => {
  const path = `${cloudFrontConfig.paths.postgis}${filename}`
  return getCloudFrontUrl(path)
}

/**
 * Obtiene URL de asset/recurso estático
 * @param filename - Nombre del asset
 * @returns URL completa del asset
 */
export const getAssetUrl = (filename: string): string => {
  const path = `${cloudFrontConfig.paths.assets}${filename}`
  return getCloudFrontUrl(path)
}

/**
 * Obtiene URL de modelo 3D
 * @param filename - Nombre del modelo
 * @returns URL completa del modelo
 */
export const getModelUrl = (filename: string): string => {
  const path = `${cloudFrontConfig.paths.models}${filename}`
  return getCloudFrontUrl(path)
}

/**
 * Verifica si CloudFront está disponible (health check)
 * @returns true si CloudFront responde
 */
export const checkCloudFrontHealth = async (): Promise<boolean> => {
  if (!cloudFrontConfig.enabled) {
    return true // En desarrollo no importa
  }

  try {
    const url = getCloudFrontUrl('/')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response.status < 500 // OK si no es error de servidor
  } catch (err) {
    console.warn('⚠️ CloudFront no disponible:', err)
    return false
  }
}

/**
 * Obtiene información de estado de CloudFront
 * @returns Objeto con información de estado
 */
export const getCloudFrontStatus = async () => {
  const isHealthy = await checkCloudFrontHealth()
  const isEnabled = cloudFrontConfig.enabled

  return {
    enabled: isEnabled,
    healthy: isHealthy,
    url: cloudFrontConfig.baseUrl,
    bucket: cloudFrontConfig.bucket,
    status: isEnabled && isHealthy ? '✅ Online' : '⚠️ Offline',
    fallback: 'Local files',
    message: isEnabled && isHealthy 
      ? `✅ Cargando desde CloudFront (${cloudFrontConfig.bucket})`
      : '⚠️ Usando archivos locales',
  }
}

/**
 * Simula carga de archivo con progreso (para testing)
 * @param url - URL del archivo
 * @returns Observable-like object con progreso
 */
export const simulateLoadProgress = async (url: string) => {
  console.log(`📥 Simulando carga de: ${url}`)
  
  for (let i = 0; i <= 100; i += 10) {
    console.log(`⏳ Progreso: ${i}%`)
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  return { success: true }
}
