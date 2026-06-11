'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exercise, PracticeSession, ExercisePose } from '@/types/poseflow';
import { v4 as uuidv4 } from 'uuid';

interface ExercisesStore {
  exercises: Exercise[];
  sessions: PracticeSession[];

  addExercise: (ex: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>) => Exercise;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  getExerciseById: (id: string) => Exercise | undefined;

  addSession: (session: Omit<PracticeSession, 'id'>) => PracticeSession;
  deleteSession: (id: string) => void;
  getSessionsByExercise: (exerciseId: string) => PracticeSession[];
}

export const useExercisesStore = create<ExercisesStore>()(
  persist(
    (set, get) => ({
      exercises: [],
      sessions: [],

      addExercise: ex => {
        const now = new Date().toISOString();
        const newEx: Exercise = { ...ex, id: uuidv4(), createdAt: now, updatedAt: now };
        set(state => ({ exercises: [...state.exercises, newEx] }));
        return newEx;
      },

      updateExercise: (id, updates) =>
        set(state => ({
          exercises: state.exercises.map(e =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        })),

      deleteExercise: id =>
        set(state => ({ exercises: state.exercises.filter(e => e.id !== id) })),

      getExerciseById: id => get().exercises.find(e => e.id === id),

      addSession: session => {
        const newSession: PracticeSession = { ...session, id: uuidv4() };
        set(state => ({ sessions: [...state.sessions, newSession] }));
        return newSession;
      },

      deleteSession: id =>
        set(state => ({ sessions: state.sessions.filter(s => s.id !== id) })),

      getSessionsByExercise: exerciseId =>
        get().sessions.filter(s => s.exerciseId === exerciseId),
    }),
    { name: 'poseflow-exercises' }
  )
);

// ─── helpers ─────────────────────────────────────────────────
export function buildExercisePose(
  overrides: Partial<ExercisePose> & { order: number }
): ExercisePose {
  return {
    id: uuidv4(),
    name: `Pose ${overrides.order}`,
    holdTime: 10,
    repetitions: 1,
    landmarks: [],
    worldLandmarks: [],
    angles: {},
    tolerances: {
      rightElbow: 15, leftElbow: 15,
      rightShoulder: 20, leftShoulder: 20,
      rightKnee: 15, leftKnee: 15,
      rightHip: 20, leftHip: 20,
      trunk: 15,
      rightAnkle: 20, leftAnkle: 20,
    },
    minVisibility: 0.5,
    ...overrides,
  };
}
