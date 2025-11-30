// frontend/src/components/PotreeViewer.tsx
import { useEffect, useRef } from "react";
import SensorModal from "./SensorModal";

const SENSOR_POSITIONS: Record<string, [number, number, number]> = {
  "sensor-01": [-4, 2.5, 4],
  "sensor-02": [4, 2.5, 4],
  "sensor-03": [-4, 2.5, -4],
  "sensor-04": [4, 2.5, -4],
};

interface Props {
  latestData: Record<string, any>;
  onSensorClick: (id: string) => void;
}

export default function PotreeViewer({ latestData, onSensorClick }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const getColorFromTemp = (temp: number) => {
    if (temp < 18) return [0, 0, 255];
    if (temp < 24) return [0, 255, 0];
    if (temp < 30) return [255, 255, 0];
    return [255, 0, 0];
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Forzamos que los scripts se carguen desde CDN absoluto (esto evita el bug de Vite)
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
      await loadScript("https://cdn.jsdelivr.net/npm/three@0.168/build/three.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/potree@1.8/build/potree/potree.js");
      await loadScript("https://cdn.jsdelivr.net/npm/potree@1.8/libs/jquery/jquery-3.1.1.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/potree@1.8/libs/other/BinaryHeap.js");
      await loadScript("https://cdn.jsdelivr.net/npm/potree@1.8/libs/tween/tween.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/potree@1.8/libs/dgreed/dgreed.js");

      // Ahora sí creamos el viewer
      const viewer = new (window as any).Potree.Viewer(mountRef.current!);
      viewer.setEDLEnabled(true);
      viewer.setFOV(60);
      viewer.setPointBudget(1_000_000);
      viewer.setBackground("black");

      viewer.scene.view.position.set(20, 15, 20);
      viewer.scene.view.lookAt(0, 0, 0);

      // Crear los 4 puntos
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
  }, []);

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