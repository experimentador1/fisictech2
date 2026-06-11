'use client';

import { PoseEvaluation, JOINT_LABELS, JointStatus } from '@/types/mediapipe';
import { cn } from '@/lib/utils';

interface ScoreDisplayProps {
  evaluation: PoseEvaluation | null;
  className?: string;
  compact?: boolean;
}

const STATUS_STYLES: Record<JointStatus, string> = {
  correct: 'bg-green-500/20 border-green-500 text-green-400',
  adjust: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
  incorrect: 'bg-red-500/20 border-red-500 text-red-400',
  invisible: 'bg-gray-500/20 border-gray-500 text-gray-400',
};

const STATUS_ICONS: Record<JointStatus, string> = {
  correct: '✓',
  adjust: '~',
  incorrect: '✗',
  invisible: '?',
};

const STATUS_LABELS: Record<JointStatus, string> = {
  correct: 'Correcto',
  adjust: 'Ajustar',
  incorrect: 'Corregir',
  invisible: 'No visible',
};

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r="38" fill="none" stroke="#1f2937" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r="38"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute text-2xl font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export function ScoreDisplay({ evaluation, className, compact = false }: ScoreDisplayProps) {
  if (!evaluation || !evaluation.isDetected) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-4 text-gray-400', className)}>
        <div className="text-4xl mb-2">👤</div>
        <p className="text-sm">No se detecta ninguna persona</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Score general */}
      <div className="flex flex-col items-center gap-2">
        <ScoreCircle score={evaluation.overallScore} />
        <p className="text-sm text-gray-400 font-medium">Puntuación general</p>
        <div className="flex gap-4 text-xs text-gray-500">
          <span>Ángulos: <strong className="text-white">{evaluation.angleScore}</strong></span>
          <span>Posición: <strong className="text-white">{evaluation.euclideanScore}</strong></span>
        </div>
      </div>

      {/* Feedback por articulación */}
      {!compact && Object.keys(evaluation.jointFeedback).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Retroalimentación
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {(Object.entries(evaluation.jointFeedback) as [string, NonNullable<typeof evaluation.jointFeedback[keyof typeof evaluation.jointFeedback]>][]).map(([joint, feedback]) => (
              <div
                key={joint}
                className={cn(
                  'flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs',
                  STATUS_STYLES[feedback.status]
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold w-4 text-center">
                    {STATUS_ICONS[feedback.status]}
                  </span>
                  <span>
                    {JOINT_LABELS[joint as keyof typeof JOINT_LABELS] ?? joint}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {feedback.status !== 'invisible' && (
                    <span className="opacity-70">
                      {feedback.currentAngle}° / {feedback.targetAngle}°
                    </span>
                  )}
                  <span className="font-semibold">
                    {STATUS_LABELS[feedback.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
