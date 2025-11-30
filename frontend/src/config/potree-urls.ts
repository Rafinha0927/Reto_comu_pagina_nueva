/**
 * URLs de Potree y librerías desde CloudFront
 * Centraliza todas las URLs necesarias para cargar Potree
 */

import { cloudFrontConfig } from './cloudfront';

// Base URL completa para S3 estático
const BASE_URL = `${cloudFrontConfig.baseUrl}/reto-comu-arreglado-main/reto-comu-arreglado-main/static`;

/**
 * URLs de librerías JavaScript en orden correcto de carga
 */
export const POTREE_LIBRARIES = {
  jquery: `${BASE_URL}/libs/jquery/jquery-3.1.1.min.js`,
  spectrum: `${BASE_URL}/libs/spectrum/spectrum.js`,
  jqueryUI: `${BASE_URL}/libs/jquery-ui/jquery-ui.min.js`,
  binaryHeap: `${BASE_URL}/libs/other/BinaryHeap.js`,
  tween: `${BASE_URL}/libs/tween/tween.min.js`,
  d3: `${BASE_URL}/libs/d3/d3.js`,
  proj4: `${BASE_URL}/libs/proj4/proj4.js`,
  openlayers: `${BASE_URL}/libs/openlayers3/ol.js`,
  i18next: `${BASE_URL}/libs/i18next/i18next.js`,
  jstree: `${BASE_URL}/libs/jstree/jstree.js`,
  three: `${BASE_URL}/libs/three.js/build/three.min.js`,
  potree: `${BASE_URL}/build/potree/potree.js`,
  laslaz: `${BASE_URL}/libs/plasio/js/laslaz.js`,
  shapefile: `${BASE_URL}/libs/shapefile/shapefile.js`,
} as const;

/**
 * URLs de CSS en orden correcto de carga
 */
export const POTREE_STYLES = {
  potree: `${BASE_URL}/build/potree/potree.css`,
  jqueryUI: `${BASE_URL}/libs/jquery-ui/jquery-ui.min.css`,
  openlayers: `${BASE_URL}/libs/openlayers3/ol.css`,
  spectrum: `${BASE_URL}/libs/spectrum/spectrum.css`,
  jstree: `${BASE_URL}/libs/jstree/themes/mixed/style.css`,
} as const;

/**
 * Orden correcto de carga de librerías JavaScript
 */
export const POTREE_LOAD_ORDER = [
  'jquery',
  'spectrum',
  'jqueryUI',
  'binaryHeap',
  'tween',
  'd3',
  'proj4',
  'openlayers',
  'i18next',
  'jstree',
  'three',
  'potree',
  'laslaz',
  'shapefile',
] as const;

/**
 * Obtiene la URL de una librería
 */
export const getLibraryUrl = (lib: keyof typeof POTREE_LIBRARIES): string => {
  return POTREE_LIBRARIES[lib];
};

/**
 * Obtiene la URL de un estilo
 */
export const getStyleUrl = (style: keyof typeof POTREE_STYLES): string => {
  return POTREE_STYLES[style];
};

/**
 * Obtiene URLs de todas las librerías en orden de carga
 */
export const getAllLibraryUrls = (): string[] => {
  return POTREE_LOAD_ORDER.map(lib => POTREE_LIBRARIES[lib]);
};

/**
 * Obtiene URLs de todos los estilos
 */
export const getAllStyleUrls = (): string[] => {
  return Object.values(POTREE_STYLES);
};

/**
 * Obtiene URL de nube de puntos
 */
export const getPointCloudUrl = (): string => {
  return `${BASE_URL}/pointclouds/Puntos/cloud.js`;
};

/**
 * URL de Potree completa
 */
export const POTREE_BASE = BASE_URL;
export const POTREE_CLOUD_JS = getPointCloudUrl();
