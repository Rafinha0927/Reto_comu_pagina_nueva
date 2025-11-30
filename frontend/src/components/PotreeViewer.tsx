import { useEffect, useRef } from "react";
import SensorModal from "./SensorModal";

/**
 * POSICIONES DE SENSORES EN COORDENADAS 3D
 * ========================================
 * Estas coordenadas definen dónde se renderizan los sensores en la escena de Potree.
 * Si tienes una nube de puntos real (LAS/LAZ), estas posiciones pueden variar.
 * 
 * Formato: [x, y, z]
 * - X: posición horizontal izquierda-derecha
 * - Y: posición vertical arriba-abajo
 * - Z: profundidad adelante-atrás
 * 
 * IMPORTANTE: Estos valores deben coincidir con las coordenadas de tus sensores
 * en la tabla DynamoDB (location.x, location.y, location.z)
 */
const SENSOR_POSITIONS: Record<string, [number, number, number]> = {
  "sensor-01": [-4, 2.5, 4],   // Esquina superior izquierda frontal
  "sensor-02": [4, 2.5, 4],    // Esquina superior derecha frontal
  "sensor-03": [-4, 2.5, -4],  // Esquina superior izquierda trasera
  "sensor-04": [4, 2.5, -4],   // Esquina superior derecha trasera
};

interface Props {
  latestData: Record<string, any>; // Datos de WebSocket: { "sensor-01": { temperature, humidity, ... }, ... }
  onSensorClick: (id: string) => void; // Callback cuando se hace clic en un sensor
}

export default function PotreeViewer({ latestData, onSensorClick }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  /**
   * CÓDIGO DE COLOR BASADO EN TEMPERATURA
   * ======================================
   * Retorna valores RGB (0-255) según la temperatura del sensor
   * 
   * - Azul: < 18°C (frío)
   * - Verde: 18-24°C (normal/confortable)
   * - Amarillo: 24-30°C (caliente)
   * - Rojo: > 30°C (muy caliente)
   * 
   * Estos colores se aplican al renderizado de los puntos en Potree
   */
  const getColorFromTemp = (temp: number) => {
    if (temp < 18) return [0, 0, 255];      // Azul - Frío
    if (temp < 24) return [0, 255, 0];      // Verde - Normal
    if (temp < 30) return [255, 255, 0];    // Amarillo - Caliente
    return [255, 0, 0];                     // Rojo - Muy caliente
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    /**
     * CARGAR LIBRERÍAS DESDE CDN
     * ==========================
     * Las librerías necesarias se cargan de forma dinámica:
     * - Three.js: Motor 3D que renderiza escenas
     * - Potree: Visualizador de nubes de puntos
     * - jQuery, BinaryHeap, Tween, dgreed: Dependencias de Potree
     */
    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => console.error("Failed to load", src);
        document.head.appendChild(script);
      });
    };

    const init = async () => {
      // Cargar Three.js (motor gráfico 3D)
      await loadScript("https://cdn.jsdelivr.net/npm/three@0.168/build/three.min.js");
      
      // Cargar Potree y sus dependencias
      await loadScript("https://cdn.jsdelivr.net/npm/potree@1.8/build/potree/potree.js");
      await loadScript("https://cdn.jsdelivr.net/npm/potree@1.8/libs/jquery/jquery-3.1.1.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/potree@1.8/libs/other/BinaryHeap.js");
      await loadScript("https://cdn.jsdelivr.net/npm/potree@1.8/libs/tween/tween.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/potree@1.8/libs/dgreed/dgreed.js");

      /**
       * CREAR Y CONFIGURAR EL VIEWER DE POTREE
       * ======================================
       * El Viewer es el contenedor principal que renderiza la escena 3D
       */
      const viewer = new (window as any).Potree.Viewer(mountRef.current!);
      
      // EDL = Eye Dome Lighting (mejora la visualización de nubes densas)
      viewer.setEDLEnabled(true);
      
      // Campo visual de 60 grados
      viewer.setFOV(60);
      
      // Límite de puntos a renderizar (rendimiento)
      viewer.setPointBudget(1_000_000);
      
      // Fondo negro para mejor contraste
      viewer.setBackground("black");

      /**
       * POSICIONAR LA CÁMARA
       * ====================
       * - position.set(x, y, z): Dónde está la cámara
       * - lookAt(x, y, z): Hacia dónde mira la cámara
       */
      viewer.scene.view.position.set(20, 15, 20);
      viewer.scene.view.lookAt(0, 0, 0);

      // Crear los 4 puntos
      const THREE = (window as any).THREE;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(12);
      const colors = new Float32Array(12);
      const sizes = new Float32Array(4).fill(200);

      Object.values(SENSOR_POSITIONS).forEach(([x, y, z], i) => {
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        colors[i * 3] = 0.8;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 0.8;
      });

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

      const material = new (window as any).Potree.PointsMaterial({
        vertexColors: THREE.VertexColors,
        size: 200,
        sizeType: (window as any).Potree.PointSizeType.FIXED,
      });

      const points = new (window as any).Potree.Points(geometry, material);
      points.frustumCulled = false;
      viewer.scene.pointclouds.push(points);
      viewer.scene.scene.add(points);

      // Guardamos referencia para actualizar colores
      (window as any).sensorPoints = { geometry, colors: colors };

      // Click
      viewer.renderer.domElement.addEventListener("click", (e: MouseEvent) => {
        const rect = viewer.renderer.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        const camera = viewer.scene.getActiveCamera();
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x, y }, camera);
        raycaster.params.Points.threshold = 3;

        const hits = raycaster.intersectObject(points);
        if (hits.length > 0) {
          const idx = hits[0].index!;
          const sensorId = Object.keys(SENSOR_POSITIONS)[idx];
          onSensorClick(sensorId);
        }
      });
    };

    init();
  }, [onSensorClick]);


  // Actualizar colores en tiempo real
  useEffect(() => {
    if (!(window as any).sensorPoints) return;
    const colors = (window as any).sensorPoints.colors;

    Object.entries(SENSOR_POSITIONS).forEach(([id], i) => {
      const temp = latestData[id]?.temperature ?? 20;
      const [r, g, b] = getColorFromTemp(temp);
      colors.array[i * 3] = r / 255;
      colors.array[i * 3 + 1] = g / 255;
      colors.array[i * 3 + 2] = b / 255;
    });
    colors.needsUpdate = true;
  }, [latestData]);

  return (
    <div className="w-full h-screen relative bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-black/80 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">Monitoreo Salón 3D</h1>
        <p className="text-lg">Potree + 4 sensores en tiempo real</p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3"><div className="w-6 h-6 bg-blue-500 rounded-full"></div> Frío (&lt;18°C)</div>
          <div className="flex items-center gap-3"><div className="w-6 h-6 bg-green-500 rounded-full"></div> Normal (18-24°C)</div>
          <div className="flex items-center gap-3"><div className="w-6 h-6 bg-yellow-500 rounded-full"></div> Calor (24-30°C)</div>
          <div className="flex items-center gap-3"><div className="w-6 h-6 bg-red-500 rounded-full"></div> Muy caliente (&gt;30°C)</div>
        </div>
      </div>
    </div>
  );
}