import { useEffect, useRef, useState } from "react";

interface PotreeLoaderProps {
  cloudUrl?: string; // URL de archivo LAZ/LAS en CloudFront
  onLoaded?: () => void;
}

/**
 * Componente que carga un archivo Potree (LAZ/LAS) desde CloudFront
 * y lo renderiza con Three.js + Potree
 */
export function PotreeLoader({ cloudUrl, onLoaded }: PotreeLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>("Iniciando...");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!containerRef.current) return;

    const initPotree = async () => {
      try {
        setStatus("Cargando librerías...");

        // 1. Esperar a que Three.js esté disponible
        if (!(window as any).THREE) {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/three@0.168/build/three.min.js";
          script.async = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        setStatus("Cargando Potree...");

        // 2. Cargar CSS de Potree
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/potree@1.8/build/potree/potree.css";
        document.head.appendChild(link);

        // 3. Cargar Potree
        const potreeScript = document.createElement("script");
        potreeScript.src = "https://cdn.jsdelivr.net/npm/potree@1.8/build/potree/potree.js";
        potreeScript.async = true;
        
        await new Promise<void>((resolve, reject) => {
          potreeScript.onload = () => {
            console.log("Potree cargado");
            resolve();
          };
          potreeScript.onerror = reject;
          document.head.appendChild(potreeScript);
        });

        setStatus("Inicializando viewer...");

        // Esperar un poco para asegurar que todo esté listo
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!(window as any).Potree) {
          throw new Error("Potree no se cargó correctamente");
        }

        // 4. Crear viewer
        const viewer = new (window as any).Potree.Viewer(containerRef.current);
        viewer.setEDLEnabled(true);
        viewer.setFOV(60);
        viewer.setPointBudget(1_000_000);
        viewer.setBackground("black");

        // Posicionar cámara
        viewer.scene.view.position.set(20, 15, 20);
        viewer.scene.view.lookAt(0, 0, 0);

        setStatus("Viewer listo");

        // 5. Si hay URL de nube de puntos, cargarla
        if (cloudUrl) {
          setStatus(`Cargando nube desde CloudFront: ${cloudUrl}`);
          try {
            const loader = new (window as any).Potree.POCLoader();
            const pointcloud = await new Promise<any>((resolve, reject) => {
              const timeout = setTimeout(
                () => reject(new Error("Timeout cargando nube")),
                120000
              );

              loader.load(
                cloudUrl,
                (cloud: any) => {
                  clearTimeout(timeout);
                  resolve(cloud);
                },
                (progress: any) => {
                  const percent = ((progress.loaded / progress.total) * 100).toFixed(1);
                  setStatus(`Cargando nube: ${percent}%`);
                },
                (error: any) => {
                  clearTimeout(timeout);
                  reject(error);
                }
              );
            });

            viewer.scene.addPointCloud(pointcloud);
            setStatus("✓ Nube de puntos cargada");
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`No se pudo cargar nube: ${msg}`);
            setStatus(`⚠ Nube no disponible: ${msg}`);
          }
        } else {
          setStatus("✓ Viewer listo (sin nube de puntos)");
        }

        onLoaded?.();
        setError("");

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Error inicializando Potree:", msg);
        setError(msg);
        setStatus(`Error: ${msg}`);
      }
    };

    initPotree();
  }, [cloudUrl, onLoaded]);

  return (
    <div className="w-full h-full flex flex-col">
      <div ref={containerRef} className="flex-1 bg-black relative" />
      
      {/* Panel de estado */}
      <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-sm">
        <p className="text-sm font-mono">{status}</p>
        {error && (
          <p className="text-red-400 text-xs mt-2">Error: {error}</p>
        )}
      </div>
    </div>
  );
}
