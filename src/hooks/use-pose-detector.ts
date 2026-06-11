'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PoseDetector } from '@/lib/mediapipe/pose-detector';
import { evaluatePose, ScoreSmoother } from '@/lib/mediapipe/pose-comparator';
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
  stopDetection: () => void;
  captureCurrentPose: () => Landmark[] | null;
  destroy: () => void;
}

export function usePoseDetector(
  config?: Partial<DetectorConfig>
): UsePoseDetectorReturn {
  const detectorRef = useRef<PoseDetector | null>(null);
  const smootherRef = useRef(new ScoreSmoother(0.3));
  const lastLandmarksRef = useRef<Landmark[] | null>(null);
  const referenceRef = useRef<ReferencePose | undefined>(undefined);

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

  const initialize = useCallback(async () => {
    try {
      setDetectorStatus('loading');
      setErrorMessage(null);

      detectorRef.current = new PoseDetector(config);
      await detectorRef.current.initialize();
      smootherRef.current.reset();

      setDetectorStatus('ready');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al inicializar MediaPipe';
      setErrorMessage(msg);
      setDetectorStatus('error');
    }
  }, [config]);

  const startDetection = useCallback(
    (
      video: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      reference?: ReferencePose
    ) => {
      if (!detectorRef.current || detectorStatus !== 'ready') return;
      referenceRef.current = reference;
      setDetectorStatus('detecting');

      detectorRef.current.startLoop(
        video,
        canvas,
        (landmarksArr, _worldLandmarks) => {
          const lms = landmarksArr[0];
          if (!lms) return;

          lastLandmarksRef.current = lms;
          setCurrentLandmarks(lms);

          if (referenceRef.current) {
            const evaluation = evaluatePose(lms, referenceRef.current);
            evaluation.overallScore = smootherRef.current.smooth(
              evaluation.overallScore
            );
            setCurrentEvaluation(evaluation);
          }
        }
      );
    },
    [detectorStatus]
  );

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
    stopDetection,
    captureCurrentPose,
    destroy,
  };
}
