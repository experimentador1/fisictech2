'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PoseDetector } from '@/lib/mediapipe/pose-detector';
import { evaluatePose, ScoreSmoother } from '@/lib/mediapipe/pose-comparator';
import { buildJointColorMap } from '@/lib/mediapipe/joint-color-map';
import {
  DetectorConfig,
  DetectorStatus,
  Landmark,
  PoseEvaluation,
  ReferencePose,
} from '@/types/mediapipe';

export interface UsePoseDetectorReturn {
  detectorStatus: DetectorStatus;
  errorMessage: string | null;
  fps: number;
  currentLandmarks: Landmark[] | null;
  currentEvaluation: PoseEvaluation | null;
  initialize: () => Promise<void>;
  startDetection: (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    reference?: ReferencePose
  ) => void;
  /** Actualiza la pose de referencia sin reiniciar el loop de detección */
  updateReference: (reference: ReferencePose | undefined) => void;
  stopDetection: () => void;
  captureCurrentPose: () => Landmark[] | null;
  destroy: () => void;
}

export function usePoseDetector(
  config?: Partial<DetectorConfig>
): UsePoseDetectorReturn {
  const detectorRef      = useRef<PoseDetector | null>(null);
  const smootherRef      = useRef(new ScoreSmoother(0.3));
  const lastLandmarksRef = useRef<Landmark[] | null>(null);
  const referenceRef     = useRef<ReferencePose | undefined>(undefined);
  const evaluationRef    = useRef<PoseEvaluation | null>(null);

  const [detectorStatus, setDetectorStatus] = useState<DetectorStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [currentLandmarks, setCurrentLandmarks] = useState<Landmark[] | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<PoseEvaluation | null>(null);

  // Intervalo para actualizar FPS en la UI
  useEffect(() => {
    const interval = setInterval(() => {
      if (detectorRef.current) {
        setFps(detectorRef.current.currentFps);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Flag en ref para evitar stale closures de detectorStatus
  const isInitializedRef = useRef(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const initialize = useCallback(async () => {
    // Evitar doble inicialización si ya hay una en curso
    if (initPromiseRef.current) return initPromiseRef.current;

    const doInit = async () => {
      try {
        setDetectorStatus('loading');
        setErrorMessage(null);

        detectorRef.current = new PoseDetector(config);
        await detectorRef.current.initialize();
        smootherRef.current.reset();

        isInitializedRef.current = true;
        setDetectorStatus('ready');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al inicializar MediaPipe';
        setErrorMessage(msg);
        setDetectorStatus('error');
        initPromiseRef.current = null;
        throw err;
      }
    };

    initPromiseRef.current = doInit();
    return initPromiseRef.current;
  }, [config]);

  const startDetection = useCallback(
    (
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      reference?: ReferencePose
    ) => {
      // Verificar el detector directamente (no estado React, que puede estar stale)
      if (!detectorRef.current || !isInitializedRef.current) return;

      // Si ya había un loop corriendo (p.ej. video remontado), detenerlo primero
      detectorRef.current.stopLoop();

      // Solo sobrescribir la referencia si se pasa explícitamente.
      // updateReference() puede haberla establecido ANTES de que la cámara
      // estuviera lista; pasarle undefined aquí la borraría y la primera
      // pose quedaría sin evaluación.
      if (reference !== undefined) {
        referenceRef.current = reference;
      }
      smootherRef.current.reset();
      setDetectorStatus('detecting');

      detectorRef.current.startLoop(
        video,
        canvas,
        (landmarksArr, _worldLandmarks) => {
          const lms = landmarksArr[0];

          if (!lms) {
            // Sin persona detectada en este frame
            lastLandmarksRef.current = null;
            setCurrentLandmarks(null);
            const noPersonEval: import('@/types/mediapipe').PoseEvaluation = {
              overallScore: 0,
              euclideanScore: 0,
              angleScore: 0,
              jointFeedback: {},
              isDetected: false,
              timestamp: performance.now(),
            };
            evaluationRef.current = noPersonEval;
            setCurrentEvaluation(noPersonEval);
            return;
          }

          lastLandmarksRef.current = lms;
          setCurrentLandmarks(lms);

          if (referenceRef.current) {
            const evaluation = evaluatePose(lms, referenceRef.current);
            evaluation.overallScore = smootherRef.current.smooth(
              evaluation.overallScore
            );
            evaluationRef.current = evaluation;
            setCurrentEvaluation(evaluation);
          }
        },
        // getter de colores llamado cada frame (sin re-render)
        () => buildJointColorMap(evaluationRef.current)
      );
    },
    []
  );

  const updateReference = useCallback((reference: ReferencePose | undefined) => {
    referenceRef.current = reference;
    // Resetear suavizador para evitar arrastre del score anterior
    smootherRef.current.reset();
    if (!reference) setCurrentEvaluation(null);
  }, []);

  const stopDetection = useCallback(() => {
    detectorRef.current?.stopLoop();
    smootherRef.current.reset();
    setDetectorStatus('ready');
    setCurrentEvaluation(null);
  }, []);

  const captureCurrentPose = useCallback((): Landmark[] | null => {
    return lastLandmarksRef.current;
  }, []);

  const destroy = useCallback(() => {
    detectorRef.current?.destroy();
    detectorRef.current = null;
    isInitializedRef.current = false;
    initPromiseRef.current = null;
    setDetectorStatus('idle');
  }, []);

  return {
    detectorStatus,
    errorMessage,
    fps,
    currentLandmarks,
    currentEvaluation,
    initialize,
    startDetection,
    updateReference,
    stopDetection,
    captureCurrentPose,
    destroy,
  };
}
