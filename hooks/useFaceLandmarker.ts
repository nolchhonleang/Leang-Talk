import { useEffect, useState, useRef } from 'react';

export const useFaceLandmarker = (options: any = {}) => {
  const [landmarker, setLandmarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: any;
    
    const loadLandmarker = async () => {
      try {
        // Set a safety timeout (15s) to prevent infinite loading if WASM hangs
        timeoutId = setTimeout(() => {
            if (isMounted && isLoading) {
                console.warn("MediaPipe initialization timed out.");
                setError("Loading timed out. Please refresh or check connection.");
                setIsLoading(false);
            }
        }, 15000);

        // Use jsdelivr's ESM endpoint for better compatibility
        const vision = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/+esm");
        const { FaceLandmarker, FilesetResolver } = vision;

        if (!FaceLandmarker || !FilesetResolver) {
            throw new Error("Failed to extract FaceLandmarker from MediaPipe bundle");
        }

        const WASM_SRC = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
        const filesetResolver = await FilesetResolver.forVisionTasks(WASM_SRC);

        if (!isMounted) return;

        // Try initializing with GPU first
        try {
            console.log("Attempting GPU initialization...");
            const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
              baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
              },
              outputFaceBlendshapes: true,
              runningMode: "VIDEO",
              numFaces: 1
            });

            if (isMounted) {
                console.log("GPU initialization successful");
                landmarkerRef.current = faceLandmarker;
                setLandmarker(faceLandmarker);
                setIsLoading(false);
                clearTimeout(timeoutId);
            } else {
                faceLandmarker.close();
            }

        } catch (gpuError) {
            console.warn("GPU init failed, attempting fallback to CPU...", gpuError);
            
            if (!isMounted) return;

            // Fallback to CPU explicitly if GPU fails
            try {
                const cpuLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                  baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "CPU"
                  },
                  outputFaceBlendshapes: true,
                  runningMode: "VIDEO",
                  numFaces: 1
                });

                if (isMounted) {
                    console.log("CPU initialization successful");
                    landmarkerRef.current = cpuLandmarker;
                    setLandmarker(cpuLandmarker);
                    setIsLoading(false);
                    clearTimeout(timeoutId);
                } else {
                    cpuLandmarker.close();
                }
            } catch (cpuError: any) {
                throw new Error("Both GPU and CPU initialization failed: " + cpuError.message);
            }
        }

      } catch (err: any) {
        console.error("Error loading MediaPipe:", err);
        if (isMounted) {
            setError("Failed to load face tracking. " + (err.message || "Check connection."));
            setIsLoading(false);
            clearTimeout(timeoutId);
        }
      }
    };

    loadLandmarker();

    return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        if (landmarkerRef.current) {
            landmarkerRef.current.close();
        }
    }
  }, []);

  return { landmarker, isLoading, error };
};