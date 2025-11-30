import { useEffect, useRef, useState } from "react";

// URLs de CloudFront para los archivos que ya están en tu S3
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
  }
}

export default function PotreeViewer({ latestData, onSensorClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Inicializando Potree...");
  const [error, setError] = useState("");
  const initialized = useRef(false);

  const getColorFromTemp = (temp: number): [number, number, number] => {
    if (temp < 18) return [0, 0, 255]; // Azul
    if (temp < 24) return [0, 255, 0]; // Verde
    if (temp < 30) return [255, 255, 0]; // Amarillo
    return [255, 0, 0]; // Rojo
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initPotree = async () => {
      try {
        setStatus("⏳ Esperando Potree...");
        
        // Esperar a que Potree esté disponible
        let attempts = 0;
        while (!window.Potree && attempts < 100) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }

        if (!window.Potree) {
          throw new Error("Potree no se cargó. Verifica la consola.");
        }

        setStatus("✓ Potree cargado. Inicializando escena...";
        
        if (!containerRef.current) {
          throw new Error("Container no disponible");
        }

        // Crear escena con Three.js
        const scene = new window.THREE.Scene();
        const camera = new window.THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        const renderer = new window.THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000);
        containerRef.current.appendChild(renderer.domElement);

        camera.position.set(20, 15, 20);
        camera.lookAt(0, 0, 0);

        // Cargar nube de puntos
        setStatus("📦 Cargando nube de puntos...";
        const pointcloudUrl = `${CLOUDFRONT_URL}${POINTCLOUD_PATH}/pointclouds/lion_takanawa/cloud.js`;

        window.Potree.loadPointCloud(pointcloudUrl, "lion_takanawa", (e) => {
          try {
            const pointcloud = e.pointcloud;
            scene.add(pointcloud);
            
            // Actualizar cámara
            const boundingBox = pointcloud.boundingBox;
            const center = boundingBox.getCenter(new window.THREE.Vector3());
            const size = boundingBox.getSize(new window.THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            
            camera.position.set(center.x + cameraZ, center.y + cameraZ/2, center.z + cameraZ);
            camera.lookAt(center);

            setStatus("✓ Escena 3D lista con nube de puntos");

            // Crear sensores
            const geometry = new window.THREE.BufferGeometry();
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

            geometry.setAttribute("position", new window.THREE.BufferAttribute(positions, 3));
            geometry.setAttribute("color", new window.THREE.BufferAttribute(colors, 3));

            const material = new window.THREE.PointsMaterial({
              vertexColors: true,
              size: 10,
              sizeAttenuation: true,
            });

            const points = new window.THREE.Points(geometry, material);
            scene.add(points);

            (window as any).sensorData = { geometry, colors, points, scene, camera };

            // Render loop
            const animate = () => {
              requestAnimationFrame(animate);
              renderer.render(scene, camera);
            };
            animate();

            // Manejar clicks en sensores
            renderer.domElement.addEventListener("click", (e: MouseEvent) => {
              const rect = renderer.domElement.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

              const raycaster = new window.THREE.Raycaster();
              raycaster.setFromCamera({ x, y }, camera);
              const intersects = raycaster.intersectObjects([points]);

              if (intersects.length > 0) {
                const idx = intersects[0].index;
                if (idx !== undefined) {
                  const sensorId = Object.keys(SENSOR_POSITIONS)[idx];
                  onSensorClick(sensorId);
                }
              }
            });
          } catch (err) {
            console.error("Error al cargar nube de puntos:", err);
            setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
          }
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Error:", msg);
        setError(msg);
        setStatus(`Error: ${msg}`);
      }
    };

    initPotree();
  }, [onSensorClick]);

  // Actualizar colores de sensores con datos en tiempo real
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
      <div ref={containerRef} className="absolute inset-0 bg-black" />
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
