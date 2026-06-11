'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Exercise, ExercisePose, LiveSessionState, PoseSessionResult,
  PracticeSession, PRECISION_THRESHOLD,
} from '@/types/poseflow';
import {
  playSessionStart, playSessionEnd, playTransition,
  playCountdown, playCountdownFinal, playCorrect, resumeAudio,
} from '@/lib/audio/beeps';

export interface UseExerciseSessionReturn {
  sessionState: LiveSessionState;
  currentPose: ExercisePose | null;
  sessionResults: PoseSessionResult[];
  completedSession: Omit<PracticeSession, 'id'> | null;
  startSession: () => void;
  recordScore: (score: number) => void;
  skipPose: () => void;
  stopSession: () => void;
}

const INITIAL_STATE: LiveSessionState = {
  status: 'idle',
  currentPoseIndex: 0,
  currentRepetition: 1,
  currentPoseTimeLeft: 0,
  transitionTimeLeft: 0,
  currentScore: 0,
  frameScores: [],
};

// ─── Helpers ──────────────────────────────────────────────────

function buildPoseResult(
  pose: ExercisePose,
  rep: number,
  totalReps: number,
  frameScores: number[],
  overridePct?: number
): PoseSessionResult {
  const avgScore = frameScores.length > 0
    ? Math.round(frameScores.reduce((a, b) => a + b, 0) / frameScores.length)
    : 0;
  const maxScore = frameScores.length > 0 ? Math.max(...frameScores) : 0;
  const pct = overridePct ?? (frameScores.length > 0
    ? Math.round((frameScores.filter(s => s >= PRECISION_THRESHOLD).length / frameScores.length) * 100)
    : 0);
  return {
    poseId: pose.id,
    poseName: pose.name,
    order: pose.order,
    averageScore: avgScore,
    maxScore,
    percentTimeCorrect: pct,
    holdTimeSecs: pose.holdTime * totalReps,
    repetitionsDone: rep,
    repetitionsTotal: totalReps,
  };
}

// ─── Hook ─────────────────────────────────────────────────────

