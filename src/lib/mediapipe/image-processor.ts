'use client';

import { Landmark, WorldLandmark, MODEL_URLS, WASM_CDN_URL } from '@/types/mediapipe';
import { extractJointAngles } from './angle-calculator';
import { ImageProcessingResult } from '@/types/poseflow';

let poseLandmarker: unknown = null;
let isInitializing = false;

/**
 * Inicializa MediaPipe en modo IMAGE (singleton).
 * Se reutiliza entre llamadas para no recargar el modelo.
 */
async function getPoseLandmarker(): Promise<unknown> {
  if (poseLandmarker) return poseLandmarker;
  if (isInitializing) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return getPoseLandmarker();
  }

  isInitializing = true;

  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(WASM_CDN_URL);

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URLS['full'],
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  isInitializing = false;
  return poseLandmarker;
}

/**
 * Carga una imagen desde base64/URL en un HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Convierte un File de imagen a base64 data URL.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Re-encodea un data URL como JPEG reducido para no exceder la cuota
 * de localStorage (~5 MB). 640px de ancho es suficiente tanto para
 * MediaPipe como para los previews de la UI.
 */
export async function compressDataUrl(
  src: string,
  maxWidth = 640,
  quality = 0.72
): Promise<string> {
  try {
    const img = await loadImage(src);
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return src;

    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return src;
  }
}

/**
 * Procesa una imagen con MediaPipe y extrae landmarks + ángulos.
 * Retorna ImageProcessingResult completo.
 */
export async function processImage(
  imageDataUrl: string
): Promise<ImageProcessingResult> {
  try {
    const lm = await getPoseLandmarker() as {
      detect: (img: HTMLImageElement) => {
        landmarks: Landmark[][];
        worldLandmarks: WorldLandmark[][];
      };
    };

    const img = await loadImage(imageDataUrl);
    const result = lm.detect(img);

    if (!result.landmarks || result.landmarks.length === 0) {
      return {
        imageDataUrl,
        landmarks: [],
        worldLandmarks: [],
        angles: {},
        detectedLandmarks: 0,
        confidence: 0,
        error: 'No se detectó ninguna persona en la imagen.',
      };
    }

    const landmarks = result.landmarks[0]!;
    const worldLandmarks = (result.worldLandmarks[0] ?? []) as WorldLandmark[];

    const detectedCount = landmarks.filter(
      lmk => (lmk.visibility ?? 1) >= 0.5
    ).length;

    const avgVisibility =
      landmarks.reduce((sum, lmk) => sum + (lmk.visibility ?? 1), 0) /
      landmarks.length;

    const angles = extractJointAngles(landmarks, 0.4);

    return {
      imageDataUrl,
      landmarks,
      worldLandmarks,
      angles,
      detectedLandmarks: detectedCount,
      confidence: Math.round(avgVisibility * 100),
    };
  } catch (err) {
    return {
      imageDataUrl,
      landmarks: [],
      worldLandmarks: [],
      angles: {},
      detectedLandmarks: 0,
      confidence: 0,
      error: err instanceof Error ? err.message : 'Error desconocido al procesar imagen.',
    };
  }
}

/**
 * Procesa múltiples imágenes en secuencia.
 */
export async function processBatch(
  images: string[],
  onProgress?: (processed: number, total: number) => void
): Promise<ImageProcessingResult[]> {
  const results: ImageProcessingResult[] = [];
  for (let i = 0; i < images.length; i++) {
    const r = await processImage(images[i]!);
    results.push(r);
    onProgress?.(i + 1, images.length);
  }
  return results;
}

/**
 * Genera una animación de preview a partir de una secuencia de imágenes.
 *
 * Estrategia: dibuja todos los frames en un canvas horizontal (sprite sheet),
 * exporta como PNG y devuelve también el ancho de cada frame para que
 * la UI pueda animar via CSS background-position-x.
 *
 * El string retornado sigue siendo un dataUrl único (del primer frame) para
 * compatibilidad con el campo gifDataUrl del Exercise. La animación real
 * se hace con useAnimatedPreview() cuando hay más de un frame.
 */
export async function generateGifPreview(
  images: string[],
  frameWidth = 320,
  frameHeight = 240
): Promise<string> {
  if (images.length === 0) return '';
  if (images.length === 1) return images[0]!;

  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width  = frameWidth  * images.length;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(images[0]!); return; }

    let loaded = 0;
    images.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, i * frameWidth, 0, frameWidth, frameHeight);
        loaded++;
        if (loaded === images.length) {
          // Prefijamos el ancho de frame para que la UI pueda animarlo
          // Formato: "sprite:<frameWidth>:<dataUrl>"
          // JPEG en lugar de PNG: ~10x menos peso en localStorage
          const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
          resolve(`sprite:${frameWidth}:${images.length}:${dataUrl}`);
        }
      };
      img.onerror = () => {
        loaded++;
        if (loaded === images.length) resolve(images[0]!);
      };
      img.src = src;
    });
  });
}
