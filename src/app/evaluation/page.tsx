'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { WebcamCapture, WebcamCaptureRef } from '@/components/mediapipe/webcam-capture';
import { ScoreDisplay } from '@/components/mediapipe/score-display';
import { PoseCard } from '@/components/mediapipe/pose-card';
import { DetectorStatusBadge } from '@/components/mediapipe/detector-status-badge';
import { Button } from '@/components/ui/button';
import { usePoseDetector } from '@/hooks/use-pose-detector';
import { usePosesStore } from '@/hooks/use-poses-store';
import { ReferencePose, PoseEvaluation, SessionFrame } from '@/types/mediapipe';

type EvalStep = 'select' | 'evaluating' | 'results';

export default function EvaluationPage() {
  const webcamRef = useRef<WebcamCaptureRef>(null);
  const sessionFramesRef = useRef<SessionFrame[]>([]);
  const sessionStartRef = useRef<number>(0);

  const [step, setStep] = useState<EvalStep>('select');
  const [selectedPose, setSelectedPose] = useState<ReferencePose | null>(null);
  const [studentName, setStudentName] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);

  const { detectorStatus, fps, currentEvaluation, initialize, startDetection, stopDetection } =
    usePoseDetector({ runningMode: 'VIDEO' });

  const { poses, addSession } = usePosesStore();

  // Timer de sesión
  useEffect(() => {
    if (step !== 'evaluating') return;
    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Acumular frames de sesión
  useEffect(() => {
    if (!currentEvaluation || step !== 'evaluating') return;
    sessionFramesRef.current.push({
      timestamp: currentEvaluation.timestamp,
      landmarks: [],
      evaluation: currentEvaluation,
    });
  }, [currentEvaluation, step]);

  const handleWebcamReady = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      if (!selectedPose) return;
      if (detectorStatus === 'idle') {
        initialize().then(() => startDetection(video, canvas, selectedPose));
      } else if (detectorStatus === 'ready') {
        startDetection(video, canvas, selectedPose);
      }
    },
    [detectorStatus, initialize, startDetection, selectedPose]
  );

  const handleStartEvaluation = () => {
    if (!selectedPose) return;
    sessionFramesRef.current = [];
    sessionStartRef.current = Date.now();
    setSessionDuration(0);
    setStep('evaluating');
  };

  const handleEndSession = useCallback(() => {
    stopDetection();
    const frames = sessionFramesRef.current;
    const avgScore =
      frames.length > 0
        ? Math.round(frames.reduce((s, f) => s + f.evaluation.overallScore, 0) / frames.length)
        : 0;

    if (selectedPose && frames.length > 0) {
      addSession({
        referencePoseId: selectedPose.id,
        referencePoseName: selectedPose.name,
        studentName: studentName || 'Anónimo',
        frames,
        averageScore: avgScore,
        duration: sessionDuration,
        startedAt: new Date(sessionStartRef.current).toISOString(),
        endedAt: new Date().toISOString(),
      });
    }

    setStep('results');
  }, [stopDetection, selectedPose, studentName, sessionDuration, addSession]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Evaluación en Tiempo Real</h1>
            <p className="text-gray-400 mt-1">
              Compara tu pose con la referencia del maestro
            </p>
          </div>
          {step === 'evaluating' && (
            <div className="flex items-center gap-4">
              <span className="font-mono text-2xl text-blue-400">
                {formatTime(sessionDuration)}
              </span>
              <Button variant="destructive" onClick={handleEndSession}>
                Finalizar Sesión
              </Button>
            </div>
          )}
        </div>

        {/* PASO 1: Seleccionar pose */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold">
                  Selecciona una Pose de Referencia
                </h2>
                {poses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500 border border-dashed border-gray-700 rounded-2xl">
                    <span className="text-5xl mb-3">📚</span>
                    <p>No hay poses de referencia</p>
                    <p className="text-sm mt-1">
                      Ve al módulo de Entrenamiento para crear poses
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {poses.map(pose => (
                      <PoseCard
                        key={pose.id}
                        pose={pose}
                        onSelect={setSelectedPose}
                        isSelected={selectedPose?.id === pose.id}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-gray-900 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold">Configuración de Sesión</h3>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">
                      Nombre del estudiante
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={e => setStudentName(e.target.value)}
                      placeholder="Nombre (opcional)"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {selectedPose && (
                    <div className="bg-blue-950/50 border border-blue-800 rounded-lg p-3 text-sm">
                      <p className="text-blue-300 font-medium">
                        Pose seleccionada:
                      </p>
                      <p className="text-white">{selectedPose.name}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {Object.keys(selectedPose.angles).length} articulaciones a evaluar
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleStartEvaluation}
                    disabled={!selectedPose}
                  >
                    Iniciar Evaluación →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Evaluación en tiempo real */}
        {step === 'evaluating' && selectedPose && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cámara + Canvas */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <DetectorStatusBadge status={detectorStatus} fps={fps} />
                {selectedPose.name && (
                  <span className="text-sm text-gray-400">
                    Evaluando: <strong className="text-white">{selectedPose.name}</strong>
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

              {/* Pose de referencia */}
              {selectedPose.imageDataUrl && (
                <div className="flex items-center gap-3 bg-gray-900 rounded-xl p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPose.imageDataUrl}
                    alt="Referencia"
                    className="w-20 h-16 rounded-lg object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="text-sm text-gray-400">
                    <p className="text-white font-medium">Pose de referencia</p>
                    <p>{selectedPose.description || 'Sin descripción'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Score + Feedback */}
            <div className="bg-gray-900 rounded-xl p-4">
              <h3 className="font-semibold mb-4">Análisis en Tiempo Real</h3>
              <ScoreDisplay evaluation={currentEvaluation} />
            </div>
          </div>
        )}

        {/* PASO 3: Resultados */}
        {step === 'results' && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold">Sesión Completada</h2>
              <p className="text-gray-400 mt-2">
                Los resultados han sido guardados en tu historial
              </p>
              <div className="flex gap-4 justify-center mt-6">
                <Button
                  onClick={() => {
                    setStep('select');
                    setSelectedPose(null);
                    setSessionDuration(0);
                  }}
                >
                  Nueva Evaluación
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = '/sessions')}
                >
                  Ver Historial
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
