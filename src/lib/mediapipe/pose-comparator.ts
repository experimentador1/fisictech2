import {
  Landmark,
  JointAngles,
  JointFeedback,
  JointStatus,
  PoseEvaluation,
  ReferencePose,
} from '@/types/mediapipe';
import { PRECISION_THRESHOLD, ADJUST_THRESHOLD } from '@/types/poseflow';
import { extractJointAngles } from './angle-calculator';

// ============================================================
// Normalización de landmarks (invariante a escala y posición)
// ============================================================

/**
 * Normaliza los landmarks centrándolos en las caderas y escalando
 * por la longitud del torso. Permite comparar poses independientemente
 * de la distancia a la cámara o la estatura del usuario.
 */
export function normalizeLandmarks(landmarks: Landmark[]): Landmark[] {
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];

  if (!leftHip || !rightHip || !leftShoulder || !rightShoulder) {
    return landmarks;
  }

  const centerX = (leftHip.x + rightHip.x) / 2;
  const centerY = (leftHip.y + rightHip.y) / 2;
  const centerZ = (leftHip.z + rightHip.z) / 2;

  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;

  const torsoLength = Math.sqrt(
    (shoulderCenterX - centerX) ** 2 + (shoulderCenterY - centerY) ** 2
  );

  const scale = torsoLength > 0 ? torsoLength : 1;

  return landmarks.map(lm => ({
    ...lm,
    x: (lm.x - centerX) / scale,
    y: (lm.y - centerY) / scale,
    z: (lm.z - centerZ) / scale,
  }));
}

// ============================================================
// Similitud euclidiana (score holístico 0-100)
// ============================================================

/** IDs de landmarks corporales relevantes para pilates/yoga (excluye cara) */
const RELEVANT_LANDMARK_IDS = Array.from({ length: 22 }, (_, i) => i + 11);

export function euclideanSimilarity(
  pose1: Landmark[],
  pose2: Landmark[]
): number {
  const norm1 = normalizeLandmarks(pose1);
  const norm2 = normalizeLandmarks(pose2);

  let totalDistance = 0;
  let count = 0;

  for (const id of RELEVANT_LANDMARK_IDS) {
    const a = norm1[id];
    const b = norm2[id];
    if (!a || !b) continue;

    const vis = Math.min(a.visibility ?? 1, b.visibility ?? 1);
    if (vis < 0.5) continue;

    totalDistance += Math.sqrt(
      (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2
    );
    count++;
  }

  if (count === 0) return 0;
  const avgDistance = totalDistance / count;
  return Math.max(0, Math.min(100, (1 - avgDistance / 0.5) * 100));
}

// ============================================================
// Evaluación por ángulos articulares (feedback específico)
// ============================================================

export function evaluateJointAngles(
  userAngles: JointAngles,
  reference: ReferencePose
): {
  jointFeedback: Partial<Record<keyof JointAngles, JointFeedback>>;
  angleScore: number;
} {
  const jointFeedback: Partial<Record<keyof JointAngles, JointFeedback>> = {};
  let totalScore = 0;
  let count = 0;

  const refAngles = reference.angles as Record<string, number>;
  const tolerances = reference.tolerances as Record<string, number>;

  for (const [joint, targetAngle] of Object.entries(refAngles)) {
    const currentAngle = (userAngles as unknown as Record<string, number>)[joint];
    if (currentAngle === undefined || isNaN(currentAngle)) {
      (jointFeedback as Record<string, JointFeedback>)[joint] = {
        status: 'invisible' as JointStatus,
        currentAngle: 0,
        targetAngle: Math.round(targetAngle),
        difference: 0,
        score: 0,
      };
      continue;
    }

    const tolerance = tolerances[joint] ?? 15;
    const diff = Math.abs(currentAngle - targetAngle);

      // Escala inversa: tolerance → PRECISION_THRESHOLD; tolerance*2 → ADJUST_THRESHOLD
      const jointScore = Math.max(0, 100 - (diff / tolerance) * (100 - PRECISION_THRESHOLD) * (100 / PRECISION_THRESHOLD));

      let status: JointStatus;
      if (diff <= tolerance) status = 'correct';
      else if (diff <= tolerance * ((100 - ADJUST_THRESHOLD) / (100 - PRECISION_THRESHOLD))) status = 'adjust';
      else status = 'incorrect';

      totalScore += jointScore;
      count++;

      (jointFeedback as Record<string, JointFeedback>)[joint] = {
        status,
        currentAngle: Math.round(currentAngle),
        targetAngle: Math.round(targetAngle),
        difference: Math.round(diff),
        score: Math.round(jointScore),
      };
  }

  return {
    jointFeedback,
    angleScore: count > 0 ? Math.round(totalScore / count) : 0,
  };
}

// ============================================================
// Evaluación completa combinada
// ============================================================

export function evaluatePose(
  userLandmarks: Landmark[],
  reference: ReferencePose
): PoseEvaluation {
  const userAngles = extractJointAngles(userLandmarks);
  const { jointFeedback, angleScore } = evaluateJointAngles(
    userAngles,
    reference
  );

  const euclidean = euclideanSimilarity(userLandmarks, reference.landmarks);

  // Score final: 60% ángulos + 40% euclidiana
  const overallScore = Math.round(angleScore * 0.6 + euclidean * 0.4);

  return {
    overallScore,
    euclideanScore: Math.round(euclidean),
    angleScore,
    jointFeedback,
    isDetected: true,
    timestamp: performance.now(),
  };
}

// ============================================================
// Suavizado temporal del score (filtro EMA)
// ============================================================

export class ScoreSmoother {
  private alpha: number;
  private smoothedScore: number | null = null;

  constructor(alpha = 0.3) {
    this.alpha = alpha;
  }

  smooth(rawScore: number): number {
    if (this.smoothedScore === null) {
      this.smoothedScore = rawScore;
    } else {
      this.smoothedScore =
        this.alpha * rawScore + (1 - this.alpha) * this.smoothedScore;
    }
    return Math.round(this.smoothedScore);
  }

  reset(): void {
    this.smoothedScore = null;
  }
}
