'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { WebcamCapture, WebcamCaptureRef } from '@/components/mediapipe/webcam-capture';
import { ScoreDisplay } from '@/components/mediapipe/score-display';
import { DetectorStatusBadge } from '@/components/mediapipe/detector-status-badge';
import { Button } from '@/components/ui/button';
import { usePoseDetector } from '@/hooks/use-pose-detector';
import { useExercisesStore } from '@/hooks/use-exercises-store';
import { useExerciseSession } from '@/hooks/use-exercise-session';
import { Exercise, PRECISION_THRESHOLD, ADJUST_THRESHOLD, SCORE_COLORS } from '@/types/poseflow';
import { ReferencePose } from '@/types/mediapipe';
import { cn } from '@/lib/utils';
import { AnimatedPreview } from '@/components/common/animated-preview';
import {
  Camera, Dumbbell, ArrowRight, X, SkipForward,
  Trophy, CheckCircle2, AlertTriangle, XCircle,
  BarChart2, Clock, Star, TrendingDown,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';

type AppStep = 'catalog' | 'ready' | 'session' | 'report';

// ─── Helpers ──────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= PRECISION_THRESHOLD) return SCORE_COLORS.correct;
  if (score >= ADJUST_THRESHOLD) return SCORE_COLORS.adjust;
  return SCORE_COLORS.incorrect;
}

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={size * 0.08} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={size * 0.08} strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-300" />
      </svg>
      <span className="absolute font-bold text-center leading-none"
        style={{ fontSize: size * 0.24, color }}>
        {score}
      </span>
    </div>
  );
}

// ─── Componente Temporizador ──────────────────────────────────

