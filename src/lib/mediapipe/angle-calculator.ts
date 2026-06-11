import { Landmark, JointAngles, LandmarkId } from '@/types/mediapipe';

/**
 * Calcula el ángulo en grados entre tres landmarks.
 * b es el vértice (articulación).
 */
export function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let degrees = Math.abs(radians * (180.0 / Math.PI));
  if (degrees > 180) {
    degrees = 360 - degrees;
  }
  return degrees;
}

/**
 * Extrae todos los ángulos articulares relevantes para pilates/yoga.
 * Retorna NaN para landmarks con baja visibilidad.
 */
export function extractJointAngles(
  landmarks: Landmark[],
  visibilityThreshold = 0.5
): JointAngles {
  const lm = landmarks;

  const isVisible = (id: LandmarkId): boolean =>
    (lm[id]?.visibility ?? 1) >= visibilityThreshold;

  const safeAngle = (
    a: LandmarkId,
    b: LandmarkId,
    c: LandmarkId
  ): number => {
    if (!isVisible(a) || !isVisible(b) || !isVisible(c)) return NaN;
    return calculateAngle(lm[a]!, lm[b]!, lm[c]!);
  };

  return {
    // Codo: hombro → codo → muñeca
    rightElbow: safeAngle(LandmarkId.RIGHT_SHOULDER, LandmarkId.RIGHT_ELBOW, LandmarkId.RIGHT_WRIST),
    leftElbow: safeAngle(LandmarkId.LEFT_SHOULDER, LandmarkId.LEFT_ELBOW, LandmarkId.LEFT_WRIST),

    // Hombro: codo → hombro → cadera
    rightShoulder: safeAngle(LandmarkId.RIGHT_ELBOW, LandmarkId.RIGHT_SHOULDER, LandmarkId.RIGHT_HIP),
    leftShoulder: safeAngle(LandmarkId.LEFT_ELBOW, LandmarkId.LEFT_SHOULDER, LandmarkId.LEFT_HIP),

    // Rodilla: cadera → rodilla → tobillo
    rightKnee: safeAngle(LandmarkId.RIGHT_HIP, LandmarkId.RIGHT_KNEE, LandmarkId.RIGHT_ANKLE),
    leftKnee: safeAngle(LandmarkId.LEFT_HIP, LandmarkId.LEFT_KNEE, LandmarkId.LEFT_ANKLE),

    // Cadera: hombro → cadera → rodilla
    rightHip: safeAngle(LandmarkId.RIGHT_SHOULDER, LandmarkId.RIGHT_HIP, LandmarkId.RIGHT_KNEE),
    leftHip: safeAngle(LandmarkId.LEFT_SHOULDER, LandmarkId.LEFT_HIP, LandmarkId.LEFT_KNEE),

    // Tronco: hombro izq → cadera izq → rodilla izq
    trunk: safeAngle(LandmarkId.LEFT_SHOULDER, LandmarkId.LEFT_HIP, LandmarkId.LEFT_KNEE),

    // Tobillo: rodilla → tobillo → dedo del pie
    rightAnkle: safeAngle(LandmarkId.RIGHT_KNEE, LandmarkId.RIGHT_ANKLE, LandmarkId.RIGHT_FOOT_INDEX),
    leftAnkle: safeAngle(LandmarkId.LEFT_KNEE, LandmarkId.LEFT_ANKLE, LandmarkId.LEFT_FOOT_INDEX),
  };
}
