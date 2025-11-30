import { useEffect, useRef, useState } from "react";

/**
 * Componente simplificado que renderiza una escena 3D básica sin Potree
 * Útil para testing si Potree no funciona correctamente
 */
export function SimpleViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Inicializando...");

  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      try {
        // Cargar Three.js
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/three@0.168/build/three.min.js";
        script.async = true;
        document.head.appendChild(script);

        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("No se pudo cargar Three.js"));
        });

        if (!(window as any).THREE) {
          throw new Error("THREE no disponible después de cargar");
        }

        const THREE = (window as any).THREE;
        setStatus("Three.js cargado ✓");

        // Crear escena básica
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        const camera = new THREE.PerspectiveCamera(
          75,
          containerRef.current!.clientWidth / containerRef.current!.clientHeight,
          0.1,
          1000
        );
        camera.position.set(20, 15, 20);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(
          containerRef.current!.clientWidth,
          containerRef.current!.clientHeight
        );
        containerRef.current!.appendChild(renderer.domElement);

        // Crear geometría de puntos simples
        const geometry = new THREE.BufferGeometry();
        
        // Definir posiciones de sensores
        const positions = new Float32Array([
          -4, 2.5, 4,   // sensor-01
          4, 2.5, 4,    // sensor-02
          -4, 2.5, -4,  // sensor-03
          4, 2.5, -4,   // sensor-04
        ]);

        const colors = new Float32Array([
          0.8, 0.8, 0.8, // gris para sensor-01
          0.8, 0.8, 0.8, // gris para sensor-02
          0.8, 0.8, 0.8, // gris para sensor-03
          0.8, 0.8, 0.8, // gris para sensor-04
        ]);

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
          size: 10,
          vertexColors: true,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        // Añadir grid
        const gridHelper = new THREE.GridHelper(20, 10, 0x444444, 0x222222);
        scene.add(gridHelper);

        // Añadir axes
        const axesHelper = new THREE.AxesHelper(10);
        scene.add(axesHelper);

        setStatus("Escena 3D cargada ✓");

        // Render loop
        const animate = () => {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        animate();

        // Manejo de resize
        window.addEventListener("resize", () => {
          if (!containerRef.current) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        });

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Error:", msg);
        setStatus(`Error: ${msg}`);
      }
    };

    init();
  }, []);

  return (
    <div className="w-full h-screen flex flex-col relative bg-black">
      <div ref={containerRef} className="flex-1" />
      <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg">
        <h1 className="text-2xl font-bold">Visor 3D Simple</h1>
        <p className="text-sm mt-2">{status}</p>
      </div>
    </div>
  );
}