export function useExerciseSession(
  exercise: Exercise | null,
  studentName?: string
): UseExerciseSessionReturn {
  const [sessionState, setSessionState] = useState<LiveSessionState>(INITIAL_STATE);
  const [sessionResults, setSessionResults] = useState<PoseSessionResult[]>([]);
  const [completedSession, setCompletedSession] = useState<Omit<PracticeSession, 'id'> | null>(null);

  const timerRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameScoresRef     = useRef<number[]>([]);
  const repScoresRef       = useRef<number[][]>([]);
  const sessionStartRef    = useRef<number>(0);
  const lastCorrectBeepRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const currentPose =
    exercise && sessionState.currentPoseIndex < exercise.poses.length
      ? exercise.poses[sessionState.currentPoseIndex] ?? null
      : null;

  // ─── Finalizar sesión ────────────────────────────────────────
  const finishSession = useCallback(
    (results: PoseSessionResult[]) => {
      playSessionEnd();
      const durationSecs = Math.round((Date.now() - sessionStartRef.current) / 1000);
      const globalScore = results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.averageScore, 0) / results.length)
        : 0;
      const sorted = [...results].sort((a, b) => b.averageScore - a.averageScore);
      setCompletedSession({
        exerciseId: exercise?.id ?? '',
        exerciseName: exercise?.name ?? '',
        studentName: studentName ?? 'Alumno',
        poseResults: results,
        globalScore,
        durationSecs,
        startedAt: new Date(sessionStartRef.current).toISOString(),
        completedAt: new Date().toISOString(),
        bestPose:  sorted[0],
        worstPose: sorted[sorted.length - 1],
      });
      setSessionState(s => ({ ...s, status: 'completed' }));
    },
    [exercise, studentName]
  );

  // ─── EFFECT: fase 'practicing' ───────────────────────────────
  useEffect(() => {
    if (sessionState.status !== 'practicing' || !exercise) return;

    const poseIdx = sessionState.currentPoseIndex;
    const rep     = sessionState.currentRepetition;
    const pose    = exercise.poses[poseIdx];
    if (!pose) return;

    frameScoresRef.current = [];
    let timeLeft = pose.holdTime;

    clearTimer();
    timerRef.current = setInterval(() => {
      timeLeft--;

      if (timeLeft <= 3 && timeLeft > 0) {
        timeLeft === 1 ? playCountdownFinal() : playCountdown();
      }

      setSessionState(s => ({ ...s, currentPoseTimeLeft: timeLeft }));

      if (timeLeft <= 0) {
        clearTimer();

        const totalReps   = pose.repetitions ?? 1;
        const currentScores = [...frameScoresRef.current];

        // Acumular scores de esta repetición
        repScoresRef.current[poseIdx] = [
          ...(repScoresRef.current[poseIdx] ?? []),
          currentScores.length > 0
            ? Math.round(currentScores.reduce((a, b) => a + b, 0) / currentScores.length)
            : 0,
        ];

        const isLastRep = rep >= totalReps;

        if (isLastRep) {
          // Calcular score final promediando todas las reps
          const allRepScores = repScoresRef.current[poseIdx] ?? [0];
          const finalAvg = Math.round(
            allRepScores.reduce((a, b) => a + b, 0) / allRepScores.length
          );
          const maxScore = currentScores.length > 0 ? Math.max(...currentScores) : 0;
          const pct = currentScores.length > 0
            ? Math.round((currentScores.filter(s => s >= PRECISION_THRESHOLD).length / currentScores.length) * 100)
            : 0;
          repScoresRef.current[poseIdx] = [];

          const poseResult: PoseSessionResult = {
            poseId: pose.id, poseName: pose.name, order: pose.order,
            averageScore: finalAvg, maxScore, percentTimeCorrect: pct,
            holdTimeSecs: pose.holdTime * totalReps,
            repetitionsDone: totalReps, repetitionsTotal: totalReps,
          };

          setSessionResults(prev => {
            const updated = [...prev, poseResult];
            // Decidir siguiente paso → solo actualiza estado, SIN timers aquí
            const nextPoseIdx = poseIdx + 1;
            if (nextPoseIdx >= exercise.poses.length) {
              // Terminó el ejercicio
              finishSession(updated);
            } else {
              // Transición a siguiente pose
              playTransition();
              setSessionState(s => ({
                ...s,
                status: 'transition',
                transitionTimeLeft: exercise.transitionTime,
                currentPoseIndex: nextPoseIdx,
                currentRepetition: 1,
              }));
            }
            return updated;
          });

        } else {
          // Más repeticiones de la misma pose → transición corta
          playTransition();
          setSessionState(s => ({
            ...s,
            status: 'transition',
            transitionTimeLeft: 2,
            currentRepetition: rep + 1,
          }));
        }
      }
    }, 1000);

    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState.status, sessionState.currentPoseIndex, sessionState.currentRepetition]);

  // ─── EFFECT: fase 'transition' ───────────────────────────────
  // Se dispara cada vez que entramos a 'transition' (el status cambia a 'transition'
  // y el par poseIndex+repetition identifica unívocamente la transición).
  useEffect(() => {
    if (sessionState.status !== 'transition' || !exercise) return;

    const targetPoseIdx = sessionState.currentPoseIndex;
    const targetRep     = sessionState.currentRepetition;
    const nextPose      = exercise.poses[targetPoseIdx];
    if (!nextPose) return;

    // Leer el tiempo de transición del estado en el momento de dispararse
    let transLeft = sessionState.transitionTimeLeft;
    if (transLeft <= 0) return;

    clearTimer();
    timerRef.current = setInterval(() => {
      transLeft--;
      setSessionState(s => ({ ...s, transitionTimeLeft: transLeft }));

      if (transLeft <= 0) {
        clearTimer();
        frameScoresRef.current = [];
        setSessionState(s => ({
          ...s,
          status: 'practicing',
          transitionTimeLeft: 0,
          currentPoseTimeLeft: nextPose.holdTime,
          currentPoseIndex: targetPoseIdx,
          currentRepetition: targetRep,
        }));
      }
    }, 1000);

    return clearTimer;
    // El effect se dispara cuando cambia el par (status=transition, poseIndex, repetition)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState.status, sessionState.currentPoseIndex, sessionState.currentRepetition]);

  // ─── Cuenta regresiva de inicio ──────────────────────────────
  const runCountdown = useCallback(() => {
    setSessionState({ ...INITIAL_STATE, status: 'countdown', currentPoseTimeLeft: 3 });

    let count = 3;
    clearTimer();
    timerRef.current = setInterval(() => {
      count--;
      playCountdown();
      if (count <= 0) {
        clearTimer();
        const firstPose = exercise?.poses[0];
        if (!firstPose) return;
        frameScoresRef.current = [];
        repScoresRef.current   = [];
        setSessionState({
          status: 'practicing',
          currentPoseIndex: 0,
          currentRepetition: 1,
          currentPoseTimeLeft: firstPose.holdTime,
          transitionTimeLeft: 0,
          currentScore: 0,
          frameScores: [],
        });
      } else {
        setSessionState(s => ({ ...s, currentPoseTimeLeft: count }));
      }
    }, 1000);
  }, [exercise, clearTimer]);

  // ─── API pública ─────────────────────────────────────────────

  const startSession = useCallback(() => {
    if (!exercise) return;
    resumeAudio();
    sessionStartRef.current = Date.now();
    setSessionResults([]);
    setCompletedSession(null);
    frameScoresRef.current = [];
    repScoresRef.current   = [];
    playSessionStart();
    setTimeout(runCountdown, 800);
  }, [exercise, runCountdown]);

  const recordScore = useCallback((score: number) => {
    if (sessionState.status !== 'practicing') return;
    frameScoresRef.current.push(score);
    setSessionState(s => ({ ...s, currentScore: score }));
    const now = Date.now();
    if (score >= PRECISION_THRESHOLD && now - lastCorrectBeepRef.current > 3000) {
      lastCorrectBeepRef.current = now;
      playCorrect();
    }
  }, [sessionState.status]);

  const skipPose = useCallback(() => {
    if (!exercise || sessionState.status !== 'practicing') return;
    clearTimer();

    const poseIdx   = sessionState.currentPoseIndex;
    const rep       = sessionState.currentRepetition;
    const pose      = exercise.poses[poseIdx];
    if (!pose) return;

    const totalReps = pose.repetitions ?? 1;
    const result    = buildPoseResult(pose, rep, totalReps, frameScoresRef.current, 0);
    repScoresRef.current[poseIdx] = [];

    setSessionResults(prev => {
      const updated = [...prev, result];
      const nextIdx = poseIdx + 1;
      if (nextIdx >= exercise.poses.length) {
        finishSession(updated);
      } else {
        playTransition();
        setSessionState(s => ({
          ...s,
          status: 'transition',
          transitionTimeLeft: exercise.transitionTime,
          currentPoseIndex: nextIdx,
          currentRepetition: 1,
        }));
      }
      return updated;
    });
  }, [exercise, sessionState, clearTimer, finishSession]);

  const stopSession = useCallback(() => {
    clearTimer();
    setSessionState(INITIAL_STATE);
    setSessionResults([]);
    setCompletedSession(null);
    frameScoresRef.current = [];
    repScoresRef.current   = [];
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    sessionState, currentPose, sessionResults, completedSession,
    startSession, recordScore, skipPose, stopSession,
  };
}
