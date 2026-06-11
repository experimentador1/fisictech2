'use client';

import { useState, useRef, useCallback } from 'react';
import { WebcamCapture, WebcamCaptureRef } from '@/components/mediapipe/webcam-capture';
import { PoseCard } from '@/components/mediapipe/pose-card';
import { DetectorStatusBadge } from '@/components/mediapipe/detector-status-badge';
import { Button } from '@/components/ui/button';
import { usePoseDetector } from '@/hooks/use-pose-detector';
import { usePosesStore } from '@/hooks/use-poses-store';
import { extractJointAngles } from '@/lib/mediapipe/angle-calculator';
import { ReferencePose, Landmark } from '@/types/mediapipe';
import { cn } from '@/lib/utils';

type Step = 'library' | 'capture' | 'review';

const CATEGORIES: ReferencePose['category'][] = [
  'pilates', 'yoga', 'stretching', 'strength', 'other',
];

const CATEGORY_LABELS = {
  pilates: 'Pilates', yoga: 'Yoga', stretching: 'Estiramiento',
  strength: 'Fuerza', other: 'Otro',
};

const DEFAULT_TOLERANCES = {
  rightElbow: 15, leftElbow: 15, rightShoulder: 20, leftShoulder: 20,
  rightKnee: 15, leftKnee: 15, rightHip: 20, leftHip: 20,
  trunk: 15, rightAnkle: 20, leftAnkle: 20,
};

export default function TrainingPage() {
  const webcamRef = useRef<WebcamCaptureRef>(null);
  const [step, setStep] = useState<Step>('library');
  const [capturedLandmarks, setCapturedLandmarks] = useState<Landmark[] | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [poseName, setPoseName] = useState('');
  const [poseDescription, setPoseDescription] = useState('');
  const [poseCategory, setPoseCategory] = useState<ReferencePose['category']>('pilates');
  const [webcamReady, setWebcamReady] = useState(false);

  const { detectorStatus, fps, initialize, startDetection, stopDetection, captureCurrentPose } =
    usePoseDetector({ runningMode: 'VIDEO' });

  const { poses, addPose, deletePose } = usePosesStore();

  const handleWebcamReady = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      setWebcamReady(true);
      if (detectorStatus === 'idle') {
        initialize().then(() => startDetection(video, canvas));
      } else if (detectorStatus === 'ready') {
        startDetection(video, canvas);
      }
    },
    [detectorStatus, initialize, startDetection]
  );

  const handleCapture = useCallback(() => {
    const lms = captureCurrentPose();
    const imgData = webcamRef.current?.captureImage() ?? null;
    if (!lms) return;

    setCapturedLandmarks(lms);
    setCapturedImage(imgData);
    stopDetection();
    setStep('review');
  }, [captureCurrentPose, stopDetection]);

  const handleSavePose = useCallback(() => {
    if (!capturedLandmarks || !poseName.trim()) return;

    const angles = extractJointAngles(capturedLandmarks);

    // Filtrar NaN
    const cleanAngles = Object.fromEntries(
      Object.entries(angles).filter(([, v]) => !isNaN(v))
    ) as typeof angles;

    addPose({
      name: poseName.trim(),
      description: poseDescription.trim(),
      category: poseCategory,
      landmarks: capturedLandmarks,
      worldLandmarks: [],
      angles: cleanAngles,
      tolerances: DEFAULT_TOLERANCES,
      imageDataUrl: capturedImage ?? undefined,
    });

    // Reset
    setPoseName('');
    setPoseDescription('');
    setCapturedLandmarks(null);
    setCapturedImage(null);
    setStep('library');
  }, [capturedLandmarks, poseName, poseDescription, poseCategory, capturedImage, addPose]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Módulo de Entrenamiento</h1>
            <p className="text-gray-400 mt-1">
              Captura poses de referencia con tu cámara
            </p>
          </div>
          {step !== 'library' && (
            <Button
              variant="outline"
              onClick={() => {
                stopDetection();
                setStep('library');
                setCapturedLandmarks(null);
              }}
            >
              ← Volver
            </Button>
          )}
        </div>

        {/* PASO 1: Biblioteca */}
        {step === 'library' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-200">
                Poses de Referencia ({poses.length})
              </h2>
              <Button onClick={() => setStep('capture')}>
                + Capturar Nueva Pose
              </Button>
            </div>

            {poses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-gray-700 rounded-2xl">
                <span className="text-6xl mb-4">🧘‍♀️</span>
                <p className="text-lg font-medium">No hay poses guardadas aún</p>
                <p className="text-sm mt-1">
                  Haz clic en &quot;Capturar Nueva Pose&quot; para comenzar
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {poses.map(pose => (
                  <PoseCard
                    key={pose.id}
                    pose={pose}
                    onDelete={deletePose}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PASO 2: Captura */}
        {step === 'capture' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <DetectorStatusBadge status={detectorStatus} fps={fps} />
                {!webcamReady && (
                  <span className="text-yellow-400 text-sm">
                    Iniciando cámara...
                  </span>
                )}
              </div>

              <WebcamCapture
                ref={webcamRef}
                onVideoReady={handleWebcamReady}
                className="w-full bg-black"
                width={640}
                height={480}
              />

              <Button
                className="w-full h-12 text-lg"
                onClick={handleCapture}
                disabled={detectorStatus !== 'detecting'}
              >
                📸 Capturar Pose Actual
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-200">
                  Instrucciones
                </h3>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>1. Colócate frente a la cámara</li>
                  <li>2. Asegúrate de que tu cuerpo completo sea visible</li>
                  <li>3. Adopta la posición deseada</li>
                  <li>4. Mantén la pose estable</li>
                  <li>5. Haz clic en &quot;Capturar Pose&quot;</li>
                </ul>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 space-y-2 text-sm text-gray-400">
                <h4 className="font-semibold text-gray-200 text-sm">
                  Consejos para mejores resultados
                </h4>
                <p>✓ Buena iluminación frontal</p>
                <p>✓ Ropa ajustada o de colores sólidos</p>
                <p>✓ Fondo liso preferiblemente</p>
                <p>✓ Distancia de 2-3 metros</p>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: Revisión */}
        {step === 'review' && capturedLandmarks && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Pose Capturada</h2>
              <div className="rounded-xl overflow-hidden bg-gray-900 aspect-video">
                {capturedImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={capturedImage}
                    alt="Pose capturada"
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sin imagen previa
                  </div>
                )}
              </div>

              <div className="bg-gray-900 rounded-xl p-4 text-sm text-gray-400">
                <p className="text-green-400 font-medium mb-1">
                  ✓ Landmarks detectados: {capturedLandmarks.length}
                </p>
                <p>
                  Ángulos calculados:{' '}
                  {
                    Object.values(extractJointAngles(capturedLandmarks)).filter(
                      v => !isNaN(v)
                    ).length
                  }{' '}
                  articulaciones
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Detalles de la Pose</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nombre de la pose *
                  </label>
                  <input
                    type="text"
                    value={poseName}
                    onChange={e => setPoseName(e.target.value)}
                    placeholder="ej. Postura del árbol, Roll up..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={poseDescription}
                    onChange={e => setPoseDescription(e.target.value)}
                    placeholder="Describe cómo realizar esta pose..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Categoría
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setPoseCategory(cat)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                          poseCategory === cat
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                        )}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1"
                    onClick={handleSavePose}
                    disabled={!poseName.trim()}
                  >
                    Guardar Pose
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCapturedLandmarks(null);
                      setStep('capture');
                    }}
                  >
                    Volver a capturar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
