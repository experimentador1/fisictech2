'use client';

import {
  DetectorConfig,
  DetectorState,
  Landmark,
  MODEL_URLS,
  WASM_CDN_URL,
  DEFAULT_DETECTOR_CONFIG,
} from '@/types/mediapipe';

type DetectionCallback = (landmarks: Landmark[][], worldLandmarks: Landmark[][]) => void;

// ============================================================
// Clase principal del detector de poses
// ============================================================

export class PoseDetector {
  private poseLandmarker: unknown = null;
  private drawingUtils: unknown = null;
  private config: DetectorConfig;
  private lastVideoTime = -1;
  private animationFrameId: number | null = null;
  private onDetection: DetectionCallback | null = null;

  // FPS tracking
  private frameCount = 0;
  private fpsStartTime = performance.now();
  public currentFps = 0;

  constructor(config: Partial<DetectorConfig> = {}) {
    this.config = { ...DEFAULT_DETECTOR_CONFIG, ...config };
  }

  // ============================================================
  // Inicialización asíncrona de MediaPipe
  // ============================================================

  async initialize(): Promise<void> {
    const { FilesetResolver, PoseLandmarker, DrawingUtils } = await import(
      '@mediapipe/tasks-vision'
    );

    const vision = await FilesetResolver.forVisionTasks(WASM_CDN_URL);

    this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URLS[this.config.modelVariant],
        delegate: this.config.useGpu ? 'GPU' : 'CPU',
      },
      runningMode: this.config.runningMode,
      numPoses: this.config.numPoses,
      minPoseDetectionConfidence: this.config.minPoseDetectionConfidence,
      minPosePresenceConfidence: this.config.minPosePresenceConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence,
    });

    // DrawingUtils solo necesita ser instanciado con un canvas ctx
    this._DrawingUtils = DrawingUtils;
    this._PoseLandmarker = PoseLandmarker;
  }

  private _DrawingUtils: unknown = null;
  private _PoseLandmarker: unknown = null;

  initializeDrawing(canvas: HTMLCanvasElement): void {
    if (!this._DrawingUtils) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.drawingUtils = new (this._DrawingUtils as { new(ctx: CanvasRenderingContext2D): unknown })(ctx);
  }

  // ============================================================
  // Detección en tiempo real (LIVE_STREAM / VIDEO)
  // ============================================================

  detectForVideo(video: HTMLVideoElement): {
    landmarks: Landmark[][];
    worldLandmarks: Landmark[][];
  } | null {
    if (!this.poseLandmarker || video.currentTime === this.lastVideoTime) {
      return null;
    }

    this.lastVideoTime = video.currentTime;
    const landmarker = this.poseLandmarker as {
      detectForVideo: (video: HTMLVideoElement, ts: number) => {
        landmarks: Landmark[][];
        worldLandmarks: Landmark[][];
      };
    };

    const result = landmarker.detectForVideo(video, performance.now());
    this.updateFps();
    return result;
  }

  // ============================================================
  // Dibujo de landmarks en canvas
  // ============================================================

  drawLandmarks(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    landmarks: Landmark[][],
    feedback?: Map<number, string>
  ): void {
    if (!this.drawingUtils || !this._PoseLandmarker) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const pl = this._PoseLandmarker as { POSE_CONNECTIONS: unknown };
    const du = this.drawingUtils as {
      drawLandmarks: (lms: Landmark[], opts: unknown) => void;
      drawConnectors: (lms: Landmark[], conns: unknown, opts: unknown) => void;
    };

    for (const lms of landmarks) {
      du.drawConnectors(lms, pl.POSE_CONNECTIONS, {
        color: 'rgba(255, 255, 255, 0.6)',
        lineWidth: 2,
      });

      du.drawLandmarks(lms, {
        radius: 4,
        color: feedback ? '#00FF00' : '#FF0000',
      });
    }
  }

  // ============================================================
  // Loop automático de detección
  // ============================================================

  startLoop(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    callback?: DetectionCallback
  ): void {
    this.onDetection = callback ?? null;
    this.initializeDrawing(canvas);

    const loop = () => {
      const result = this.detectForVideo(video);
      if (result && result.landmarks.length > 0) {
        this.drawLandmarks(canvas, video, result.landmarks);
        this.onDetection?.(result.landmarks, result.worldLandmarks);
      } else {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  stopLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // ============================================================
  // Captura de una sola pose (modo IMAGE)
  // ============================================================

  async captureFromImage(imageElement: HTMLImageElement): Promise<{
    landmarks: Landmark[][];
    worldLandmarks: Landmark[][];
  } | null> {
    if (!this.poseLandmarker) return null;

    const lm = this.poseLandmarker as {
      detect: (img: HTMLImageElement) => {
        landmarks: Landmark[][];
        worldLandmarks: Landmark[][];
      };
    };

    return lm.detect(imageElement);
  }

  // ============================================================
  // Utilidades
  // ============================================================

  private updateFps(): void {
    this.frameCount++;
    const elapsed = performance.now() - this.fpsStartTime;
    if (elapsed >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.fpsStartTime = performance.now();
    }
  }

  getState(): DetectorState {
    return {
      status: this.poseLandmarker ? 'ready' : 'idle',
      fps: this.currentFps,
      lastDetectionMs: 0,
    };
  }

  destroy(): void {
    this.stopLoop();
    const lm = this.poseLandmarker as { close?: () => void } | null;
    lm?.close?.();
    this.poseLandmarker = null;
    this.drawingUtils = null;
  }
}
