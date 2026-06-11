// ============================================================
// Tipos base de MediaPipe (re-exportados con nombres propios)
// ============================================================

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  presence?: number;
}

export interface WorldLandmark {
  x: number;
  y: number;
  z: number;
}

export interface PoseLandmarkerResult {
  landmarks: Landmark[][];
  worldLandmarks: WorldLandmark[][];
  segmentationMasks?: unknown[];
}

// ============================================================
// IDs de los 33 landmarks de MediaPipe
// ============================================================
export enum LandmarkId {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

// ============================================================
// Ángulos articulares calculados
// ============================================================
export interface JointAngles {
  rightElbow: number;
  leftElbow: number;
  rightShoulder: number;
  leftShoulder: number;
  rightKnee: number;
  leftKnee: number;
  rightHip: number;
  leftHip: number;
  trunk: number;
  rightAnkle: number;
  leftAnkle: number;
}

// ============================================================
// Tipos de feedback por articulación
// ============================================================
export type JointStatus = 'correct' | 'adjust' | 'incorrect' | 'invisible';

export interface JointFeedback {
  status: JointStatus;
  currentAngle: number;
  targetAngle: number;
  difference: number;
  score: number;
}

// ============================================================
// Evaluación completa de una pose
// ============================================================
export interface PoseEvaluation {
  overallScore: number;
  euclideanScore: number;
  angleScore: number;
  jointFeedback: Partial<Record<keyof JointAngles, JointFeedback>>;
  isDetected: boolean;
  timestamp: number;
}

// ============================================================
// Pose de referencia (creada por el maestro)
// ============================================================
export interface ReferencePose {
  id: string;
  name: string;
  description: string;
  category: 'pilates' | 'yoga' | 'stretching' | 'strength' | 'other';
  landmarks: Landmark[];
  worldLandmarks: WorldLandmark[];
  angles: Partial<JointAngles>;
  tolerances: Partial<JointAngles>;
  imageDataUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// ============================================================
// Sesión de evaluación
// ============================================================
export interface SessionFrame {
  timestamp: number;
  landmarks: Landmark[];
  evaluation: PoseEvaluation;
}

export interface EvaluationSession {
  id: string;
  referencePoseId: string;
  referencePoseName: string;
  studentId?: string;
  studentName?: string;
  frames: SessionFrame[];
  averageScore: number;
  duration: number;
  startedAt: string;
  endedAt?: string;
}

// ============================================================
// Estado del detector MediaPipe
// ============================================================
export type DetectorStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'detecting'
  | 'error';

export interface DetectorState {
  status: DetectorStatus;
  errorMessage?: string;
  fps: number;
  lastDetectionMs: number;
}

// ============================================================
// Configuración del detector
// ============================================================
export type ModelVariant = 'lite' | 'full' | 'heavy';
export type RunningMode = 'IMAGE' | 'VIDEO';

export interface DetectorConfig {
  modelVariant: ModelVariant;
  runningMode: RunningMode;
  numPoses: number;
  minPoseDetectionConfidence: number;
  minPosePresenceConfidence: number;
  minTrackingConfidence: number;
  useGpu: boolean;
}

export const DEFAULT_DETECTOR_CONFIG: DetectorConfig = {
  modelVariant: 'lite',   // más rápido y robusto con cuerpos parciales
  runningMode: 'VIDEO',
  numPoses: 1,
  minPoseDetectionConfidence: 0.35,  // umbral bajo para detectar incluso torso parcial
  minPosePresenceConfidence: 0.35,
  minTrackingConfidence: 0.35,
  useGpu: true,
};

// ============================================================
// URLs de modelos MediaPipe
// ============================================================
export const MODEL_URLS: Record<ModelVariant, string> = {
  lite: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
  full: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
  heavy:
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task',
};

export const WASM_CDN_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

// ============================================================
// Nombres descriptivos de joints para la UI
// ============================================================
export const JOINT_LABELS: Record<keyof JointAngles, string> = {
  rightElbow: 'Codo Derecho',
  leftElbow: 'Codo Izquierdo',
  rightShoulder: 'Hombro Derecho',
  leftShoulder: 'Hombro Izquierdo',
  rightKnee: 'Rodilla Derecha',
  leftKnee: 'Rodilla Izquierda',
  rightHip: 'Cadera Derecha',
  leftHip: 'Cadera Izquierda',
  trunk: 'Tronco',
  rightAnkle: 'Tobillo Derecho',
  leftAnkle: 'Tobillo Izquierdo',
};
