/**
 * Tipos de dominio de PoseFlow — Módulo 1 (Instructor) y Módulo 2 (Alumno)
 *
 * Umbral de precisión por defecto: 85 % (margen de error 15 %)
 */

import { Landmark, WorldLandmark, JointAngles } from './mediapipe';

// ============================================================
// Configuración global de precisión
// ============================================================

export const PRECISION_THRESHOLD = 85;   // % mínimo para "correcto"
export const ADJUST_THRESHOLD   = 70;    // % mínimo para "ajustar"
// < ADJUST_THRESHOLD → "incorrecto"

// Colores según score
export const SCORE_COLORS = {
  correct:   '#22c55e',   // green-500
  adjust:    '#eab308',   // yellow-500
  incorrect: '#ef4444',   // red-500
  invisible: '#6b7280',   // gray-500
} as const;

// ============================================================
// Pose individual (parte de un ejercicio)
// ============================================================

export interface ExercisePose {
  id: string;
  order: number;
  name: string;
  description?: string;
  /** Tiempo que el alumno debe mantener la pose (segundos) */
  holdTime: number;
  /** Número de repeticiones de la pose */
  repetitions: number;
  /** Imagen de referencia en base64 o URL */
  imageDataUrl?: string;
  /** 33 landmarks normalizados de MediaPipe */
  landmarks: Landmark[];
  worldLandmarks: WorldLandmark[];
  /** Ángulos articulares calculados de esta pose */
  angles: Partial<JointAngles>;
  /** Tolerancias por articulación en grados (default 15°) */
  tolerances: Partial<JointAngles>;
  /** Visibilidad mínima de landmarks para considerar la pose válida */
  minVisibility?: number;
  /** Número de landmarks con visibilidad >= minVisibility */
  detectedLandmarks?: number;
}

// ============================================================
// Ejercicio completo
// ============================================================

export type ExerciseCategory = 'pilates' | 'yoga' | 'stretching' | 'rehabilitation' | 'strength';
export type DifficultyLevel  = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  difficulty: DifficultyLevel;
  /** Tiempo de transición entre poses (segundos) */
  transitionTime: number;
  poses: ExercisePose[];
  /** GIF animado del ejercicio completo */
  gifDataUrl?: string;
  /** Creado por (nombre del instructor) */
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  /** true = publicado, false = borrador */
  published: boolean;
  /** Score mínimo para considerar una pose como correctamente ejecutada */
  precisionThreshold: number;
}

// ============================================================
// Evaluación de una pose durante sesión de alumno
// ============================================================

export interface PoseSessionResult {
  poseId: string;
  poseName: string;
  order: number;
  /** Score promedio durante el tiempo que se mantuvo la pose */
  averageScore: number;
  /** Score máximo alcanzado */
  maxScore: number;
  /** % del tiempo que la pose estuvo "correcta" (≥ threshold) */
  percentTimeCorrect: number;
  holdTimeSecs: number;
  /** Repeticiones completadas por el alumno */
  repetitionsDone: number;
  /** Repeticiones configuradas en el ejercicio */
  repetitionsTotal: number;
}

// ============================================================
// Sesión de práctica del alumno
// ============================================================

export type SessionStatus = 'idle' | 'countdown' | 'practicing' | 'transition' | 'completed';

export interface PracticeSession {
  id: string;
  exerciseId: string;
  exerciseName: string;
  studentName?: string;
  poseResults: PoseSessionResult[];
  /** Score global de la sesión (promedio ponderado de poses) */
  globalScore: number;
  durationSecs: number;
  startedAt: string;
  completedAt?: string;
  /** Mejor pose de la sesión */
  bestPose?: PoseSessionResult;
  /** Peor pose de la sesión */
  worstPose?: PoseSessionResult;
}

// ============================================================
// Estado en tiempo real del módulo de alumno
// ============================================================

export interface LiveSessionState {
  status: SessionStatus;
  currentPoseIndex: number;
  /** Repetición actual (1-based) */
  currentRepetition: number;
  currentPoseTimeLeft: number;
  transitionTimeLeft: number;
  currentScore: number;
  /** Scores acumulados del frame actual */
  frameScores: number[];
}

// ============================================================
// Resultado de procesamiento de imagen (Módulo 1)
// ============================================================

export interface ImageProcessingResult {
  imageDataUrl: string;
  landmarks: Landmark[];
  worldLandmarks: WorldLandmark[];
  angles: Partial<JointAngles>;
  detectedLandmarks: number;
  confidence: number;
  error?: string;
}
