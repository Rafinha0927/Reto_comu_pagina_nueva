/**
 * Configuración de CloudFront para nube de puntos
 * Maneja URLs tanto locales como de CloudFront
 */

export const cloudFrontConfig = {
  // URL base de CloudFront (reemplazar con tu domain)
  baseUrl: import.meta.env.VITE_CLOUDFRONT_URL || 'https://d123456abc.cloudfront.net',
  
  // Rutas de archivos
  paths: {
    cloud: import.meta.env.VITE_POINTCLOUD_PATH || '/pointclouds/cloud.laz',
    backup: [
      '/pointclouds/cloud.laz',
      '/pointclouds/cloud.las',
      '/pointclouds/sensores.laz',
    ],
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
    // En producción, usar CloudFront como primaria + fallbacks locales
    return [
      getCloudFrontUrl(cloudFrontConfig.paths.cloud),
      ...cloudFrontConfig.paths.backup.map(path => getCloudFrontUrl(path)),
    ]
  }
  
  // En desarrollo, usar rutas locales
  return cloudFrontConfig.paths.backup
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
    status: isEnabled && isHealthy ? '✅ Online' : '⚠️ Offline',
    fallback: 'Local files',
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
