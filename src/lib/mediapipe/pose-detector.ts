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
  // Dibujo de landmarks en canvas (esqueleto AR)
  // ============================================================

  /**
   * jointColors: mapa de índice de landmark → color CSS.
   * Si no se provee, usa colores por defecto.
   */
  drawLandmarks(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    landmarks: Landmark[][],
    jointColors?: Map<number, string>
  ): void {
    if (!this._PoseLandmarker) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const pl = this._PoseLandmarker as {
      POSE_CONNECTIONS: Array<{ start: number; end: number }>;
    };

    const W = canvas.width;
    const H = canvas.height;

    for (const lms of landmarks) {
      // ── Conexiones (líneas del esqueleto) ──────────────────
      for (const conn of pl.POSE_CONNECTIONS) {
        const a = lms[conn.start];
        const b = lms[conn.end];
        if (!a || !b) continue;
        if ((a.visibility ?? 1) < 0.3 || (b.visibility ?? 1) < 0.3) continue;

        const colorA = jointColors?.get(conn.start) ?? '#ffffff';
        const colorB = jointColors?.get(conn.end)   ?? '#ffffff';

        // Gradiente por segmento para transición de color entre articulaciones
        const grad = ctx.createLinearGradient(a.x * W, a.y * H, b.x * W, b.y * H);
        grad.addColorStop(0, colorA + 'cc');
        grad.addColorStop(1, colorB + 'cc');

        ctx.beginPath();
        ctx.moveTo(a.x * W, a.y * H);
        ctx.lineTo(b.x * W, b.y * H);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 2.5;
        ctx.shadowColor = colorA;
        ctx.shadowBlur  = 6;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // ── Puntos de landmarks ────────────────────────────────
      for (let i = 0; i < lms.length; i++) {
        const lm = lms[i];
        if (!lm || (lm.visibility ?? 1) < 0.3) continue;

        const x     = lm.x * W;
        const y     = lm.y * H;
        const color = jointColors?.get(i) ?? '#ffffff';
        const r     = i === 0 ? 6 : 4; // nariz ligeramente más grande

        // Círculo exterior (glow)
        ctx.beginPath();
        ctx.arc(x, y, r + 2, 0, Math.PI * 2);
        ctx.fillStyle = color + '33';
        ctx.fill();

        // Círculo interior
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur  = 8;
        ctx.fill();
      }

      ctx.shadowBlur = 0;
    }
  }

  // ============================================================
  // Loop automático de detección
  // ============================================================

  /**
   * getJointColors: función llamada cada frame que devuelve un mapa
   * de índice de landmark → color CSS según la evaluación en tiempo real.
   */
  startLoop(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    callback?: DetectionCallback,
    getJointColors?: () => Map<number, string>
  ): void {
    this.onDetection = callback ?? null;
    this.initializeDrawing(canvas);

    const loop = () => {
      const result = this.detectForVideo(video);

      if (result === null) {
        // Mismo frame de vídeo — no tocar el canvas para preservar el esqueleto AR previo
      } else if (result.landmarks.length > 0) {
        // Nueva detección con persona
        const colors = getJointColors?.();
        this.drawLandmarks(canvas, video, result.landmarks, colors);
        this.onDetection?.(result.landmarks, result.worldLandmarks);
      } else {
        // Nuevo frame pero sin persona detectada — mostrar video limpio y notificar
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        this.onDetection?.([], []);
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
