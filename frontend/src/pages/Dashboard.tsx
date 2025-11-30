// frontend/src/components/PotreeViewer.tsx
import { useEffect, useRef, useState } from "react";
import SensorModal from "./SensorModal";

const SENSOR_POSITIONS: Record<string, [number, number, number]> = {
  "sensor-01": [-4, 2.5, 4],   // X, Y(altura), Z
  "sensor-02": [4, 2.5, 4],
  "sensor-03": [-4, 2.5, -4],
  "sensor-04": [4, 2.5, -4],
};

const SENSOR_NAMES: Record<string, string> = {
  "sensor-01": "Esquina Noroeste",
  "sensor-02": "Esquina Noreste",
  "sensor-03": "Esquina Suroeste",
  "sensor-04": "Esquina Sureste",
};

interface Props {
  latestData: Record<string, any>;
  onSensorClick: (id: string) => void;
}

declare global {
  interface Window {
    Potree: any;
    THREE: any;
  }
}

export default function PotreeViewer({ latestData, onSensorClick }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const pointsRef = useRef<any>(null);

  const getColorFromTemp = (temp: number) => {
    if (temp < 18) return [0, 0, 255];
    if (temp < 24) return [0, 255, 0];
    if (temp < 30) return [255, 255, 0];
    return [255, 0, 0];
  };

  useEffect(() => {
    // Cargar Potree solo una vez
    if (window.Potree) {
      initViewer();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/potree@1.8/build/potree/potree.js";
    script.onload = () => {
      const threeScript = document.createElement("script");
      threeScript.src = "https://cdn.jsdelivr.net/npm/three@0.168/build/three.min.js";
      threeScript.onload = initViewer;
      document.body.appendChild(threeScript);
    };
    document.body.appendChild(script);

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdn.jsdelivr.net/npm/potree@1.8/build/potree/potree.css";
    document.head.appendChild(css);

    return () => {
      if (viewerRef.current) viewerRef.current.destroy();
    };
  }, []);

  const initViewer = () => {
    if (!mountRef.current) return;

    const viewer = new window.Potree.Viewer(mountRef.current);
    viewer.setEDLEnabled(true);
    viewer.setFOV(60);
    viewer.setPointBudget(1_000_000);
    viewer.setBackground("black");
    viewer.setDescription("");
    viewer.loadGUI(() => viewer.setLanguage("es"));

    // Cámara inicial
    viewer.scene.view.position.set(15, 15, 15);
    viewer.scene.view.lookAt(0, 0, 0);

    // Crear solo nuestros 4 puntos
    const geometry = new window.THREE.BufferGeometry();
    const positions = new Float32Array(12);
    const colors = new Float32Array(12);
    const sizes = new Float32Array(4).fill(150);

    Object.values(SENSOR_POSITIONS).forEach(([x, y, z], i) => {
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      // Color inicial gris
      colors[i * 3 + 0] = 0.7;
      colors[i * 3 + 1] = 0.7;
      colors[i * 3 + 2] = 0.7;
    });

    geometry.setAttribute("position", new window.THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new window.THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new window.THREE.BufferAttribute(sizes, 1));

    const material = new window.Potree.PointsMaterial({
      vertexColors: window.THREE.VertexColors,
      size: 150,
      sizeType: window.Potree.PointSizeType.FIXED,
    });

    const points = new window.Potree.Points(geometry, material);
    points.frustumCulled = false;
    viewer.scene.pointclouds.push(points);
    viewer.scene.scene.add(points);

    pointsRef.current = { points, geometry, colors };
    viewerRef.current = viewer;

    // Click en los puntos
    viewer.renderer.domElement.addEventListener("click", (e: any) => {
      const rect = viewer.renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const camera = viewer.scene.getActiveCamera();
      const raycaster = new window.THREE.Raycaster();
      raycaster.setFromCamera({ x, y }, camera);
      raycaster.params.Points.threshold = 2;

      const hits = raycaster.intersectObject(points);
      if (hits.length > 0) {
        const idx = hits[0].index;
        const sensorId = Object.keys(SENSOR_POSITIONS)[idx];
        onSensorClick(sensorId);
      }
    });
  };

  // Actualizar colores en tiempo real
  useEffect(() => {
    if (!pointsRef.current) return;

    const colors = pointsRef.current.colors;
    Object.entries(SENSOR_POSITIONS).forEach(([id], i) => {
      const data = latestData[id];
      const temp = data?.temperature ?? 20;
      const [r, g, b] = getColorFromTemp(temp);
      colors.array[i * 3 + 0] = r / 255;
      colors.array[i * 3 + 1] = g / 255;
      colors.array[i * 3 + 2] = b / 255;
    });
    colors.needsUpdate = true;
  }, [latestData]);

  return (
    <div className="w-full h-screen relative bg-black">
      <div ref={mountRef} className="absolute inset-0" />
      
      <div className="absolute top-4 left-4 bg-black/80 text-white p-6 rounded-xl shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">Monitoreo Salón 3D</h1>
        <p className="text-sm opacity-90">4 sensores en tiempo real con Potree</p>
        <div className="mt-4 space-y-1 text-xs">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded"></div> &lt; 18°C</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div> 18–24°C</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-500 rounded"></div> 24–30°C</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded"></div> &gt; 30°C</div>
        </div>
      </div>
    </div>
  );
}