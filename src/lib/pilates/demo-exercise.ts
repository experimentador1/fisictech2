/**
 * Ejercicio de demostración de Pilates: "Apertura de Brazos"
 *
 * 4 imágenes de referencia en posición supina sobre colchoneta azul.
 * Los landmarks reales se extraen automáticamente por el ExerciseSeeder
 * con MediaPipe IMAGE mode la primera vez que arranca la app.
 *
 * Precisión requerida: 85% (margen de error 15%)
 */

import { Exercise, PRECISION_THRESHOLD } from '@/types/poseflow';

/** URLs públicas de las 4 imágenes de referencia */
export const DEMO_IMAGE_URLS = [
  '/pilates-demo-1.png',  // ambos brazos arriba (vertical)
  '/pilates-demo-2.png',  // brazos al costado (reposo)
  '/pilates-demo-3.png',  // un brazo hacia el techo
  '/pilates-demo-4.png',  // brazos extendidos hacia atrás
] as const;

// Tolerancias amplias para poses en posición supina (MediaPipe tiene menor
// precisión cuando la persona está acostada — perspectiva lateral)
export const SUPINE_TOLERANCES = {
  rightElbow:    22,
  leftElbow:     22,
  rightShoulder: 25,
  leftShoulder:  25,
  rightKnee:     22,
  leftKnee:      22,
  rightHip:      25,
  leftHip:       25,
  trunk:         20,
  rightAnkle:    25,
  leftAnkle:     25,
};

// Template base — los landmarks/angles se rellenan por el seeder con MediaPipe
export const APERTURA_BRAZOS_TEMPLATE: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Apertura de Brazos (Pilates)',
  description:
    'Secuencia de movilidad de hombros en posición supina con rodillas flexionadas. ' +
    'Trabaja la apertura del pecho, movilidad articular de hombros y activación del core.',
  category: 'pilates',
  difficulty: 'beginner',
  transitionTime: 3,
  published: true,
  precisionThreshold: PRECISION_THRESHOLD,
  createdBy: 'Demo FisicTech',
  poses: [
    {
      id: 'demo-pose-1',
      order: 1,
      name: 'Brazos Arriba',
      description: 'Acostado boca arriba, eleva ambos brazos verticalmente hacia el techo.',
      holdTime: 10,
      repetitions: 1,
      imageDataUrl: DEMO_IMAGE_URLS[0],
      landmarks: [],
      worldLandmarks: [],
      angles: {
        rightShoulder: 90, leftShoulder: 90,
        rightElbow: 175,   leftElbow: 175,
        rightKnee: 90,     leftKnee: 90,
        rightHip: 130,     leftHip: 130,
      },
      tolerances: SUPINE_TOLERANCES,
      minVisibility: 0.35,
      detectedLandmarks: 0,
    },
    {
      id: 'demo-pose-2',
      order: 2,
      name: 'Posición de Reposo',
      description: 'Baja los brazos al costado del cuerpo, palmas hacia abajo. Respira.',
      holdTime: 8,
      repetitions: 1,
      imageDataUrl: DEMO_IMAGE_URLS[1],
      landmarks: [],
      worldLandmarks: [],
      angles: {
        rightShoulder: 10, leftShoulder: 10,
        rightElbow: 160,   leftElbow: 160,
        rightKnee: 90,     leftKnee: 90,
        rightHip: 130,     leftHip: 130,
      },
      tolerances: SUPINE_TOLERANCES,
      minVisibility: 0.35,
      detectedLandmarks: 0,
    },
    {
      id: 'demo-pose-3',
      order: 3,
      name: 'Brazo al Techo',
      description: 'Eleva un brazo hacia el techo mientras el otro permanece al costado.',
      holdTime: 10,
      repetitions: 1,
      imageDataUrl: DEMO_IMAGE_URLS[2],
      landmarks: [],
      worldLandmarks: [],
      angles: {
        rightShoulder: 90, leftShoulder: 15,
        rightElbow: 175,   leftElbow: 160,
        rightKnee: 90,     leftKnee: 90,
        rightHip: 130,     leftHip: 130,
      },
      tolerances: SUPINE_TOLERANCES,
      minVisibility: 0.35,
      detectedLandmarks: 0,
    },
    {
      id: 'demo-pose-4',
      order: 4,
      name: 'Brazos Extendidos',
      description: 'Extiende ambos brazos hacia atrás sobre la colchoneta, estirando el pecho.',
      holdTime: 10,
      repetitions: 1,
      imageDataUrl: DEMO_IMAGE_URLS[3],
      landmarks: [],
      worldLandmarks: [],
      angles: {
        rightShoulder: 160, leftShoulder: 160,
        rightElbow: 170,    leftElbow: 170,
        rightKnee: 90,      leftKnee: 90,
        rightHip: 130,      leftHip: 130,
      },
      tolerances: SUPINE_TOLERANCES,
      minVisibility: 0.35,
      detectedLandmarks: 0,
    },
  ],
};