function PoseTimer({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = total > 0 ? (timeLeft / total) * 100 : 0;
  const color = timeLeft <= 3 ? '#ef4444' : timeLeft <= 8 ? '#eab308' : '#22c55e';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="35" fill="none" stroke="#1f2937" strokeWidth="6" />
          <circle cx="40" cy="40" r="35" fill="none" stroke={color}
            strokeWidth="6" strokeDasharray={2 * Math.PI * 35}
            strokeDashoffset={2 * Math.PI * 35 * (1 - pct / 100)}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
          style={{ color }}>
          {timeLeft}
        </span>
      </div>
      <span className="text-xs text-gray-500">segundos</span>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────

export default function EvaluationPage() {
  const webcamRef = useRef<WebcamCaptureRef>(null);
  const [appStep, setAppStep] = useState<AppStep>('catalog');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [studentName, setStudentName] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const { exercises, addSession } = useExercisesStore();

  const { detectorStatus, fps, currentEvaluation, initialize, startDetection, updateReference, stopDetection } =
    usePoseDetector({ runningMode: 'VIDEO' });

  const {
    sessionState, currentPose, sessionResults, completedSession,
    startSession, recordScore, skipPose, stopSession,
  } = useExerciseSession(selectedExercise, studentName);

  // Pasar score al hook de sesión
  useEffect(() => {
    if (currentEvaluation?.isDetected) {
      recordScore(currentEvaluation.overallScore);
    }
  }, [currentEvaluation, recordScore]);

  // Guardar sesión completada
  useEffect(() => {
    if (completedSession && appStep === 'session') {
      addSession(completedSession);
      setAppStep('report');
    }
  }, [completedSession, appStep, addSession]);

  // Guarda la ref del vídeo/canvas para poder iniciar detección más tarde
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleWebcamReady = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      videoRef.current  = video;
      canvasRef.current = canvas;
      // initialize() es idempotente: si ya está listo resuelve de inmediato.
      // startDetection reinicia el loop con el video/canvas actuales.
      initialize()
        .then(() => startDetection(video, canvas, undefined))
        .catch(() => { /* el error ya queda reflejado en detectorStatus */ });
    },
    [initialize, startDetection]
  );

  // Actualiza la referencia cada vez que cambia la pose activa
  useEffect(() => {
    if (!currentPose) {
      updateReference(undefined);
      return;
    }
    const ref: ReferencePose = {
      id:            currentPose.id,
      name:          currentPose.name,
      description:   currentPose.description ?? '',
      category:      'pilates',
      landmarks:     currentPose.landmarks,
      worldLandmarks: currentPose.worldLandmarks,
      angles:        currentPose.angles,
      tolerances:    currentPose.tolerances,
      createdAt:     '',
      updatedAt:     '',
    };
    updateReference(ref);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPose?.id]);

  const handleStartSession = () => {
    if (!selectedExercise) return;
    setAppStep('session');
    startSession();
  };

  const handleStopSession = () => {
    stopDetection();
    stopSession();
    setAppStep('catalog');
    setSelectedExercise(null);
  };

  // ─── CATÁLOGO ─────────────────────────────────────────────
  const filteredExercises = exercises.filter(
    ex => filterCat === 'all' || ex.category === filterCat
  );

  if (appStep === 'catalog') {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-green-400 mb-2">
              <Camera className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Módulo 2</span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-400">Evaluación de Alumno</span>
            </div>
            <h1 className="text-3xl font-bold">Seleccionar Ejercicio</h1>
            <p className="text-gray-400 mt-1">
              Elige un ejercicio y practica con retroalimentación en tiempo real
            </p>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'pilates', 'yoga', 'stretching', 'rehabilitation', 'strength'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm transition-colors',
                  filterCat === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                )}
              >
                {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {filteredExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-gray-700 rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
                <Dumbbell className="w-7 h-7 text-gray-600" strokeWidth={1} />
              </div>
              <p className="text-lg font-semibold text-gray-300">No hay ejercicios disponibles</p>
              <p className="text-sm mt-1 text-gray-600">Ve al Módulo 1 (Lecciones) para crear ejercicios</p>
              <button
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 cursor-pointer"
                onClick={() => window.location.href = '/training'}
              >
                <Dumbbell className="w-4 h-4" strokeWidth={2} />
                Ir al Módulo de Lecciones
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className={cn(
              'grid gap-6 transition-all duration-300',
              selectedExercise ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {/* Grid de ejercicios */}
              <div className={cn(
                'grid gap-4 content-start transition-all duration-300',
                selectedExercise
                  ? 'grid-cols-1 sm:grid-cols-2 lg:col-span-2'
                  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
              )}>
                {filteredExercises.map(ex => (
                  <div
                    key={ex.id}
                    className={cn(
                      'bg-gray-900 rounded-xl border p-4 cursor-pointer transition-all duration-200',
                      selectedExercise?.id === ex.id
                        ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-950/20'
                        : 'border-gray-800 hover:border-gray-600'
                    )}
                    onClick={() => setSelectedExercise(ex)}
                  >
                    <div className="aspect-video bg-gray-800 rounded-lg mb-3 overflow-hidden">
                      <AnimatedPreview gifDataUrl={ex.gifDataUrl} className="w-full h-full" />
                    </div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-white">{ex.name}</h3>
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                        {ex.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{ex.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{ex.poses.length} poses</span>
                      <span>·</span>
                      <span>~{ex.poses.reduce((s, p) => s + p.holdTime, 0) + ex.transitionTime * (ex.poses.length - 1)}s</span>
                      <span>·</span>
                      <span>{ex.difficulty}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Panel de detalle + inicio */}
              {selectedExercise && (
                <div className="lg:col-span-1">
                  <div className="sticky top-20 bg-white/[0.02] rounded-2xl border border-blue-500/30 p-5 space-y-5 shadow-xl shadow-blue-500/5">
                    {/* Preview */}
                    <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden">
                      <AnimatedPreview gifDataUrl={selectedExercise.gifDataUrl} className="w-full h-full" />
                    </div>

                    {/* Info */}
                    <div>
                      <h2 className="font-bold text-lg text-white leading-tight">{selectedExercise.name}</h2>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-3">{selectedExercise.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                          {selectedExercise.poses.length} poses
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400">
                          umbral {selectedExercise.precisionThreshold}%
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-gray-400 capitalize">
                          {selectedExercise.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Nombre del alumno */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Nombre del alumno
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        placeholder="Tu nombre (opcional)"
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-blue-500/50 focus:bg-white/[0.06] focus:outline-none transition-all duration-150"
                      />
                    </div>

                    {/* Botón inicio */}
                    <button
                      onClick={handleStartSession}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/20"
                    >
                      <Camera className="w-4 h-4" strokeWidth={2} />
                      Iniciar Sesión
                      <ArrowRight className="w-4 h-4" strokeWidth={2} />
                    </button>

                    {/* Deseleccionar */}
                    <button
                      onClick={() => setSelectedExercise(null)}
                      className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors duration-150 cursor-pointer"
                    >
                      Cancelar selección
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── SESIÓN ───────────────────────────────────────────────
  if (appStep === 'session' && selectedExercise) {
    const isCountdown = sessionState.status === 'countdown';
    const isTransition = sessionState.status === 'transition';
    const isPracticing = sessionState.status === 'practicing';
    const score = sessionState.currentScore;
    const poseIdx = sessionState.currentPoseIndex;

    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container max-w-6xl mx-auto px-4 py-4">

          {/* Header de sesión */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400">
                Pose {poseIdx + 1}/{selectedExercise.poses.length}
                {(() => {
                  const totalReps = currentPose?.repetitions ?? 1;
                  if (totalReps > 1) {
                    return (
                      <span className="ml-2 text-violet-400 font-semibold">
                        · Rep {sessionState.currentRepetition}/{totalReps}
                      </span>
                    );
                  }
                  return null;
                })()}
                {' '}· {selectedExercise.name}
              </p>
              <DetectorStatusBadge status={detectorStatus} fps={fps} />
            </div>
            <div className="flex items-center gap-3">
              {isPracticing && (
                <PoseTimer
                  timeLeft={sessionState.currentPoseTimeLeft}
                  total={currentPose?.holdTime ?? 10}
                />
              )}
              <button
                onClick={handleStopSession}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium transition-all duration-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
                Salir
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Webcam + Canvas */}
            <div className="lg:col-span-2 space-y-3">
              <div className="relative">
                <WebcamCapture
                  ref={webcamRef}
                  onVideoReady={handleWebcamReady}
                  className="w-full bg-black rounded-xl"
                  width={640}
                  height={480}
                />

                {/* Overlay de estado */}
                {isCountdown && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
                    <p className="text-lg text-gray-300 mb-2">Prepárate...</p>
                    <span className="text-8xl font-bold text-blue-400 animate-pulse">
                      {sessionState.currentPoseTimeLeft}
                    </span>
                  </div>
                )}

                {isTransition && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
                    {(() => {
                      const totalReps = currentPose?.repetitions ?? 1;
                      const isRepTransition = sessionState.currentRepetition > 1 && sessionState.currentRepetition <= totalReps;
                      return (
                        <>
                          <p className="text-lg font-semibold flex items-center gap-2 text-yellow-400">
                            <SkipForward className="w-5 h-5" strokeWidth={2} />
                            {isRepTransition
                              ? `Repetición ${sessionState.currentRepetition} de ${totalReps}`
                              : 'Siguiente pose en...'}
                          </p>
                          <span className="text-6xl font-bold text-white mt-2">
                            {sessionState.transitionTimeLeft}
                          </span>
                          {currentPose && (
                            <p className="text-gray-300 mt-3 text-lg">{currentPose.name}</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Overlay "No se detecta persona" sobre la cámara */}
                {(isPracticing || isCountdown) && currentEvaluation !== null && !currentEvaluation.isDetected && (
                  <div className="absolute inset-0 flex flex-col items-end justify-end pointer-events-none rounded-xl pb-4 pr-4">
                    <div className="flex items-center gap-2 bg-black/80 border border-orange-500/50 rounded-xl px-3 py-2 backdrop-blur-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-orange-400 text-sm font-semibold">
                        No se detecta ninguna persona
                      </span>
                    </div>
                  </div>
                )}

                {/* Score en tiempo real sobre la imagen */}
                {isPracticing && currentEvaluation?.isDetected && (
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-2 bg-black/70 rounded-xl px-3 py-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: scoreColor(score) }}
                      />
                      <span className="font-bold text-xl" style={{ color: scoreColor(score) }}>
                        {score}%
                      </span>
                      <span className="text-gray-400 text-sm">
                        {score >= PRECISION_THRESHOLD ? 'Correcto' :
                          score >= ADJUST_THRESHOLD ? 'Ajustar' : 'Corregir'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progreso de poses */}
              <div className="flex gap-2">
                {selectedExercise.poses.map((pose, i) => (
                  <div
                    key={pose.id}
                    className={cn(
                      'flex-1 h-2 rounded-full transition-all',
                      i < poseIdx ? 'bg-green-500' :
                        i === poseIdx && isPracticing ? 'bg-blue-500' :
                          'bg-gray-700'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Panel lateral */}
            <div className="space-y-3">
              {/* Pose de referencia */}
              {currentPose && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-3">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
                    Pose de referencia
                  </p>
                  <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-2">
                    {currentPose.imageDataUrl
                      ? <img src={currentPose.imageDataUrl} alt="" className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} /> // eslint-disable-line
                      : <div className="flex h-full items-center justify-center text-4xl">🧘</div>}
                  </div>
                  <p className="font-semibold text-white">{currentPose.name}</p>
                  {(currentPose.repetitions ?? 1) > 1 && isPracticing && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {Array.from({ length: currentPose.repetitions ?? 1 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-1.5 flex-1 rounded-full transition-all duration-300',
                            i < sessionState.currentRepetition - 1 ? 'bg-green-500' :
                            i === sessionState.currentRepetition - 1 ? 'bg-violet-400' :
                            'bg-gray-700'
                          )}
                        />
                      ))}
                      <span className="text-xs text-violet-400 font-semibold shrink-0 ml-1">
                        {sessionState.currentRepetition}/{currentPose.repetitions ?? 1}
                      </span>
                    </div>
                  )}
                  {currentPose.description && (
                    <p className="text-xs text-gray-400 mt-1">{currentPose.description}</p>
                  )}
                </div>
              )}

              {/* Feedback de ángulos / alerta sin persona */}
              {(isPracticing || isCountdown || isTransition) && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-3">
                  <ScoreDisplay evaluation={currentEvaluation} compact />
                </div>
              )}

              {/* Botón skip */}
              {isPracticing && (
                <button
                  onClick={skipPose}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-sm text-gray-400 hover:text-gray-200 transition-all duration-200 cursor-pointer"
                >
                  Saltar pose
                  <SkipForward className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── REPORTE ──────────────────────────────────────────────
  if (appStep === 'report' && completedSession) {
    const s = completedSession;
    const barData = s.poseResults.map(r => ({
      name: r.poseName.length > 12 ? r.poseName.slice(0, 12) + '…' : r.poseName,
      score: r.averageScore,
      fill: scoreColor(r.averageScore),
    }));
    const radarData = s.poseResults.map(r => ({
      pose: r.poseName.length > 10 ? r.poseName.slice(0, 10) + '…' : r.poseName,
      score: r.averageScore,
    }));

    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container max-w-5xl mx-auto px-4 py-8">

          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-bold">Reporte de Sesión</h1>
            <p className="text-gray-400 mt-1">
              {s.exerciseName} · {s.studentName} ·{' '}
              {new Date(s.startedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Score global */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 px-12 py-8 text-center">
              <ScoreRing score={s.globalScore} size={128} />
              <p className="text-gray-400 mt-3">Puntuación Global</p>
              <p className="text-sm text-gray-500 mt-1">
                {s.globalScore >= PRECISION_THRESHOLD
                  ? '✅ Por encima del umbral del 85%'
                  : `⚠️ Por debajo del umbral del ${PRECISION_THRESHOLD}%`}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Clock,       label: 'Duración',          value: `${Math.floor(s.durationSecs / 60)}m ${s.durationSecs % 60}s`, color: 'text-white' },
              { icon: BarChart2,   label: 'Poses completadas', value: `${s.poseResults.length}/${selectedExercise?.poses.length ?? 0}`, color: 'text-white' },
              { icon: Star,        label: 'Mejor pose',        value: s.bestPose?.poseName ?? '—', color: 'text-green-400' },
              { icon: TrendingDown,label: 'Peor pose',         value: s.worstPose?.poseName ?? '—', color: 'text-red-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-4 text-center">
                <stat.icon className={cn('w-4 h-4 mx-auto mb-2', stat.color)} strokeWidth={1.5} />
                <p className={cn('font-bold text-base', stat.color)}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Barras por pose */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <h3 className="font-semibold mb-4">Score por Pose</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#6b7280" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 8 }}
                    formatter={(val) => [`${val ?? 0}%`, 'Score']}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar */}
            {radarData.length >= 3 && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="font-semibold mb-4">Perfil de Rendimiento</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="pose" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tabla detalle */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Pose</th>
                  <th className="text-center px-4 py-3">Score</th>
                  <th className="text-center px-4 py-3">Máx.</th>
                  <th className="text-center px-4 py-3">Reps</th>
                  <th className="text-center px-4 py-3">Tiempo correcto</th>
                  <th className="text-center px-4 py-3">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {s.poseResults.map(r => (
                  <tr key={r.poseId} className="border-b border-gray-800/50">
                    <td className="px-4 py-3 text-gray-500">{r.order}</td>
                    <td className="px-4 py-3 text-white font-medium">{r.poseName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold" style={{ color: scoreColor(r.averageScore) }}>
                        {r.averageScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">{r.maxScore}%</td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {r.repetitionsDone}/{r.repetitionsTotal}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300">{r.percentTimeCorrect}%</td>
                    <td className="px-4 py-3 text-center">
                      {r.averageScore >= PRECISION_THRESHOLD
                        ? <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />Correcto</span>
                        : r.averageScore >= ADJUST_THRESHOLD
                          ? <span className="inline-flex items-center gap-1 text-yellow-400"><AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />Ajustar</span>
                          : <span className="inline-flex items-center gap-1 text-red-400"><XCircle className="w-3.5 h-3.5" strokeWidth={2} />Corregir</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { stopSession(); setAppStep('catalog'); setSelectedExercise(null); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/20"
            >
              <Camera className="w-4 h-4" strokeWidth={2} />
              Nueva Sesión
            </button>
            <button
              onClick={() => window.location.href = '/sessions'}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 font-medium text-sm rounded-xl transition-all duration-200 cursor-pointer"
            >
              <BarChart2 className="w-4 h-4" strokeWidth={2} />
              Ver Historial
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
