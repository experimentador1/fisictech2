/**
 * Convierte el jointFeedback de una PoseEvaluation en un mapa de
 * índice de landmark → color CSS para el esqueleto AR.
 *
 * Colores:
 *  Verde  (#22c55e) → correcto  (≥ PRECISION_THRESHOLD)
 *  Amarillo (#eab308) → ajustar (≥ ADJUST_THRESHOLD)
 *  Rojo   (#ef4444) → incorrecto
 *  Blanco (#ffffff) → landmark sin evaluación (cara, pies, etc.)
 */

import { JointAngles, PoseEvaluation } from '@/types/mediapipe';
import { PRECISION_THRESHOLD, ADJUST_THRESHOLD } from '@/types/poseflow';

const COLOR_CORRECT   = '#22c55e';
const COLOR_ADJUST    = '#eab308';
const COLOR_INCORRECT = '#ef4444';
const COLOR_DEFAULT   = '#94a3b8'; // slate-400

// Mapeo de nombre de articulación → índices de landmarks afectados
const JOINT_LANDMARK_MAP: Record<keyof JointAngles, number[]> = {
  rightShoulder: [12, 14],    // hombro der → codo der
  leftShoulder:  [11, 13],    // hombro izq → codo izq
  rightElbow:    [12, 14, 16], // hombro, codo, muñeca der
  leftElbow:     [11, 13, 15], // hombro, codo, muñeca izq
  rightKnee:     [24, 26, 28], // cadera, rodilla, tobillo der
  leftKnee:      [23, 25, 27], // cadera, rodilla, tobillo izq
  rightHip:      [12, 24, 26], // hombro, cadera, rodilla der
  leftHip:       [11, 23, 25], // hombro, cadera, rodilla izq
  trunk:         [11, 12, 23, 24], // torso
  rightAnkle:    [26, 28, 30, 32], // rodilla, tobillo, talón, punta der
  leftAnkle:     [25, 27, 29, 31], // rodilla, tobillo, talón, punta izq
};

function jointColor(score: number): string {
  if (score >= PRECISION_THRESHOLD) return COLOR_CORRECT;
  if (score >= ADJUST_THRESHOLD)    return COLOR_ADJUST;
  return COLOR_INCORRECT;
}

export function buildJointColorMap(evaluation: PoseEvaluation | null): Map<number, string> {
  const map = new Map<number, string>();

  // Cara (landmarks 0-10): siempre blanco suave
  for (let i = 0; i <= 10; i++) map.set(i, COLOR_DEFAULT);

  if (!evaluation || !evaluation.isDetected) {
    // Sin detección: todo gris
    for (let i = 0; i < 33; i++) if (!map.has(i)) map.set(i, COLOR_DEFAULT);
    return map;
  }

  // Aplicar colores por articulación evaluada
  for (const [joint, feedback] of Object.entries(evaluation.jointFeedback) as [keyof JointAngles, { score: number }][]) {
    const indices = JOINT_LANDMARK_MAP[joint];
    if (!indices) continue;
    const color = jointColor(feedback.score);
    for (const idx of indices) {
      // Usar el peor color si el índice ya tiene uno asignado
      const existing = map.get(idx);
      if (!existing || colorPriority(color) > colorPriority(existing)) {
        map.set(idx, color);
      }
    }
  }

  // Landmarks sin evaluación → color por defecto
  for (let i = 0; i < 33; i++) {
    if (!map.has(i)) map.set(i, COLOR_DEFAULT);
  }

  return map;
}

function colorPriority(color: string): number {
  if (color === COLOR_INCORRECT) return 3;
  if (color === COLOR_ADJUST)    return 2;
  if (color === COLOR_CORRECT)   return 1;
  return 0;
}
