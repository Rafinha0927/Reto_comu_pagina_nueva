import { useEffect, useRef, useState } from "react";

const CLOUDFRONT_URL = "https://d2h8nqd60uagyp.cloudfront.net";
const POINTCLOUD_PATH = "/reto-comu-arreglado-main/reto-comu-arreglado-main/static";

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

declare global {
  interface Window {
    THREE: any;
    Potree: any;
    cloudConfig: any;
  }
}

export default function PotreeViewer({ latestData, onSensorClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Inicializando Potree...");
  const [error, setError] = useState("");
  const initialized = useRef(false);

  const getColorFromTemp = (temp: number): [number, number, number] => {
    if (temp < 18) return [0, 0, 255];
    if (temp < 24) return [0, 255, 0];
    if (temp < 30) return [255, 255, 0];
    return [255, 0, 0];
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const loadLib = (src: string, name: string) =>
      new Promise<void>((resolve, reject) => {
        setStatus(`Cargando ${name}...`);
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`No se pudo cargar ${name}`));
        document.head.appendChild(script);
      });

    const loadCSS = (href: string) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    };

    const init = async () => {
      try {
        // Cargar todos los CSS
        loadCSS(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/build/potree/potree.css`);
        loadCSS(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/jquery-ui/jquery-ui.min.css`);
        loadCSS(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/openlayers3/ol.css`);
        loadCSS(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/spectrum/spectrum.css`);
        loadCSS(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/jstree/themes/mixed/style.css`);

        // Cargar todas las librerías necesarias en orden
        setStatus("Cargando librerías base...");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/jquery/jquery-3.1.1.min.js`, "jQuery");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/spectrum/spectrum.js`, "Spectrum");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/jquery-ui/jquery-ui.min.js`, "jQueryUI");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/other/BinaryHeap.js`, "BinaryHeap");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/tween/tween.min.js`, "TWEEN");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/d3/d3.js`, "d3");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/proj4/proj4.js`, "proj4");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/openlayers3/ol.js`, "ol");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/i18next/i18next.js`, "i18next");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/jstree/jstree.js`, "jstree");

        // Cargar Three.js
        setStatus("Cargando Three.js...");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/three.js/build/three.min.js`, "THREE");

        // Cargar Potree y extras
        setStatus("Cargando Potree...");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/build/potree/potree.js`, "Potree");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/plasio/js/laslaz.js`, "LAS");
        await loadLib(`${CLOUDFRONT_URL}${POINTCLOUD_PATH}/libs/shapefile/shapefile.js`, "shapefile");

        // Esperar a que Potree esté disponible
        let attempts = 0;
        while (!window.Potree || !window.Potree.Viewer) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
          if (attempts > 100) throw new Error("Potree no se cargó");
        }

        if (!containerRef.current) {
          throw new Error("Container no disponible");
        }

        setStatus("Creando viewer...");
        const viewer = new window.Potree.Viewer(containerRef.current);
        viewer.setEDLEnabled(false);
        viewer.setFOV(60);
        viewer.setPointBudget(3_000_000);

        setStatus("Cargando nube de puntos...");
        const pointcloudUrl = `${CLOUDFRONT_URL}${POINTCLOUD_PATH}/pointclouds/lion_takanawa/cloud.js`;

        window.Potree.loadPointCloud(pointcloudUrl, "lion_takanawa", (e: any) => {
          try {
            const pointcloud = e.pointcloud;
            viewer.scene.addPointCloud(pointcloud);
            viewer.fitToScreen();

            // Crear sensores
            const sensorsGeometry = new window.THREE.BufferGeometry();
            const positions = new Float32Array(12);
            const colors = new Float32Array(12);

            Object.values(SENSOR_POSITIONS).forEach(([x, y, z], i) => {
              positions[i * 3] = x;
              positions[i * 3 + 1] = y;
              positions[i * 3 + 2] = z;
              colors[i * 3] = 0.8;
              colors[i * 3 + 1] = 0.8;
              colors[i * 3 + 2] = 0.8;
            });

            sensorsGeometry.setAttribute("position", new window.THREE.BufferAttribute(positions, 3));
            sensorsGeometry.setAttribute("color", new window.THREE.BufferAttribute(colors, 3));

            const sensorMaterial = new window.THREE.PointsMaterial({
              vertexColors: true,
              size: 15,
              sizeAttenuation: true,
            });

            const points = new window.THREE.Points(sensorsGeometry, sensorMaterial);
            viewer.scene.scene.add(points);

            (window as any).sensorData = { sensorsGeometry, colors, points, viewer };
            setStatus("✓ Escena 3D lista");

            // Click handlers para sensores
            viewer.renderer.domElement.addEventListener("click", (e: MouseEvent) => {
              const rect = viewer.renderer.domElement.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

              const raycaster = new window.THREE.Raycaster();
              raycaster.setFromCamera({ x, y }, viewer.scene.getActiveCamera());
              const intersects = raycaster.intersectObjects([points]);

              if (intersects.length > 0 && intersects[0].index !== undefined) {
                const sensorId = Object.keys(SENSOR_POSITIONS)[intersects[0].index];
                onSensorClick(sensorId);
              }
            });
          } catch (err) {
            console.error("Error creando sensores:", err);
            setError(`Error: ${err}`);
          }
        });

        setError("");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Error:", msg);
        setError(msg);
        setStatus(`Error: ${msg}`);
      }
    };

    init();
  }, [onSensorClick]);

  // Actualizar colores de sensores
  useEffect(() => {
    if (!(window as any).sensorData) return;

    const { colors } = (window as any).sensorData;
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
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute top-4 left-4 bg-black/80 text-white p-6 rounded-xl max-w-sm z-10">
        <h1 className="text-3xl font-bold mb-2">Monitoreo Salón 3D</h1>
        <p className="text-lg mb-4">Potree + 4 sensores en tiempo real</p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full"></div> Frío (&lt;18°C)
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full"></div> Normal (18-24°C)
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-yellow-500 rounded-full"></div> Calor (24-30°C)
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-red-500 rounded-full"></div> Muy caliente (&gt;30°C)
          </div>
        </div>
        {status && (
          <div className="mt-4 pt-4 border-t border-white/30">
            <p className="text-sm text-yellow-300">{status}</p>
          </div>
        )}
        {error && (
          <div className="mt-4 pt-4 border-t border-red-500 bg-red-900/30 p-3 rounded">
            <p className="text-sm text-red-300">⚠ {error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
