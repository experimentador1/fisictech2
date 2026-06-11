'use client';

import { useEffect, useState } from 'react';
import { useExercisesStore, buildExercisePose } from '@/hooks/use-exercises-store';
import { APERTURA_BRAZOS_TEMPLATE, DEMO_IMAGE_URLS } from '@/lib/pilates/demo-exercise';
import { processImage, generateGifPreview, compressDataUrl } from '@/lib/mediapipe/image-processor';
import { v4 as uuidv4 } from 'uuid';

type SeedStatus = 'idle' | 'fetching' | 'processing' | 'done' | 'error';

// Flag a nivel de módulo: sobrevive al doble montaje de React StrictMode
// (un useRef se resetea entre montajes y permitía sembrar el demo dos veces)
let seedStarted = false;

/**
 * Siembra el ejercicio de demo de Pilates si no existe.
 * Si las poses tienen landmarks vacíos, descarga las imágenes de referencia
 * y las procesa con MediaPipe IMAGE mode para extraer landmarks reales.
 *
 * Muestra un banner de progreso discreto en la esquina inferior derecha
 * mientras procesa.
 */
export function ExerciseSeeder() {
  const [status, setStatus] = useState<SeedStatus>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (seedStarted) return;
    seedStarted = true;

    const run = async () => {
      // Leer estado FRESCO del store (no del closure del render)
      const store = useExercisesStore.getState();

      // Dedupe: eliminar copias del demo acumuladas por siembras repetidas.
      // Conservar la que tenga landmarks reales (o la más antigua si ninguna).
      const demos = store.exercises.filter(ex => ex.name === APERTURA_BRAZOS_TEMPLATE.name);
      const keep = demos.find(d => d.poses.some(p => p.landmarks.length > 0)) ?? demos[0];
      for (const d of demos) {
        if (keep && d.id !== keep.id) store.deleteExercise(d.id);
      }
      const existing = keep;

      // Si ya existe Y tiene landmarks reales → no hacer nada
      if (existing && existing.poses.some(p => p.landmarks.length > 0)) {
        setStatus('done');
        return;
      }

      setStatus('fetching');

      try {
        // Convertir las URLs públicas a dataUrls comprimidos para MediaPipe y storage
        const dataUrls: string[] = [];
        for (let i = 0; i < DEMO_IMAGE_URLS.length; i++) {
          const url = DEMO_IMAGE_URLS[i];
          const res = await fetch(url);
          const blob = await res.blob();
          const rawDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload  = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          // Comprimir para no exceder la cuota de localStorage
          dataUrls.push(await compressDataUrl(rawDataUrl));
          setProgress(Math.round(((i + 1) / DEMO_IMAGE_URLS.length) * 30));
        }

        setStatus('processing');

        // Procesar cada imagen con MediaPipe IMAGE mode
        const processedPoses = [];
        for (let i = 0; i < dataUrls.length; i++) {
          const dataUrl = dataUrls[i]!;
          const result  = await processImage(dataUrl);
          const template = APERTURA_BRAZOS_TEMPLATE.poses[i]!;

          processedPoses.push(buildExercisePose({
            id:             template.id ?? uuidv4(),
            order:          template.order,
            name:           template.name,
            description:    template.description,
            holdTime:       template.holdTime,
            repetitions:    template.repetitions,
            imageDataUrl:   dataUrl,
            landmarks:      result.landmarks,
            worldLandmarks: result.worldLandmarks,
            angles:         result.angles,
            tolerances:     template.tolerances,
            minVisibility:  template.minVisibility,
            detectedLandmarks: result.detectedLandmarks,
          }));

          setProgress(30 + Math.round(((i + 1) / dataUrls.length) * 60));
        }

        // Generar sprite animado
        const spriteUrl = await generateGifPreview(dataUrls);
        setProgress(95);

        if (existing) {
          // Actualizar ejercicio existente con landmarks reales
          store.updateExercise(existing.id, {
            poses:      processedPoses,
            gifDataUrl: spriteUrl,
          });
          console.info('[PoseFlow] Demo: landmarks actualizados con MediaPipe.');
        } else {
          // Crear ejercicio nuevo con datos reales
          store.addExercise({
            ...APERTURA_BRAZOS_TEMPLATE,
            poses:      processedPoses,
            gifDataUrl: spriteUrl,
          });
          console.info('[PoseFlow] Demo: ejercicio creado con landmarks reales.');
        }

        setProgress(100);
        setStatus('done');
      } catch (err) {
        console.warn('[PoseFlow] Demo seeder: no se pudo procesar con MediaPipe.', err);
        // Fallback: crear ejercicio sin landmarks (modo degradado)
        try {
          if (!existing) {
            store.addExercise(APERTURA_BRAZOS_TEMPLATE);
          }
        } catch {
          // QuotaExceededError u otro error de persistencia: no romper la app
        }
        setStatus('error');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Banner de progreso
  if (status === 'idle' || status === 'done') return null;

  if (status === 'error') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-amber-950/80 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-300 backdrop-blur-sm shadow-xl max-w-xs">
        <p className="font-semibold">Demo cargado en modo degradado</p>
        <p className="text-amber-400/70 mt-0.5">Los landmarks se generarán en el Módulo 1</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900/90 border border-white/[0.08] rounded-xl px-4 py-3 backdrop-blur-sm shadow-xl max-w-xs">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 shrink-0">
          <svg className="w-5 h-5 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {status === 'fetching' ? 'Cargando imágenes de demo...' : 'Procesando con MediaPipe...'}
          </p>
          <div className="mt-1.5 h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-500 shrink-0">{progress}%</span>
      </div>
    </div>
  );
}
