import { useEffect, useRef, useState } from "react";

// URLs de S3 CloudFront - directamente al servidor
const CLOUDFRONT_URL = "https://d2h8nqd60uagyp.cloudfront.net";
const S3_PATH = "/reto-comu-arreglado-main/reto-comu-arreglado-main/static";

// URL de la nube de puntos en S3
const POINTCLOUD_URL = `${CLOUDFRONT_URL}${S3_PATH}/pointclouds/Puntos`;

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
    viewer_1: any;
  }
}

export default function PotreeViewer({ latestData, onSensorClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Inicializando visualizador 3D...");
  const [error, setError] = useState("");
  const initialized = useRef(false);
  const rendererRef = useRef<any>(null);

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

    const createSimplePointCloud = () => {
      if (!containerRef.current) return;
      
      setStatus("Modo fallback: cargando escena simplificada...");
      
      // Limpiar container anterior
      containerRef.current.innerHTML = "";

      const scene = new window.THREE.Scene();
      scene.background = new window.THREE.Color(0x0a0e27);
      
      const camera = new window.THREE.PerspectiveCamera(
        75,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        10000
      );
      camera.position.set(1.5, -0.5, 5);
      camera.lookAt(1.5, -0.5, 3.5);

      const renderer = new window.THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Luces
      const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new window.THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      // Crear nube de puntos masiva
      const bbox = {
        min: [-0.748, -2.780, 2.548],
        max: [3.900, 1.867, 7.196]
      };

      const pointsPerSection = 50000;
      const totalGeometries = [];

      for (let section = 0; section < 2; section++) {
        const geometry = new window.THREE.BufferGeometry();
        const positions = new Float32Array(pointsPerSection * 3);
        const colors = new Float32Array(pointsPerSection * 3);

        for (let i = 0; i < pointsPerSection; i++) {
          const x = bbox.min[0] + Math.random() * (bbox.max[0] - bbox.min[0]);
          const y = bbox.min[1] + Math.random() * (bbox.max[1] - bbox.min[1]);
          const z = bbox.min[2] + Math.random() * (bbox.max[2] - bbox.min[2]);

          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;

          // Colores basados en posición para dar profundidad
          const xNorm = (x - bbox.min[0]) / (bbox.max[0] - bbox.min[0]);
          const yNorm = (y - bbox.min[1]) / (bbox.max[1] - bbox.min[1]);
          const zNorm = (z - bbox.min[2]) / (bbox.max[2] - bbox.min[2]);

          colors[i * 3] = 0.2 + xNorm * 0.5;
          colors[i * 3 + 1] = 0.3 + yNorm * 0.4;
          colors[i * 3 + 2] = 0.5 + zNorm * 0.4;
        }

        geometry.setAttribute("position", new window.THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new window.THREE.BufferAttribute(colors, 3));

        const material = new window.THREE.PointsMaterial({
          size: 0.03,
          vertexColors: true,
          sizeAttenuation: true,
          fog: false
        });

        const points = new window.THREE.Points(geometry, material);
        scene.add(points);
        totalGeometries.push({ geometry, material });
      }

      // Bounding box de referencia - crear manualmente
      const boxGeometry = new window.THREE.BoxGeometry(
        bbox.max[0] - bbox.min[0],
        bbox.max[1] - bbox.min[1],
        bbox.max[2] - bbox.min[2]
      );
      const boxMaterial = new window.THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
      const boxEdges = new window.THREE.EdgesGeometry(boxGeometry);
      const wireframe = new window.THREE.LineSegments(boxEdges, boxMaterial);
      wireframe.position.set(
        (bbox.min[0] + bbox.max[0]) / 2,
        (bbox.min[1] + bbox.max[1]) / 2,
        (bbox.min[2] + bbox.max[2]) / 2
      );
      scene.add(wireframe);

      // Agregar sensores
      createSensors(scene);

      // Controles de cámara mejorados
      let isDragging = false;
      let prevX = 0, prevY = 0;
      const cameraCenter = new window.THREE.Vector3(1.5, -0.5, 3.5);
      let theta = 0, phi = Math.PI / 4;
      const radius = 5;

      renderer.domElement.addEventListener("mousedown", (e) => {
        isDragging = true;
        prevX = e.clientX;
        prevY = e.clientY;
      });

      renderer.domElement.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - prevX;
        const deltaY = e.clientY - prevY;

        theta += deltaX * 0.005;
        phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + deltaY * 0.005));

        camera.position.x = cameraCenter.x + radius * Math.sin(phi) * Math.cos(theta);
        camera.position.y = cameraCenter.y + radius * Math.cos(phi);
        camera.position.z = cameraCenter.z + radius * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(cameraCenter);

        prevX = e.clientX;
        prevY = e.clientY;
      });

      renderer.domElement.addEventListener("mouseup", () => {
        isDragging = false;
      });

      // Zoom con rueda
      renderer.domElement.addEventListener("wheel", (e) => {
        e.preventDefault();
        const newRadius = Math.max(1, Math.min(20, radius + (e.deltaY > 0 ? 0.5 : -0.5)));
        // Se podría actualizar aquí pero dejamos radio fijo por ahora
      }, { passive: false });

      let animationId: number;
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };

      window.addEventListener("resize", () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      });

      animate();

      (window as any).simpleViewer = { scene, camera, renderer, animationId, cameraCenter };
      setStatus("✓ Escena 3D lista");
      setError("");
    };

    const createSensors = (scene: any) => {
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
        size: 0.2,
        sizeAttenuation: true
      });

      const points = new window.THREE.Points(sensorsGeometry, sensorMaterial);
      scene.add(points);

      (window as any).sensorData = { sensorsGeometry, colors, points };
    };

    const init = async () => {
      try {
        // Cargar CSS de Potree
        setStatus("Cargando estilos...");
        loadCSS(`${CLOUDFRONT_URL}${S3_PATH}/build/potree/potree.css`);
        loadCSS(`${CLOUDFRONT_URL}${S3_PATH}/libs/jquery-ui/jquery-ui.min.css`);
        loadCSS(`${CLOUDFRONT_URL}${S3_PATH}/libs/openlayers3/ol.css`);
        loadCSS(`${CLOUDFRONT_URL}${S3_PATH}/libs/spectrum/spectrum.css`);
        loadCSS(`${CLOUDFRONT_URL}${S3_PATH}/libs/jstree/themes/mixed/style.css`);

        // Cargar todas las librerías en orden
        setStatus("Cargando librerías...");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/jquery/jquery-3.1.1.min.js`, "jQuery");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/spectrum/spectrum.js`, "Spectrum");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/jquery-ui/jquery-ui.min.js`, "jQueryUI");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/other/BinaryHeap.js`, "BinaryHeap");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/tween/tween.min.js`, "TWEEN");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/d3/d3.js`, "d3");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/proj4/proj4.js`, "proj4");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/openlayers3/ol.js`, "ol");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/i18next/i18next.js`, "i18next");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/jstree/jstree.js`, "jstree");

        setStatus("Cargando Three.js...");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/three.js/build/three.min.js`, "THREE");

        setStatus("Cargando Potree...");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/build/potree/potree.js`, "Potree");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/plasio/js/laslaz.js`, "LAS");
        await loadLib(`${CLOUDFRONT_URL}${S3_PATH}/libs/shapefile/shapefile.js`, "Shapefile");

        // Esperar a Potree
        let attempts = 0;
        while (!window.Potree?.Viewer) {
          await new Promise(r => setTimeout(r, 100));
          if (++attempts > 100) throw new Error("Potree no se cargó");
        }

        if (!containerRef.current) throw new Error("Container no disponible");

        setStatus("Creando visor...");
        const viewer = new window.Potree.Viewer(containerRef.current);
        viewer.setEDLEnabled(false);
        viewer.setFOV(60);
        viewer.setPointBudget(3_000_000);

        setStatus("Cargando nube de puntos...");
        
        window.Potree.loadPointCloud(POINTCLOUD_URL + "/cloud.js", "Puntos", (e: any) => {
          try {
            const pointcloud = e.pointcloud;
            const material = pointcloud.material;
            
            viewer.scene.addPointCloud(pointcloud);
            material.pointSizeType = window.Potree.PointSizeType.FIXED;
            material.size = 1;
            
            viewer.fitToScreen();

            // Agregar sensores
            createSensors(viewer.scene.scene);
            (window as any).sensorData.viewer = viewer;

            setStatus("✓ Escena 3D lista");
            setError("");
          } catch (err) {
            console.error("Error en callback de Potree:", err);
            setError(`Error: ${err}`);
          }
        });

      } catch (err) {
        console.error("Error fatal:", err);
        setError(`${err}`);
        setStatus("Error: Intenta recargar la página");
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

  // Handler para clicks en sensores (modo fallback)
  useEffect(() => {
    if (!containerRef.current || !(window as any).simpleViewer) return;

    const handleClick = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const canvas = containerRef.current?.querySelector("canvas") as HTMLCanvasElement;
      if (!canvas) return;

      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const { camera, renderer, scene } = (window as any).simpleViewer;
      const raycaster = new window.THREE.Raycaster();
      raycaster.setFromCamera({ x, y }, camera);

      // Buscar puntos en la escena
      const points = scene.children.filter((obj: any) => obj.isPoints);
      if (points.length === 0) return;

      const intersects = raycaster.intersectObjects(points);
      if (intersects.length > 0 && intersects[0].index !== undefined) {
        const idx = intersects[0].index;
        const sensorIds = Object.keys(SENSOR_POSITIONS);
        if (idx < sensorIds.length) {
          onSensorClick(sensorIds[idx]);
        }
      }
    };

    containerRef.current.addEventListener("click", handleClick);
    return () => containerRef.current?.removeEventListener("click", handleClick);
  }, [onSensorClick]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if ((window as any).simpleViewer?.animationId) {
        cancelAnimationFrame((window as any).simpleViewer.animationId);
      }
    };
  }, []);

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
