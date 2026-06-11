'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ReferencePose, EvaluationSession } from '@/types/mediapipe';
import { v4 as uuidv4 } from 'uuid';

interface PosesStore {
  poses: ReferencePose[];
  sessions: EvaluationSession[];
  addPose: (pose: Omit<ReferencePose, 'id' | 'createdAt' | 'updatedAt'>) => ReferencePose;
  updatePose: (id: string, updates: Partial<ReferencePose>) => void;
  deletePose: (id: string) => void;
  addSession: (session: Omit<EvaluationSession, 'id'>) => EvaluationSession;
  deleteSession: (id: string) => void;
  getPoseById: (id: string) => ReferencePose | undefined;
}

export const usePosesStore = create<PosesStore>()(
  persist(
    (set, get) => ({
      poses: [],
      sessions: [],

      addPose: pose => {
        const now = new Date().toISOString();
        const newPose: ReferencePose = {
          ...pose,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        };
        set(state => ({ poses: [...state.poses, newPose] }));
        return newPose;
      },

      updatePose: (id, updates) => {
        set(state => ({
          poses: state.poses.map(p =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deletePose: id => {
        set(state => ({ poses: state.poses.filter(p => p.id !== id) }));
      },

      addSession: session => {
        const newSession: EvaluationSession = {
          ...session,
          id: uuidv4(),
        };
        set(state => ({ sessions: [...state.sessions, newSession] }));
        return newSession;
      },

      deleteSession: id => {
        set(state => ({
          sessions: state.sessions.filter(s => s.id !== id),
        }));
      },

      getPoseById: id => {
        return get().poses.find(p => p.id === id);
      },
    }),
    {
      name: 'educ-fisica-poses',
    }
  )
);
