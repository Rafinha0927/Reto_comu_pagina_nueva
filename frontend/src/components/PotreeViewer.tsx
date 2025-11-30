import { useEffect, useRef, useState } from "react";
import SensorModal from "./SensorModal";

declare global {
  interface Window {
    Potree: any;
    THREE: any;
  }
}

const SENSOR_POSITIONS: Record<string, [number, number, number]> = {
  "sensor-01": [-4, 1, 2.5],
  "sensor-02": [4, 1, 2.5],
  "sensor-03": [-4, -6, 2.5],
  "sensor-04": [4, -6, 2.5],
};

const SENSOR_NAMES: Record<string, string> = {
  "sensor-01": "Esquina Delantera Izquierda",
  "sensor-02": "Esquina Delantera Derecha",
  "sensor-03": "Esquina Trasera Izquierda",
  "sensor-04": "Esquina Trasera Derecha",
};

interface PotreeViewerProps {
  latestData: Record<string, any>;
  onSensorClick: (id: string) => void;
}

export default function PotreeViewer({ latestData, onSensorClick }: PotreeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const pointsRef = useRef<any>(null);

  const getColorFromTemp = (temp: number): [number, number, number] => {
    if (temp < 18) return [0, 0, 255];     // azul
    if (temp < 24) return [0, 255, 0];     // verde
    if (temp < 30) return [255, 255, 0];   // amarillo
    return [255, 0, 0];                    // rojo
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    if (window.Potree && window.THREE) {
      initPotree();
      return;
    }

    // Cargar THREE primero
    const threeScript = document.createElement("script");
    threeScript.src = "https://cdn.jsdelivr.net/npm/three@0.168/build/three.min.js";
    threeScript.onload = () => {
      // Luego cargar Potree
      const potreeScript = document.createElement("script");
      potreeScript.src = "https://cdn.jsdelivr.net/npm/potree@1.8/build/potree/potree.js";
      potreeScript.onload = () => initPotree();
      document.body.appendChild(potreeScript);
    };
    document.body.appendChild(threeScript);

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdn.jsdelivr.net/npm/potree@1.8/build/potree/potree.css";
    document.head.appendChild(css);

    return () => {
      if (threeScript.parentNode) document.body.removeChild(threeScript);
      if (css.parentNode) document.head.removeChild(css);
    };
  }, []);

  const initPotree = () => {
    if (!containerRef.current) return;

    const viewer = new window.Potree.Viewer(containerRef.current, {
      useDefaultUI: false,
    });

    viewer.setEDLEnabled(true);
    viewer.setFOV(60);
    viewer.setPointBudget(2_000_000);
    viewer.loadGUI(() => {
      viewer.setLanguage('es');
    });

    // Cargar octree del salón (muy ligero, solo suelo y paredes)
    window.Potree.loadPointCloud(
      "/potree/salon/metadata.json",
      "salon",
      (e: any) => {
        const scene = e.pointcloud;
        const material = scene.material;
        material.size = 0.3;
        material.pointSizeType = window.Potree.PointSizeType.FIXED;
        material.shape = window.Potree.PointShape.CIRCLE;
        viewer.scene.addPointCloud(scene);

        viewer.fitToScreen();
        viewerRef.current = viewer;
      }
    );

    // Crear nuestros 4 puntos personalizados (sensores)
    createSensorPoints(viewer);
  };

  const createSensorPoints = (viewer: any) => {
    const THREE = window.THREE;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(4 * 3);
    const colors = new Float32Array(4 * 3);
    const sizes = new Float32Array(4);

    Object.entries(SENSOR_POSITIONS).forEach(([id], i) => {
      const [x, y, z] = SENSOR_POSITIONS[id];
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = z;  // Potree usa Y como altura
      positions[i * 3 + 2] = -y; // invertimos Y para orientación

      // Color inicial (gris)
      colors[i * 3 + 0] = 0.5;
      colors[i * 3 + 1] = 0.5;
      colors[i * 3 + 2] = 0.5;

      sizes[i] = 120; // tamaño grande
    });

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new window.Potree.PointsMaterial({
      size: 120,
      vertexColors: true,
      sizeType: window.Potree.PointSizeType.FIXED,
    });

    const points = new window.Potree.Points(geometry, material);
    points.frustumCulled = false;
    viewer.scene.pointclouds.push(points);
    viewer.scene.scene.add(points);

    pointsRef.current = points;

    // Click en sensores
    viewer.renderer.domElement.addEventListener("mousedown", (event: any) => {
      const THREE = window.THREE;
      const mouse = viewer.inputHandler.getNormalizedEventPosition(event);
      const camera = viewer.scene.getActiveCamera();
      const domElement = viewer.renderer.domElement;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      raycaster.params.Points.threshold = 0.5;

      const intersects = raycaster.intersectObject(points, true);
      if (intersects.length > 0) {
        const i = intersects[0].index;
        const sensorId = Object.keys(SENSOR_POSITIONS)[i];
        onSensorClick(sensorId);
      }
    });
  };

  // Actualizar colores en tiempo real
  useEffect(() => {
    if (!pointsRef.current || !latestData) return;

    const colors = pointsRef.current.geometry.attributes.color;
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
    <div className="w-full h-screen relative bg-gray-900">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg">
        <h3 className="text-xl font-bold">Monitoreo Salón - Potree 3D</h3>
        <p className="text-sm">Haz clic en los puntos para ver detalles</p>
      </div>
    </div>
  );
}